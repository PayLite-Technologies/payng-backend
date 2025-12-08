import { pgTable, serial, integer, varchar, decimal, timestamp, text, jsonb, pgEnum, boolean } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { feeAssignments } from './fees'

export const paymentMethodEnum = pgEnum('payment_method', ['card', 'bank_transfer', 'ussd', 'mobile_money', 'cash'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'successful', 'failed', 'refunded', 'cancelled'])
export const paymentGatewayEnum = pgEnum('payment_gateway', ['arca', 'flutterwave', 'manual'])

export const feePayments = pgTable('fee_payments', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').notNull(),
  parentUserId: integer('parent_user_id'), // Who initiated payment

  // Payment Reference
  referenceNumber: varchar('reference_number', { length: 100 }).unique().notNull(), // "PAY-2024-XXXXX"
  externalReference: varchar('external_reference', { length: 255 }), // Gateway's transaction ID

  // Amount
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('NGN'),

  // Payment Details
  method: paymentMethodEnum('method').notNull(),
  gateway: paymentGatewayEnum('gateway'),
  status: paymentStatusEnum('status').default('pending'),

  // Fee Assignments Paid (JSON array of assignment IDs + amounts)
  feeAssignments: jsonb('fee_assignments').$type<{
    assignmentId: number
    amount: number
  }[]>(),

  // Gateway Response (Store full response for reconciliation)
  gatewayResponse: jsonb('gateway_response'),

  // Metadata
  paidAt: timestamp('paid_at'),
  failureReason: text('failure_reason'),
  notes: text('notes'),

  // Receipts
  receiptGenerated: boolean('receipt_generated').default(false),
  receiptId: integer('receipt_id'), // FK to receipts table

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Type exports
export type FeePayment = typeof feePayments.$inferSelect
export type NewFeePayment = typeof feePayments.$inferInsert
