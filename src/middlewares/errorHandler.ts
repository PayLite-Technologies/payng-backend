import type { Context, ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'

export const errorHandler: ErrorHandler = (err: Error, c: Context) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  })

  // Handle HTTP exceptions from Hono
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: err.message,
        code: err.status,
      },
      err.status
    )
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: 'Validation failed',
        details: err.errors.map(error => ({
          field: error.path.join('.'),
          message: error.message,
          code: error.code,
        })),
      },
      400
    )
  }

  // Handle database-related errors
  if (err.message.includes('duplicate key')) {
    return c.json(
      {
        success: false,
        error: 'Resource already exists',
        message: 'A record with this information already exists',
      },
      409
    )
  }

  if (err.message.includes('foreign key')) {
    return c.json(
      {
        success: false,
        error: 'Invalid reference',
        message: 'Referenced resource does not exist',
      },
      400
    )
  }

  if (err.message.includes('not null')) {
    return c.json(
      {
        success: false,
        error: 'Missing required field',
        message: 'One or more required fields are missing',
      },
      400
    )
  }

  // Handle connection and timeout errors
  if (err.message.includes('ECONNREFUSED') || err.message.includes('timeout')) {
    return c.json(
      {
        success: false,
        error: 'Service unavailable',
        message: 'Unable to connect to external service',
      },
      503
    )
  }

  // Handle authentication errors
  if (err.message.includes('Unauthorized') || err.message.includes('Invalid token')) {
    return c.json(
      {
        success: false,
        error: 'Authentication failed',
        message: 'Invalid or expired authentication credentials',
      },
      401
    )
  }

  // Handle authorization errors
  if (err.message.includes('Access denied') || err.message.includes('Forbidden')) {
    return c.json(
      {
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to perform this action',
      },
      403
    )
  }

  // Handle payment gateway errors
  if (err.message.includes('Payment') || err.message.includes('Gateway')) {
    return c.json(
      {
        success: false,
        error: 'Payment processing failed',
        message: err.message,
        code: 'PAYMENT_ERROR',
      },
      400
    )
  }

  // Handle file upload errors
  if (err.message.includes('File too large') || err.message.includes('Invalid file type')) {
    return c.json(
      {
        success: false,
        error: 'File upload failed',
        message: err.message,
      },
      400
    )
  }

  // Handle rate limiting errors
  if (err.message.includes('Rate limit')) {
    return c.json(
      {
        success: false,
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
      },
      429
    )
  }

  // Handle JSON parsing errors
  if (err.message.includes('JSON') || err.message.includes('parse')) {
    return c.json(
      {
        success: false,
        error: 'Invalid request format',
        message: 'Request body must be valid JSON',
      },
      400
    )
  }

  // Handle email service errors
  if (err.message.includes('Email') || err.message.includes('SMTP')) {
    console.error('Email service error:', err)
    return c.json(
      {
        success: false,
        error: 'Email delivery failed',
        message: 'Unable to send email notification',
        code: 'EMAIL_ERROR',
      },
      502
    )
  }

  // Handle SMS service errors
  if (err.message.includes('SMS') || err.message.includes('Text message')) {
    console.error('SMS service error:', err)
    return c.json(
      {
        success: false,
        error: 'SMS delivery failed',
        message: 'Unable to send SMS notification',
        code: 'SMS_ERROR',
      },
      502
    )
  }

  // Handle PDF generation errors
  if (err.message.includes('PDF') || err.message.includes('receipt generation')) {
    console.error('PDF generation error:', err)
    return c.json(
      {
        success: false,
        error: 'Document generation failed',
        message: 'Unable to generate receipt document',
        code: 'PDF_ERROR',
      },
      500
    )
  }

  // Handle specific business logic errors
  if (err.message.includes('School not found')) {
    return c.json(
      {
        success: false,
        error: 'School not found',
        message: 'The specified school does not exist or is inactive',
      },
      404
    )
  }

  if (err.message.includes('Student not found')) {
    return c.json(
      {
        success: false,
        error: 'Student not found',
        message: 'The specified student does not exist',
      },
      404
    )
  }

  if (err.message.includes('Insufficient balance') || err.message.includes('Insufficient funds')) {
    return c.json(
      {
        success: false,
        error: 'Insufficient funds',
        message: 'The payment amount exceeds available balance',
        code: 'INSUFFICIENT_FUNDS',
      },
      400
    )
  }

  if (err.message.includes('Fee already paid')) {
    return c.json(
      {
        success: false,
        error: 'Fee already paid',
        message: 'This fee has already been paid',
        code: 'ALREADY_PAID',
      },
      409
    )
  }

  // Handle generic business errors (thrown by services)
  const businessErrorPatterns = [
    'Invalid',
    'Cannot',
    'Already',
    'Not allowed',
    'Expired',
    'Disabled',
    'Suspended',
  ]

  const isBusinessError = businessErrorPatterns.some(pattern =>
    err.message.includes(pattern)
  )

  if (isBusinessError) {
    return c.json(
      {
        success: false,
        error: 'Business rule violation',
        message: err.message,
      },
      400
    )
  }

  // Log unexpected errors for monitoring
  if (process.env.NODE_ENV === 'production') {
    // In production, you might want to send this to a monitoring service
    console.error('Unexpected error in production:', {
      message: err.message,
      stack: err.stack,
      path: c.req.path,
      method: c.req.method,
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
    })
  }

  // Default error response
  return c.json(
    {
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred. Please try again later.',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: {
          name: err.name,
          cause: err.cause,
        },
      }),
    },
    500
  )
}

// Helper function to create custom HTTP exceptions
export function createHttpException(message: string, status: number = 400) {
  return new HTTPException(status, { message })
}

// Helper function to create validation error
export function createValidationError(field: string, message: string) {
  const error = new Error(message)
  error.name = 'ValidationError'
  return error
}

// Helper function to create business rule error
export function createBusinessError(message: string, code?: string) {
  const error = new Error(message)
  error.name = 'BusinessError'
  if (code) {
    ;(error as any).code = code
  }
  return error
}

// Helper function to create payment error
export function createPaymentError(message: string, gatewayResponse?: any) {
  const error = new Error(message)
  error.name = 'PaymentError'
  if (gatewayResponse) {
    ;(error as any).gatewayResponse = gatewayResponse
  }
  return error
}

// Helper function to create notification error
export function createNotificationError(type: 'email' | 'sms' | 'whatsapp', message: string) {
  const error = new Error(message)
  error.name = `${type.toUpperCase()}Error`
  return error
}
