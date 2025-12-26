import { z } from 'zod'

// Environment variable validation schema
const configSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('localhost'),
  FRONTEND_URL: z.string().url().default('http://localhost:3001'),

  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),

  // Authentication
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  JWT_SECRET: z.string().min(16, 'JWT secret is required'),

  // Payment Gateways
  ARCA_API_KEY: z.string().optional(),
  ARCA_SECRET_KEY: z.string().optional(),
  ARCA_BASE_URL: z.string().url().default('https://api.arca.africa'),
  ARCA_WEBHOOK_SECRET: z.string().optional(),

  FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_ENCRYPTION_KEY: z.string().optional(),

  // Notifications
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().default('noreply@payng.ng'),

  SMS_PROVIDER: z.string().default('termii'),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().default('Payng'),

  WHATSAPP_API_KEY: z.string().optional(),
  WHATSAPP_BUSINESS_ID: z.string().optional(),

  // File Uploads
  MAX_FILE_SIZE: z.string().transform(Number).default('5242880'),
  UPLOAD_DIR: z.string().default('./uploads'),

  // Security
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('15'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  ENCRYPTION_KEY: z.string().min(32).optional(),

  // Cron
  ENABLE_CRON: z.string().transform((val) => val === 'true').default('true'),
  PAYMENT_REMINDER_CRON: z.string().default('0 9 * * *'),
  FEE_STATUS_CHECK_CRON: z.string().default('0 8 * * *'),
  CRON_SECRET: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
})

// Parse and validate environment variables
function parseConfig() {
  try {
    return configSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment configuration:')
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    }
    process.exit(1)
  }
}

// Export validated configuration
export const config = parseConfig()

// Helper functions
export const isDevelopment = () => config.NODE_ENV === 'development'
export const isProduction = () => config.NODE_ENV === 'production'
export const isTest = () => config.NODE_ENV === 'test'

// Payment gateway availability checks
export const isArcaEnabled = () => !!(config.ARCA_API_KEY && config.ARCA_SECRET_KEY)
export const isFlutterwaveEnabled = () => !!(
  config.FLUTTERWAVE_PUBLIC_KEY &&
  config.FLUTTERWAVE_SECRET_KEY
)

// Notification service availability
export const isResendEnabled = () => !!config.RESEND_API_KEY
export const isSmsEnabled = () => !!config.SMS_API_KEY
export const isWhatsAppEnabled = () => !!(
  config.WHATSAPP_API_KEY &&
  config.WHATSAPP_BUSINESS_ID
)

// Database configuration
export const dbConfig = {
  url: config.DATABASE_URL,
}

// Server configuration
export const serverConfig = {
  port: config.PORT,
  host: config.HOST,
  frontendUrl: config.FRONTEND_URL,
  isDev: isDevelopment(),
  isProd: isProduction(),
}

// Security configuration
export const securityConfig = {
  sessionSecret: config.SESSION_SECRET,
  jwtSecret: config.JWT_SECRET,
  encryptionKey: config.ENCRYPTION_KEY,
  rateLimitWindow: config.RATE_LIMIT_WINDOW * 60 * 1000, // Convert to milliseconds
  rateLimitMaxRequests: config.RATE_LIMIT_MAX_REQUESTS,
}

// Payment configuration
export const paymentConfig = {
  arca: {
    apiKey: config.ARCA_API_KEY,
    secretKey: config.ARCA_SECRET_KEY,
    baseUrl: config.ARCA_BASE_URL,
    webhookSecret: config.ARCA_WEBHOOK_SECRET,
    enabled: isArcaEnabled(),
  },
  flutterwave: {
    publicKey: config.FLUTTERWAVE_PUBLIC_KEY,
    secretKey: config.FLUTTERWAVE_SECRET_KEY,
    encryptionKey: config.FLUTTERWAVE_ENCRYPTION_KEY,
    enabled: isFlutterwaveEnabled(),
  },
}

// Notification configuration
export const notificationConfig = {
  email: {
    apiKey: config.RESEND_API_KEY,
    fromEmail: config.FROM_EMAIL,
    enabled: isResendEnabled(),
  },
  sms: {
    provider: config.SMS_PROVIDER,
    apiKey: config.SMS_API_KEY,
    senderId: config.SMS_SENDER_ID,
    enabled: isSmsEnabled(),
  },
  whatsapp: {
    apiKey: config.WHATSAPP_API_KEY,
    businessId: config.WHATSAPP_BUSINESS_ID,
    enabled: isWhatsAppEnabled(),
  },
}

// File upload configuration
export const uploadConfig = {
  maxFileSize: config.MAX_FILE_SIZE,
  uploadDir: config.UPLOAD_DIR,
}

// Cron configuration
export const cronConfig = {
  enabled: config.ENABLE_CRON,
  paymentReminder: config.PAYMENT_REMINDER_CRON,
  feeStatusCheck: config.FEE_STATUS_CHECK_CRON,
  secret: config.CRON_SECRET,
}

// Export all configurations as default
export default {
  config,
  serverConfig,
  dbConfig,
  securityConfig,
  paymentConfig,
  notificationConfig,
  uploadConfig,
  cronConfig,
  isDevelopment,
  isProduction,
  isTest,
}
