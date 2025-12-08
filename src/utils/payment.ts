import axios from 'axios'
import crypto from 'crypto'
import { config } from '@/core/config'

// Payment gateway interfaces
export interface PaymentInitializationRequest {
  amount: number
  email: string
  reference: string
  metadata?: any
  callback_url?: string
  customer?: {
    name: string
    phone?: string
  }
}

export interface PaymentVerificationResponse {
  success: boolean
  data?: {
    status: string
    reference: string
    amount: number
    currency: string
    paid_at?: string
    channel?: string
    gateway_response?: any
  }
  message?: string
}

export interface WebhookVerificationResult {
  isValid: boolean
  data?: any
}

// Arca Payment Gateway Service
export class ArcaPaymentService {
  private apiKey: string
  private secretKey: string
  private baseUrl: string

  constructor() {
    if (!config.ARCA_API_KEY || !config.ARCA_SECRET_KEY) {
      throw new Error('Arca API credentials not configured')
    }

    this.apiKey = config.ARCA_API_KEY
    this.secretKey = config.ARCA_SECRET_KEY
    this.baseUrl = config.ARCA_BASE_URL
  }

  async initializePayment(data: PaymentInitializationRequest) {
    try {
      const payload = {
        amount: Math.round(data.amount * 100), // Convert to kobo
        email: data.email,
        reference: data.reference,
        callback_url: data.callback_url || `${config.FRONTEND_URL}/payment/callback`,
        metadata: {
          ...data.metadata,
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: data.customer?.name || ""
            }
          ]
        }
      }

      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      )

      if (response.data.status === 'success') {
        return {
          success: true,
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
          reference: response.data.data.reference,
        }
      } else {
        throw new Error(response.data.message || 'Payment initialization failed')
      }
    } catch (error: any) {
      console.error('Arca payment initialization failed:', error)

      if (error.response) {
        throw new Error(error.response.data?.message || 'Payment initialization failed')
      }
      throw new Error('Failed to connect to payment gateway')
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
          timeout: 30000,
        }
      )

      const { data } = response.data

      return {
        success: true,
        data: {
          status: data.status,
          reference: data.reference,
          amount: data.amount / 100, // Convert from kobo
          currency: data.currency,
          paid_at: data.paid_at,
          channel: data.channel,
          gateway_response: data,
        },
      }
    } catch (error: any) {
      console.error('Arca payment verification failed:', error)

      return {
        success: false,
        message: error.response?.data?.message || 'Payment verification failed',
      }
    }
  }

  verifyWebhook(payload: string, signature: string): WebhookVerificationResult {
    try {
      if (!config.ARCA_WEBHOOK_SECRET) {
        console.warn('Arca webhook secret not configured')
        return { isValid: false }
      }

      const hash = crypto
        .createHmac('sha512', config.ARCA_WEBHOOK_SECRET)
        .update(payload, 'utf8')
        .digest('hex')

      if (hash === signature) {
        return {
          isValid: true,
          data: JSON.parse(payload),
        }
      }

      return { isValid: false }
    } catch (error) {
      console.error('Arca webhook verification failed:', error)
      return { isValid: false }
    }
  }

  async getTransactionHistory(page = 1, perPage = 50) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
          params: {
            page,
            perPage,
          },
          timeout: 30000,
        }
      )

      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta,
      }
    } catch (error: any) {
      console.error('Failed to fetch Arca transaction history:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch transactions',
      }
    }
  }
}

// Flutterwave Payment Gateway Service
export class FlutterwavePaymentService {
  private publicKey: string
  private secretKey: string
  private encryptionKey: string
  private baseUrl: string = 'https://api.flutterwave.com/v3'

  constructor() {
    if (!config.FLUTTERWAVE_SECRET_KEY || !config.FLUTTERWAVE_PUBLIC_KEY) {
      throw new Error('Flutterwave API credentials not configured')
    }

    this.publicKey = config.FLUTTERWAVE_PUBLIC_KEY
    this.secretKey = config.FLUTTERWAVE_SECRET_KEY
    this.encryptionKey = config.FLUTTERWAVE_ENCRYPTION_KEY || ''
  }

  async initializePayment(data: PaymentInitializationRequest) {
    try {
      const payload = {
        tx_ref: data.reference,
        amount: data.amount,
        currency: 'NGN',
        redirect_url: data.callback_url || `${config.FRONTEND_URL}/payment/callback`,
        payment_options: 'card,banktransfer,ussd,mobilemoneyghana',
        customer: {
          email: data.email,
          phonenumber: data.customer?.phone || '',
          name: data.customer?.name || '',
        },
        customizations: {
          title: 'Payng School Fee Payment',
          description: 'Payment for school fees',
          logo: 'https://payng.ng/logo.png',
        },
        meta: data.metadata || {},
      }

      const response = await axios.post(
        `${this.baseUrl}/payments`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      )

      if (response.data.status === 'success') {
        return {
          success: true,
          authorization_url: response.data.data.link,
          access_code: response.data.data.link,
          reference: data.reference,
        }
      } else {
        throw new Error(response.data.message || 'Payment initialization failed')
      }
    } catch (error: any) {
      console.error('Flutterwave payment initialization failed:', error)

      if (error.response) {
        throw new Error(error.response.data?.message || 'Payment initialization failed')
      }
      throw new Error('Failed to connect to payment gateway')
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerificationResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
          timeout: 30000,
        }
      )

      const { data } = response.data

      return {
        success: true,
        data: {
          status: data.status,
          reference: data.tx_ref,
          amount: data.amount,
          currency: data.currency,
          paid_at: data.created_at,
          channel: data.payment_type,
          gateway_response: data,
        },
      }
    } catch (error: any) {
      console.error('Flutterwave payment verification failed:', error)

      return {
        success: false,
        message: error.response?.data?.message || 'Payment verification failed',
      }
    }
  }

  verifyWebhook(payload: string, signature: string): WebhookVerificationResult {
    try {
      const data = JSON.parse(payload)

      // Flutterwave uses a different verification method
      // You should verify the webhook signature according to their documentation
      const hash = crypto
        .createHash('sha256')
        .update(payload + config.FLUTTERWAVE_SECRET_KEY)
        .digest('hex')

      if (hash === signature) {
        return {
          isValid: true,
          data,
        }
      }

      return { isValid: false }
    } catch (error) {
      console.error('Flutterwave webhook verification failed:', error)
      return { isValid: false }
    }
  }

  async getTransactionHistory(page = 1, limit = 50) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
          params: {
            page,
            limit,
          },
          timeout: 30000,
        }
      )

      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta,
      }
    } catch (error: any) {
      console.error('Failed to fetch Flutterwave transaction history:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch transactions',
      }
    }
  }
}

// Payment Gateway Manager - handles fallback logic
export class PaymentGatewayManager {
  private arcaService: ArcaPaymentService | null = null
  private flutterwaveService: FlutterwavePaymentService | null = null

  constructor() {
    try {
      if (config.ARCA_API_KEY && config.ARCA_SECRET_KEY) {
        this.arcaService = new ArcaPaymentService()
      }
    } catch (error) {
      console.warn('Arca service not available:', error)
    }

    try {
      if (config.FLUTTERWAVE_SECRET_KEY && config.FLUTTERWAVE_PUBLIC_KEY) {
        this.flutterwaveService = new FlutterwavePaymentService()
      }
    } catch (error) {
      console.warn('Flutterwave service not available:', error)
    }

    if (!this.arcaService && !this.flutterwaveService) {
      console.warn('No payment gateways configured')
    }
  }

  async initializePayment(data: PaymentInitializationRequest, preferredGateway?: 'arca' | 'flutterwave') {
    // Try preferred gateway first
    if (preferredGateway === 'arca' && this.arcaService) {
      try {
        const result = await this.arcaService.initializePayment(data)
        return { ...result, gateway: 'arca' }
      } catch (error) {
        console.error('Preferred gateway (Arca) failed, trying fallback:', error)
      }
    }

    if (preferredGateway === 'flutterwave' && this.flutterwaveService) {
      try {
        const result = await this.flutterwaveService.initializePayment(data)
        return { ...result, gateway: 'flutterwave' }
      } catch (error) {
        console.error('Preferred gateway (Flutterwave) failed, trying fallback:', error)
      }
    }

    // Try Arca first (primary), then Flutterwave (fallback)
    if (this.arcaService && preferredGateway !== 'flutterwave') {
      try {
        const result = await this.arcaService.initializePayment(data)
        return { ...result, gateway: 'arca' }
      } catch (error) {
        console.error('Arca failed, trying Flutterwave fallback:', error)
      }
    }

    if (this.flutterwaveService) {
      try {
        const result = await this.flutterwaveService.initializePayment(data)
        return { ...result, gateway: 'flutterwave' }
      } catch (error) {
        console.error('Flutterwave also failed:', error)
        throw error
      }
    }

    throw new Error('No payment gateways available')
  }

  async verifyPayment(reference: string, gateway: 'arca' | 'flutterwave') {
    if (gateway === 'arca' && this.arcaService) {
      return await this.arcaService.verifyPayment(reference)
    }

    if (gateway === 'flutterwave' && this.flutterwaveService) {
      return await this.flutterwaveService.verifyPayment(reference)
    }

    throw new Error(`Gateway ${gateway} not available`)
  }

  verifyWebhook(payload: string, signature: string, gateway: 'arca' | 'flutterwave') {
    if (gateway === 'arca' && this.arcaService) {
      return this.arcaService.verifyWebhook(payload, signature)
    }

    if (gateway === 'flutterwave' && this.flutterwaveService) {
      return this.flutterwaveService.verifyWebhook(payload, signature)
    }

    return { isValid: false }
  }

  getAvailableGateways() {
    const gateways = []
    if (this.arcaService) gateways.push('arca')
    if (this.flutterwaveService) gateways.push('flutterwave')
    return gateways
  }

  isGatewayAvailable(gateway: 'arca' | 'flutterwave') {
    return this.getAvailableGateways().includes(gateway)
  }
}

// Helper functions for backward compatibility
export async function initiateArcaPayment(data: PaymentInitializationRequest) {
  const arcaService = new ArcaPaymentService()
  return await arcaService.initializePayment(data)
}

export async function verifyArcaPayment(reference: string) {
  const arcaService = new ArcaPaymentService()
  return await arcaService.verifyPayment(reference)
}

export async function initializeFlutterwavePayment(data: PaymentInitializationRequest) {
  const flwService = new FlutterwavePaymentService()
  return await flwService.initializePayment(data)
}

export async function verifyFlutterwavePayment(transactionId: string) {
  const flwService = new FlutterwavePaymentService()
  return await flwService.verifyPayment(transactionId)
}

// Generate payment reference
export function generatePaymentReference(prefix = 'PAY'): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${timestamp}-${random}`
}

// Amount validation helpers
export function validateAmount(amount: number, minAmount = 100): boolean {
  return amount >= minAmount && amount <= 10000000 // Max 10 million naira
}

export function formatCurrency(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

// Export singleton instance
export const paymentGateway = new PaymentGatewayManager()
