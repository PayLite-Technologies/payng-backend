// Export all database schemas
export * from "./users";
export * from "./schools";
export * from "./students";
export * from "./classes";
export * from "./fees";
export * from "./payments";
export * from "./receipts";
export * from "./notifications";

// Re-export commonly used types for convenience
export type { User, NewUser, Session, NewSession } from "./users";

export type { School, NewSchool } from "./schools";

export type { Student, NewStudent } from "./students";

export type { Class, NewClass } from "./classes";

export type {
  FeeSchedule,
  NewFeeSchedule,
  FeeAssignment,
  NewFeeAssignment,
  PaymentPlan,
  NewPaymentPlan,
} from "./fees";

export type { FeePayment, NewFeePayment } from "./payments";

export type { Receipt, NewReceipt } from "./receipts";

export type { Notification, NewNotification } from "./notifications";

// Export all enums for easy access
export { userRoleEnum } from "./users";
export { studentStatusEnum, genderEnum } from "./students";
export {
  feeTypeEnum,
  feeFrequencyEnum,
  feeAssignmentStatusEnum,
  paymentPlanStatusEnum,
} from "./fees";
export {
  paymentMethodEnum,
  paymentStatusEnum,
  paymentGatewayEnum,
} from "./payments";
export { notificationTypeEnum, notificationStatusEnum } from "./notifications";
