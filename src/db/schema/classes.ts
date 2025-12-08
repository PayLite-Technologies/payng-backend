import { pgTable, serial, varchar, integer, timestamp, text } from 'drizzle-orm/pg-core'
import { schools } from './schools'

export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id, { onDelete: 'cascade' }).notNull(),

  // Class Info
  name: varchar('name', { length: 100 }).notNull(), // e.g., "JSS 1A"
  level: varchar('level', { length: 50 }), // Primary, JSS, SSS
  section: varchar('section', { length: 10 }), // A, B, C
  academicYear: varchar('academic_year', { length: 9 }),

  // Capacity
  capacity: integer('capacity').default(40),
  currentEnrollment: integer('current_enrollment').default(0),

  // Teacher
  classTeacherUserId: integer('class_teacher_user_id'),

  // Notes
  description: text('description'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Type exports
export type Class = typeof classes.$inferSelect
export type NewClass = typeof classes.$inferInsert
