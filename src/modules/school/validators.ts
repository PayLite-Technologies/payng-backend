import { z } from "zod";

// School creation schema
export const createSchoolSchema = z.object({
  name: z.string().min(3, "School name must be at least 3 characters").max(255),
  code: z
    .string()
    .min(3, "School code must be at least 3 characters")
    .max(50)
    .regex(
      /^[A-Z0-9]+$/,
      "School code must contain only uppercase letters and numbers",
    ),
  email: z.string().email("Invalid email format").optional(),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).default("Nigeria"),
  logoUrl: z.string().url("Invalid logo URL").optional(),
  websiteUrl: z.string().url("Invalid website URL").optional(),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters (e.g., NGN)")
    .default("NGN"),
  academicYearFormat: z
    .string()
    .regex(/^\d{4}\/\d{4}$/, "Academic year must be in format YYYY/YYYY")
    .optional(),
  numberOfTerms: z.number().int().min(1).max(4).default(3),
  paymentConfig: z
    .object({
      arcaEnabled: z.boolean().default(true),
      flutterwaveEnabled: z.boolean().default(true),
      allowPartialPayment: z.boolean().default(true),
      lateFeePercentage: z.number().min(0).max(100).default(5),
    })
    .optional(),
});

// School update schema
export const updateSchoolSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().min(10).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  logoUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  academicYearFormat: z
    .string()
    .regex(/^\d{4}\/\d{4}$/)
    .optional(),
  numberOfTerms: z.number().int().min(1).max(4).optional(),
  paymentConfig: z
    .object({
      arcaEnabled: z.boolean().optional(),
      flutterwaveEnabled: z.boolean().optional(),
      allowPartialPayment: z.boolean().optional(),
      lateFeePercentage: z.number().min(0).max(100).optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
  subscriptionStatus: z
    .enum(["trial", "active", "suspended", "cancelled"])
    .optional(),
});

// School query/filter schema
export const schoolQuerySchema = z.object({
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default("1"),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().max(100))
    .default("10"),
  search: z.string().optional(),
  status: z
    .enum(["all", "active", "inactive", "trial", "suspended"])
    .default("all"),
  sortBy: z
    .enum(["name", "createdAt", "updatedAt", "code"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// School ID parameter schema
export const schoolIdSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

// School statistics query schema
export const schoolStatsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeRevenue: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  includeStudents: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  includePayments: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
});

// Assign admin to school schema
export const assignAdminSchema = z.object({
  adminUserId: z.number().int().positive(),
});

// Subscription management schema
export const updateSubscriptionSchema = z.object({
  subscriptionStatus: z.enum(["trial", "active", "suspended", "cancelled"]),
  subscriptionExpiry: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

// Type exports
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
export type SchoolQueryInput = z.infer<typeof schoolQuerySchema>;
export type SchoolIdInput = z.infer<typeof schoolIdSchema>;
export type SchoolStatsQueryInput = z.infer<typeof schoolStatsQuerySchema>;
export type AssignAdminInput = z.infer<typeof assignAdminSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

// Validation helper functions
export const validateSchoolCode = (code: string): boolean => {
  return /^[A-Z0-9]+$/.test(code) && code.length >= 3 && code.length <= 50;
};

export const validateAcademicYear = (year: string): boolean => {
  const match = year.match(/^(\d{4})\/(\d{4})$/);
  if (!match) return false;

  const startYear = parseInt(match[1]);
  const endYear = parseInt(match[2]);

  return endYear === startYear + 1;
};

export const validateNigerianPhone = (phone: string): boolean => {
  // Nigerian phone number format: +234XXXXXXXXXX or 0XXXXXXXXXXX
  const regex = /^(\+234|234|0)?[789][01]\d{8}$/;
  return regex.test(phone.replace(/\s+/g, ""));
};
