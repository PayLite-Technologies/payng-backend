import { pgTable, serial, varchar, integer, decimal, timestamp, pgEnum, text, jsonb, boolean } from 'drizzle-orm/pg-core'
import { schools } from './schools'

export const feeTypeEnum = pgEnum('fee_type', ['tuition', 'transport', 'textbook', 'uniform', 'examination', 'boarding', 'sports', 'technology', 'library', 'other'])
export const feeFrequencyEnum = pgEnum('fee_frequency', ['one_time', 'per_term', 'per_year', 'monthly'])
export const feeAssignmentStatusEnum = pgEnum('fee_assignment_status', ['pending', 'partial', 'paid', 'overdue', 'waived'])
export const paymentPlanStatusEnum = pgEnum('payment_plan_status', ['active', 'completed', 'defaulted', 'cancelled'])

// Fee Templates (Defined by school)
export const feeSchedules = pgTable('fee_schedules', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id, { onDelete: 'cascade' }).notNull(),

  // Fee Details
  name: varchar('name', { length: 255 }).notNull(), // "JSS 1 Tuition Fee"
  feeType: feeTypeEnum('fee_type').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('NGN'),

  // Application Rules
  academicYear: varchar('academic_year', { length: 9 }),
  term: varchar('term', { length: 20 }), // "Term 1", "Term 2", "Term 3", null for yearly
  frequency: feeFrequencyEnum('frequency').default('per_term'),

  // Applicability (JSON for flexible filtering)
  applicableTo: jsonb('applicable_to').$type<{
    classIds?: number[]
    levels?: string[] // ["Primary", "JSS"]
    allStudents?: boolean
  }>(),

  // Dates
  dueDate: timestamp('due_date'),
  lateFeesApply: boolean('late_fees_apply').default(true),
  lateFeePercentage: decimal('late_fee_percentage', { precision: 5, scale: 2 }).default('5.00'),

  // Description
  description: text('description'),

  // Status
  isActive: boolean('is_active').default(true),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Individual Student Assignments (Links students to fee schedules)
export const feeAssignments = pgTable('fee_assignments', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').notNull(), // FK to students
  feeScheduleId: integer('fee_schedule_id').references(() => feeSchedules.id, { onDelete: 'cascade' }).notNull(),

  // Assignment Details
  academicYear: varchar('academic_year', { length: 9 }),
  term: varchar('term', { length: 20 }),

  // Amount (can differ from schedule if discounts applied)
  originalAmount: decimal('original_amount', { precision: 10, scale: 2 }).notNull(),
  finalAmount: decimal('final_amount', { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0.00'),
  discountReason: text('discount_reason'), // "Sibling discount", "Scholarship"

  // Payment Tracking
  amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).default('0.00'),
  amountDue: decimal('amount_due', { precision: 10, scale: 2 }).notNull(),

  // Status
  status: feeAssignmentStatusEnum('status').default('pending'),
  dueDate: timestamp('due_date'),

  // Payment Plan (if installment)
  paymentPlanId: integer('payment_plan_id'), // FK to payment_plans

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Installment Plans
export const paymentPlans = pgTable('payment_plans', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  studentId: integer('student_id').notNull(),
  feeAssignmentId: integer('fee_assignment_id').references(() => feeAssignments.id, { onDelete: 'cascade' }),

  // Plan Details
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  numberOfInstallments: integer('number_of_installments').notNull(),
  installmentAmount: decimal('installment_amount', { precision: 10, scale: 2 }).notNull(),

  // Status
  status: paymentPlanStatusEnum('status').default('active'),

  // Tracking
  installmentsPaid: integer('installments_paid').default(0),
  nextInstallmentDue: timestamp('next_installment_due'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Type exports
export type FeeSchedule = typeof feeSchedules.$inferSelect
export type NewFeeSchedule = typeof feeSchedules.$inferInsert
export type FeeAssignment = typeof feeAssignments.$inferSelect
export type NewFeeAssignment = typeof feeAssignments.$inferInsert
export type PaymentPlan = typeof paymentPlans.$inferSelect
export type NewPaymentPlan = typeof paymentPlans.$inferInsert
