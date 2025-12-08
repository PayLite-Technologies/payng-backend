import { z } from "zod";

// Student creation schema
export const createStudentSchema = z.object({
  studentId: z
    .string()
    .min(3, "Student ID must be at least 3 characters")
    .max(50),
  admissionNumber: z.string().max(50).optional(),
  schoolId: z.number().int().positive("Valid school ID is required"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100),
  middleName: z.string().max(100).optional(),
  dateOfBirth: z.string().date("Invalid date format (YYYY-MM-DD)").optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  classId: z.number().int().positive().optional(),
  currentTerm: z.string().max(20).optional(),
  academicYear: z
    .string()
    .regex(/^\d{4}\/\d{4}$/, "Academic year must be in format YYYY/YYYY")
    .optional(),
  enrollmentDate: z.string().datetime().optional(),
  parentEmails: z
    .array(z.string().email("Invalid email format"))
    .min(1, "At least one parent email is required"),
  scholarshipStatus: z.string().max(500).optional(),
  specialNeeds: z.string().max(1000).optional(),
  medicalInfo: z
    .object({
      allergies: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional(),
      emergencyContact: z.string().optional(),
    })
    .optional(),
});

// Student update schema
export const updateStudentSchema = z.object({
  studentId: z.string().min(3).max(50).optional(),
  admissionNumber: z.string().max(50).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  middleName: z.string().max(100).optional(),
  dateOfBirth: z.string().date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  classId: z.number().int().positive().optional(),
  currentTerm: z.string().max(20).optional(),
  academicYear: z
    .string()
    .regex(/^\d{4}\/\d{4}$/)
    .optional(),
  status: z
    .enum(["active", "graduated", "transferred", "suspended", "expelled"])
    .optional(),
  scholarshipStatus: z.string().max(500).optional(),
  specialNeeds: z.string().max(1000).optional(),
  medicalInfo: z
    .object({
      allergies: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional(),
      emergencyContact: z.string().optional(),
    })
    .optional(),
  graduationDate: z.string().datetime().optional(),
});

// Student query/filter schema
export const studentQuerySchema = z.object({
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default("1"),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().max(100))
    .default("20"),
  search: z.string().optional(),
  classId: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .optional(),
  status: z
    .enum(["all", "active", "graduated", "transferred", "suspended", "expelled"])
    .default("active"),
  academicYear: z.string().optional(),
  term: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  sortBy: z
    .enum(["studentId", "firstName", "lastName", "createdAt", "enrollmentDate"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Student ID parameter schema
export const studentIdSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

// Assign parent schema
export const assignParentSchema = z.object({
  parentUserId: z.number().int().positive("Valid parent user ID is required"),
});

// Assign class schema
export const assignClassSchema = z.object({
  classId: z.number().int().positive("Valid class ID is required"),
  term: z.string().max(20).optional(),
  academicYear: z
    .string()
    .regex(/^\d{4}\/\d{4}$/)
    .optional(),
});

// Bulk student creation schema
export const bulkCreateStudentsSchema = z.object({
  students: z
    .array(createStudentSchema)
    .min(1, "At least one student is required")
    .max(100, "Maximum 100 students per batch"),
});

// Transfer student schema
export const transferStudentSchema = z.object({
  toSchoolId: z.number().int().positive("Valid school ID is required"),
  transferDate: z.string().datetime().optional(),
  reason: z.string().max(500).optional(),
});

// Graduate student schema
export const graduateStudentSchema = z.object({
  graduationDate: z.string().datetime(),
  certificate: z.string().max(100).optional(),
  remarks: z.string().max(500).optional(),
});

// Update status schema
export const updateStatusSchema = z.object({
  status: z.enum(["active", "graduated", "transferred", "suspended", "expelled"]),
  reason: z.string().max(500).optional(),
  effectiveDate: z.string().datetime().optional(),
});

// Type exports
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentQueryInput = z.infer<typeof studentQuerySchema>;
export type StudentIdInput = z.infer<typeof studentIdSchema>;
export type AssignParentInput = z.infer<typeof assignParentSchema>;
export type AssignClassInput = z.infer<typeof assignClassSchema>;
export type BulkCreateStudentsInput = z.infer<typeof bulkCreateStudentsSchema>;
export type TransferStudentInput = z.infer<typeof transferStudentSchema>;
export type GraduateStudentInput = z.infer<typeof graduateStudentSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// Validation helper functions
export const validateStudentId = (id: string): boolean => {
  return id.length >= 3 && id.length <= 50;
};

export const validateAcademicYear = (year: string): boolean => {
  const match = year.match(/^(\d{4})\/(\d{4})$/);
  if (!match) return false;

  const startYear = parseInt(match[1]);
  const endYear = parseInt(match[2]);

  return endYear === startYear + 1;
};

export const validateDateOfBirth = (dob: string): boolean => {
  const date = new Date(dob);
  const now = new Date();
  const age = now.getFullYear() - date.getFullYear();

  // Students should be between 3 and 25 years old
  return age >= 3 && age <= 25;
};

export const isEligibleForGraduation = (
  enrollmentDate: Date,
  currentDate: Date = new Date()
): boolean => {
  const yearsDiff = currentDate.getFullYear() - enrollmentDate.getFullYear();
  // Minimum 1 year enrollment required for graduation
  return yearsDiff >= 1;
};
