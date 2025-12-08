import { pgTable, serial, varchar, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core'
import { users } from './users'

export const schools = pgTable('schools', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).unique().notNull(), // e.g., "SCH001"

  // Contact Info
  email: varchar('email', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }).default('Nigeria'),

  // Branding
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),

  // Configuration
  currency: varchar('currency', { length: 10 }).default('NGN'),
  academicYearFormat: varchar('academic_year_format', { length: 20 }).default('2024/2025'), // Current year
  numberOfTerms: integer('number_of_terms').default(3),

  // Payment Settings (JSON for flexibility)
  paymentConfig: jsonb('payment_config').$type<{
    arcaEnabled: boolean
    flutterwaveEnabled: boolean
    allowPartialPayment: boolean
    lateFeePercentage: number
  }>(),

  // Admin
  adminUserId: integer('admin_user_id').references(() => users.id),

  // Status
  isActive: boolean('is_active').default(true),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('trial'), // trial, active, suspended
  subscriptionExpiry: timestamp('subscription_expiry'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Type exports
export type School = typeof schools.$inferSelect
export type NewSchool = typeof schools.$inferInsert
