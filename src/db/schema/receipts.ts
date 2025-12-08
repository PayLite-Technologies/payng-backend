import { pgTable, serial, integer, varchar, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { feePayments } from './payments'

export const receipts = pgTable('receipts', {
  id: serial('id').primaryKey(),
  paymentId: integer('payment_id').references(() => feePayments.id, { onDelete: 'cascade' }).notNull(),

  // Receipt Details
  receiptNumber: varchar('receipt_number', { length: 100 }).unique().notNull(), // "REC-2024-XXXXX"
  pdfUrl: text('pdf_url'), // Cloud storage URL or base64

  // Data Snapshot (Store payment details at time of receipt generation)
  receiptData: jsonb('receipt_data').$type<{
    studentName: string
    schoolName: string
    amount: number
    paymentDate: string
    feeItems: { name: string; amount: number }[]
    studentId: string
    parentName?: string
    parentEmail?: string
    parentPhone?: string
    receiptNumber: string
    currency: string
    paymentMethod: string
    transactionId?: string
  }>(),

  // Status
  emailSent: boolean('email_sent').default(false),
  smsSent: boolean('sms_sent').default(false),
  whatsappSent: boolean('whatsapp_sent').default(false),

  // Email details
  emailSentAt: timestamp('email_sent_at'),
  emailRecipient: varchar('email_recipient', { length: 255 }),
  smsSentAt: timestamp('sms_sent_at'),
  smsRecipient: varchar('sms_recipient', { length: 20 }),
  whatsappSentAt: timestamp('whatsapp_sent_at'),
  whatsappRecipient: varchar('whatsapp_recipient', { length: 20 }),

  // Retry tracking
  emailRetryCount: integer('email_retry_count').default(0),
  smsRetryCount: integer('sms_retry_count').default(0),
  whatsappRetryCount: integer('whatsapp_retry_count').default(0),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Type exports
export type Receipt = typeof receipts.$inferSelect
export type NewReceipt = typeof receipts.$inferInsert
