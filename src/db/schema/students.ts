import { pgTable, serial, varchar, integer, timestamp, text, jsonb, pgEnum, date } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { users } from './users'

export const studentStatusEnum = pgEnum('student_status', ['active', 'graduated', 'transferred', 'suspended', 'expelled'])
export const genderEnum = pgEnum('gender', ['male', 'female', 'other'])

export const students = pgTable('students', {
  id: serial('id').primaryKey(),

  // Identifiers
  studentId: varchar('student_id', { length: 50 }).unique().notNull(), // School-specific ID
  admissionNumber: varchar('admission_number', { length: 50 }),

  // Associations
  schoolId: integer('school_id').references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id), // If student has login
  parentUserIds: jsonb('parent_user_ids').$type<number[]>().default([]), // Array of parent user IDs

  // Personal Info
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  dateOfBirth: date('date_of_birth'),
  gender: genderEnum('gender'),
  avatarUrl: text('avatar_url'),

  // Academic Info
  classId: integer('class_id'), // FK to classes table
  currentTerm: varchar('current_term', { length: 20 }), // "Term 1", "Term 2", "Term 3"
  academicYear: varchar('academic_year', { length: 9 }), // "2024/2025"
  enrollmentDate: timestamp('enrollment_date'),
  graduationDate: timestamp('graduation_date'),

  // Status & Notes
  status: studentStatusEnum('status').default('active'),
  scholarshipStatus: text('scholarship_status'), // Full/Partial scholarship details
  specialNeeds: text('special_needs'),
  medicalInfo: jsonb('medical_info').$type<{
    allergies?: string[]
    conditions?: string[]
    emergencyContact?: string
  }>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Type exports
export type Student = typeof students.$inferSelect
export type NewStudent = typeof students.$inferInsert
