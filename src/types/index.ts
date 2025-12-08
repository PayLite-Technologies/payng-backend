// Shared TypeScript types and interfaces for the Payng backend

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
  details?: any
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface RequestContext {
  user?: AuthenticatedUser
  session?: SessionInfo
  dbUser?: DatabaseUser
  schoolId?: number | null
  userRole?: UserRole
  userId?: number
  isApiAccess?: boolean
  hasResourceAccess?: boolean
}

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  phoneNumber?: string | null
  avatarUrl?: string | null
  emailVerified: boolean
  isActive: boolean
  lastLoginAt?: Date | null
}

export interface SessionInfo {
  id: string
  userId: string
  expiresAt: Date
}

export interface DatabaseUser {
  id: number
  email: string
  passwordHash: string
  role: UserRole
  firstName: string
  lastName: string
  phoneNumber?: string | null
  avatarUrl?: string | null
  emailVerified: boolean
  emailVerificationToken?: string | null
  passwordResetToken?: string | null
  passwordResetExpiry?: Date | null
  isActive: boolean
  lastLoginAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export type UserRole = 'super_admin' | 'school_admin' | 'parent' | 'student'

export type StudentStatus = 'active' | 'graduated' | 'transferred' | 'suspended' | 'expelled'

export type Gender = 'male' | 'female' | 'other'

export type FeeType = 'tuition' | 'transport' | 'textbook' | 'uniform' | 'examination' | 'boarding' | 'sports' | 'technology' | 'library' | 'other'

export type FeeFrequency = 'one_time' | 'per_term' | 'per_year' | 'monthly'

export type FeeAssignmentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'waived'

export type PaymentPlanStatus = 'active' | 'completed' | 'defaulted' | 'cancelled'

export type PaymentMethod = 'card' | 'bank_transfer' | 'ussd' | 'mobile_money' | 'cash'

export type PaymentStatus = 'pending' | 'processing' | 'successful' | 'failed' | 'refunded' | 'cancelled'

export type PaymentGateway = 'arca' | 'flutterwave' | 'manual'

export type NotificationType = 'email' | 'sms' | 'whatsapp' | 'push'

export type NotificationStatus = 'pending' | 'sent' | 'failed'

// Payment-related interfaces
export interface PaymentInitializationRequest {
  studentId: number
  assignmentIds: number[]
  amount: number
  method: PaymentMethod
  email?: string
  phoneNumber?: string
  preferredGateway?: PaymentGateway
}

export interface PaymentInitializationResponse {
  success: boolean
  reference: string
  paymentUrl: string
  gateway: PaymentGateway
  accessCode?: string
  message?: string
}

export interface PaymentVerificationRequest {
  reference: string
  gateway: PaymentGateway
}

export interface PaymentVerificationResponse {
  success: boolean
  status: PaymentStatus
  reference: string
  amount: number
  currency: string
  paidAt?: string
  gateway: PaymentGateway
  gatewayResponse?: any
  message?: string
}

export interface WebhookPayload {
  event: string
  data: any
  gateway: PaymentGateway
  signature: string
  timestamp: string
}

// School-related interfaces
export interface SchoolConfig {
  arcaEnabled: boolean
  flutterwaveEnabled: boolean
  allowPartialPayment: boolean
  lateFeePercentage: number
}

export interface SchoolCreationRequest {
  name: string
  code: string
  email?: string
  phoneNumber?: string
  address?: string
  city?: string
  state?: string
  country?: string
  logoUrl?: string
  websiteUrl?: string
  currency?: string
  academicYearFormat?: string
  numberOfTerms?: number
  paymentConfig?: SchoolConfig
}

// Student-related interfaces
export interface StudentCreationRequest {
  studentId: string
  admissionNumber?: string
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth?: string
  gender?: Gender
  classId?: number
  currentTerm?: string
  academicYear?: string
  parentEmails: string[]
  scholarshipStatus?: string
  specialNeeds?: string
  medicalInfo?: StudentMedicalInfo
}

export interface StudentMedicalInfo {
  allergies?: string[]
  conditions?: string[]
  emergencyContact?: string
}

// Fee-related interfaces
export interface FeeScheduleCreationRequest {
  name: string
  feeType: FeeType
  amount: number
  currency?: string
  academicYear?: string
  term?: string
  frequency?: FeeFrequency
  applicableTo: FeeApplicability
  dueDate: string
  lateFeesApply?: boolean
  lateFeePercentage?: number
  description?: string
}

export interface FeeApplicability {
  classIds?: number[]
  levels?: string[]
  allStudents?: boolean
}

export interface FeeAssignmentCreationRequest {
  studentIds: number[]
  feeScheduleId: number
  academicYear: string
  term: string
  discountAmount?: number
  discountReason?: string
}

export interface BulkFeeAssignmentRequest {
  feeScheduleId: number
  filters: {
    classIds?: number[]
    levels?: string[]
    allStudents?: boolean
  }
  academicYear: string
  term: string
  discounts?: Array<{
    studentId: number
    discountAmount: number
    discountReason: string
  }>
}

// Receipt-related interfaces
export interface ReceiptData {
  receiptNumber: string
  schoolName: string
  schoolAddress?: string
  schoolPhone?: string
  schoolEmail?: string
  studentName: string
  studentId?: string
  parentName?: string
  parentEmail?: string
  parentPhone?: string
  amount: number
  currency: string
  paymentDate: string
  paymentMethod: string
  transactionId?: string
  feeItems: FeeItem[]
  academicYear?: string
  term?: string
  notes?: string
}

export interface FeeItem {
  name: string
  amount: number
  description?: string
}

// Notification-related interfaces
export interface NotificationRequest {
  userId: number
  type: NotificationType
  subject?: string
  message: string
  recipientEmail?: string
  recipientPhone?: string
  recipientName?: string
  relatedEntityType?: string
  relatedEntityId?: number
  schoolId?: number
  templateId?: string
  templateData?: any
  priority?: number
  scheduledAt?: Date
}

export interface EmailTemplateData {
  to: string
  subject: string
  html: string
  from?: string
  attachments?: EmailAttachment[]
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  type?: string
}

// Dashboard and analytics interfaces
export interface DashboardStats {
  totalStudents: number
  totalRevenue: number
  pendingPayments: number
  overduePayments: number
  completedPayments: number
  recentPayments: PaymentSummary[]
  revenueByMonth: MonthlyRevenue[]
  paymentsByStatus: StatusCount[]
  feeCollectionRate: number
}

export interface PaymentSummary {
  id: number
  reference: string
  studentName: string
  amount: number
  currency: string
  status: PaymentStatus
  paidAt?: Date
  createdAt: Date
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  paymentCount: number
}

export interface StatusCount {
  status: string
  count: number
  percentage: number
}

// Reconciliation interfaces
export interface ReconciliationReport {
  period: {
    from: string
    to: string
  }
  summary: {
    totalTransactions: number
    totalAmount: number
    successfulTransactions: number
    failedTransactions: number
    pendingTransactions: number
  }
  byGateway: GatewayReconciliation[]
  discrepancies: PaymentDiscrepancy[]
}

export interface GatewayReconciliation {
  gateway: PaymentGateway
  transactions: number
  amount: number
  fees: number
  netAmount: number
}

export interface PaymentDiscrepancy {
  reference: string
  internalStatus: PaymentStatus
  gatewayStatus: string
  amount: number
  description: string
}

// Cron job interfaces
export interface CronJobResult {
  jobName: string
  startTime: Date
  endTime: Date
  success: boolean
  recordsProcessed: number
  errors: string[]
  summary: string
}

export interface PaymentReminderJob extends CronJobResult {
  remindersData: {
    totalOverdueStudents: number
    emailsSent: number
    smssSent: number
    failed: number
  }
}

export interface FeeStatusCheckJob extends CronJobResult {
  statusData: {
    updatedToOverdue: number
    lateFeesApplied: number
    notificationsQueued: number
  }
}

// Error interfaces
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

export interface BusinessRuleError {
  rule: string
  message: string
  context?: any
}

export interface PaymentGatewayError {
  gateway: PaymentGateway
  code: string
  message: string
  details?: any
}

// Utility types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type Partial<T> = { [P in keyof T]?: T[P] }
export type Required<T> = { [P in keyof T]-?: T[P] }

export type CreateRequest<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateRequest<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>

// HTTP Context extensions
declare module 'hono' {
  interface Context {
    get(key: 'user'): AuthenticatedUser | undefined
    get(key: 'session'): SessionInfo | undefined
    get(key: 'dbUser'): DatabaseUser | undefined
    get(key: 'schoolId'): number | undefined
    get(key: 'userRole'): UserRole | undefined
    get(key: 'userId'): number | undefined
    get(key: 'isApiAccess'): boolean | undefined
    get(key: 'hasResourceAccess'): boolean | undefined
    set(key: 'user', value: AuthenticatedUser): void
    set(key: 'session', value: SessionInfo): void
    set(key: 'dbUser', value: DatabaseUser): void
    set(key: 'schoolId', value: number): void
    set(key: 'userRole', value: UserRole): void
    set(key: 'userId', value: number): void
    set(key: 'isApiAccess', value: boolean): void
    set(key: 'hasResourceAccess', value: boolean): void
  }
}
