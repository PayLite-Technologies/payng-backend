import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const notificationTypeEnum = pgEnum("notification_type", [
  "email",
  "sms",
  "whatsapp",
  "push",
]);
export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
]);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Recipient

  // Type & Content
  type: notificationTypeEnum("type").notNull(),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),

  // Recipients (can be different from userId for parents receiving student notifications)
  recipientEmail: varchar("recipient_email", { length: 255 }),
  recipientPhone: varchar("recipient_phone", { length: 20 }),
  recipientName: varchar("recipient_name", { length: 200 }),

  // Metadata
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // "payment", "fee", "student"
  relatedEntityId: integer("related_entity_id"),
  schoolId: integer("school_id"), // For multi-tenant filtering

  // Template and data
  templateId: varchar("template_id", { length: 100 }), // "payment_receipt", "payment_reminder", etc.
  templateData: jsonb("template_data"), // Dynamic data for templates

  // Status
  status: notificationStatusEnum("status").default("pending"),
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),

  // External provider details
  externalId: varchar("external_id", { length: 255 }), // Provider's message ID
  deliveryStatus: varchar("delivery_status", { length: 50 }), // delivered, bounced, etc.

  // Retry Logic
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  nextRetryAt: timestamp("next_retry_at"),

  // Priority
  priority: integer("priority").default(0), // 0=normal, 1=high, 2=urgent

  // Scheduling
  scheduledAt: timestamp("scheduled_at"), // For future delivery

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
