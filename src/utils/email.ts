import { Resend } from 'resend'
import { config } from '@/core/config'

const resend = new Resend(config.RESEND_API_KEY)

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  from?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    type?: string
  }>
}

export class EmailService {
  private fromEmail: string

  constructor() {
    this.fromEmail = config.FROM_EMAIL
  }

  async sendEmail(template: EmailTemplate) {
    if (!config.RESEND_API_KEY) {
      console.warn('Resend API key not configured, skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    try {
      const { data, error } = await resend.emails.send({
        from: template.from || this.fromEmail,
        to: Array.isArray(template.to) ? template.to : [template.to],
        subject: template.subject,
        html: template.html,
        attachments: template.attachments,
      })

      if (error) {
        console.error('Email send failed:', error)
        throw new Error(error.message)
      }

      return { success: true, data }
    } catch (error: any) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }
  }

  async sendWelcomeEmail(to: string, firstName: string, schoolName: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Welcome to Payng!</h1>
          <p style="color: #64748b; margin: 10px 0 0 0;">School Fee Management Made Easy</p>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0;">Hello <strong>${firstName}</strong>,</p>
          <p style="margin: 0;">Welcome to Payng! Your account has been created successfully for <strong>${schoolName}</strong>.</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin-bottom: 15px;">What you can do with Payng:</h3>
          <ul style="color: #4b5563; line-height: 1.6;">
            <li>View and pay school fees online</li>
            <li>Track payment history and receipts</li>
            <li>Receive payment reminders and notifications</li>
            <li>Download official receipts instantly</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.FRONTEND_URL}/login"
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            Login to Your Account
          </a>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>Need help? Contact our support team at support@payng.ng</p>
          <p style="margin-top: 20px;">© ${new Date().getFullYear()} Payng. All rights reserved.</p>
        </div>
      </div>
    `

    return this.sendEmail({
      to,
      subject: `Welcome to Payng - ${schoolName}`,
      html,
    })
  }

  async sendPaymentReceiptEmail(to: string, receiptData: {
    studentName: string
    schoolName: string
    amount: number
    currency: string
    receiptNumber: string
    paymentDate: string
    feeItems: Array<{ name: string; amount: number }>
    transactionId?: string
  }, pdfAttachment?: { content: string | Buffer; filename: string }) {
    const formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: receiptData.currency,
    }).format(receiptData.amount)

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0;">Payment Received</h1>
          <p style="color: #64748b; margin: 10px 0 0 0;">Thank you for your payment</p>
        </div>

        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0 0 15px 0; font-size: 18px;">Payment Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #374151; font-weight: 500;">Student:</td>
              <td style="padding: 8px 0; color: #1f2937;">${receiptData.studentName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #374151; font-weight: 500;">School:</td>
              <td style="padding: 8px 0; color: #1f2937;">${receiptData.schoolName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #374151; font-weight: 500;">Amount:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 18px;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #374151; font-weight: 500;">Receipt No:</td>
              <td style="padding: 8px 0; color: #1f2937;">${receiptData.receiptNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #374151; font-weight: 500;">Date:</td>
              <td style="padding: 8px 0; color: #1f2937;">${receiptData.paymentDate}</td>
            </tr>
            ${receiptData.transactionId ? `
            <tr>
              <td style="padding: 8px 0; color: #374151; font-weight: 500;">Transaction ID:</td>
              <td style="padding: 8px 0; color: #1f2937; font-family: monospace;">${receiptData.transactionId}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin-bottom: 15px;">Fee Breakdown</h3>
          <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background-color: #e2e8f0;">
                <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Fee Type</th>
                <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${receiptData.feeItems.map(item => `
                <tr>
                  <td style="padding: 10px 12px; color: #4b5563; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
                  <td style="padding: 10px 12px; text-align: right; color: #1f2937; border-bottom: 1px solid #e2e8f0;">
                    ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: receiptData.currency }).format(item.amount)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 6px; margin-bottom: 30px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Important:</strong> Please keep this receipt for your records. You can also download a PDF copy from your Payng account.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.FRONTEND_URL}/receipts/${receiptData.receiptNumber}"
             style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            View Receipt Online
          </a>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>Questions about this payment? Contact ${receiptData.schoolName} or our support team.</p>
          <p style="margin-top: 20px;">© ${new Date().getFullYear()} Payng. All rights reserved.</p>
        </div>
      </div>
    `

    const emailData: EmailTemplate = {
      to,
      subject: `Payment Receipt - ${receiptData.receiptNumber} | ${receiptData.schoolName}`,
      html,
    }

    if (pdfAttachment) {
      emailData.attachments = [{
        filename: pdfAttachment.filename,
        content: pdfAttachment.content,
        type: 'application/pdf',
      }]
    }

    return this.sendEmail(emailData)
  }

  async sendPaymentReminderEmail(to: string, reminderData: {
    studentName: string
    parentName: string
    schoolName: string
    overdueAmount: number
    currency: string
    dueDate: string
    feeItems: Array<{ name: string; amount: number; dueDate: string }>
    daysOverdue?: number
  }) {
    const formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: reminderData.currency,
    }).format(reminderData.overdueAmount)

    const isOverdue = reminderData.daysOverdue && reminderData.daysOverdue > 0

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${isOverdue ? '#dc2626' : '#f59e0b'}; margin: 0;">
            ${isOverdue ? 'Payment Overdue' : 'Payment Reminder'}
          </h1>
          <p style="color: #64748b; margin: 10px 0 0 0;">
            ${reminderData.schoolName}
          </p>
        </div>

        <div style="background-color: ${isOverdue ? '#fef2f2' : '#fffbeb'}; border: 1px solid ${isOverdue ? '#fecaca' : '#fed7aa'}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0;">Dear <strong>${reminderData.parentName}</strong>,</p>
          <p style="margin: 0;">
            This is a ${isOverdue ? 'reminder that payment is overdue' : 'friendly reminder about upcoming payment'} for
            <strong>${reminderData.studentName}</strong>.
          </p>
          ${isOverdue ? `
            <p style="margin: 15px 0 0 0; color: #dc2626; font-weight: 500;">
              Payment is ${reminderData.daysOverdue} days overdue.
            </p>
          ` : ''}
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin-bottom: 15px;">Outstanding Fees</h3>
          <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background-color: #e2e8f0;">
                <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Fee Type</th>
                <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600;">Due Date</th>
                <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${reminderData.feeItems.map(item => `
                <tr>
                  <td style="padding: 10px 12px; color: #4b5563; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
                  <td style="padding: 10px 12px; text-align: center; color: #4b5563; border-bottom: 1px solid #e2e8f0;">${item.dueDate}</td>
                  <td style="padding: 10px 12px; text-align: right; color: #1f2937; border-bottom: 1px solid #e2e8f0;">
                    ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: reminderData.currency }).format(item.amount)}
                  </td>
                </tr>
              `).join('')}
              <tr style="background-color: #e2e8f0; font-weight: 600;">
                <td style="padding: 12px; color: #374151;">Total Outstanding</td>
                <td style="padding: 12px;"></td>
                <td style="padding: 12px; text-align: right; color: #1f2937; font-size: 18px;">${formattedAmount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.FRONTEND_URL}/payments/new"
             style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 16px;">
            Make Payment Now
          </a>
        </div>

        ${isOverdue ? `
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
              <strong>Late Fee Notice:</strong> Additional charges may apply for overdue payments. Please settle your account as soon as possible.
            </p>
          </div>
        ` : ''}

        <div style="margin-bottom: 20px; color: #4b5563; font-size: 14px; line-height: 1.6;">
          <p><strong>Payment Options Available:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Online payment via debit/credit card</li>
            <li>Bank transfer</li>
            <li>USSD payment</li>
          </ul>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>For payment assistance, contact ${reminderData.schoolName} or our support team at support@payng.ng</p>
          <p style="margin-top: 20px;">© ${new Date().getFullYear()} Payng. All rights reserved.</p>
        </div>
      </div>
    `

    return this.sendEmail({
      to,
      subject: `${isOverdue ? 'OVERDUE' : 'REMINDER'}: School Fee Payment - ${reminderData.studentName}`,
      html,
    })
  }

  async sendPasswordResetEmail(to: string, resetToken: string, firstName: string) {
    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0;">Password Reset Request</h1>
          <p style="color: #64748b; margin: 10px 0 0 0;">Payng Account Security</p>
        </div>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px 0;">Hello <strong>${firstName}</strong>,</p>
          <p style="margin: 0;">We received a request to reset your password for your Payng account. Click the button below to create a new password:</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            Reset Your Password
          </a>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fed7aa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
          </p>
        </div>

        <div style="margin-bottom: 20px; color: #4b5563; font-size: 14px;">
          <p><strong>For your security:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.6;">
            <li>Never share your password with anyone</li>
            <li>Use a strong password with letters, numbers, and symbols</li>
            <li>Don't reuse passwords from other accounts</li>
          </ul>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>If you have trouble clicking the button, copy this link: <br>
             <span style="font-family: monospace; background-color: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 12px; word-break: break-all;">${resetUrl}</span>
          </p>
          <p style="margin-top: 20px;">© ${new Date().getFullYear()} Payng. All rights reserved.</p>
        </div>
      </div>
    `

    return this.sendEmail({
      to,
      subject: 'Reset Your Payng Password',
      html,
    })
  }

  async sendEmailVerificationEmail(to: string, verificationToken: string, firstName: string) {
    const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(to)}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Verify Your Email</h1>
          <p style="color: #64748b; margin: 10px 0 0 0;">Complete your Payng registration</p>
        </div>

        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px 0;">Hello <strong>${firstName}</strong>,</p>
          <p style="margin: 0;">Thank you for signing up for Payng! To complete your registration and start managing school fee payments, please verify your email address by clicking the button below:</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            Verify Email Address
          </a>
        </div>

        <div style="background-color: #f0f9ff; border: 1px solid #7dd3fc; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
            <strong>Why verify?</strong> Email verification helps us ensure account security and enables us to send you important payment notifications and receipts.
          </p>
        </div>

        <div style="margin-bottom: 20px; color: #4b5563; font-size: 14px;">
          <p>If you didn't create a Payng account, please ignore this email.</p>
          <p style="margin-top: 10px;"><strong>Note:</strong> This verification link will expire in 24 hours.</p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>If you have trouble clicking the button, copy this link: <br>
             <span style="font-family: monospace; background-color: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 12px; word-break: break-all;">${verificationUrl}</span>
          </p>
          <p style="margin-top: 20px;">Need help? Contact us at support@payng.ng</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} Payng. All rights reserved.</p>
        </div>
      </div>
    `

    return this.sendEmail({
      to,
      subject: 'Verify Your Payng Account',
      html,
    })
  }
}

// Export singleton instance
export const emailService = new EmailService()

// Export helper function for backward compatibility
export async function sendEmail(to: string, subject: string, html: string) {
  return emailService.sendEmail({ to, subject, html })
}
