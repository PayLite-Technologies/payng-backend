import { db } from "@/core/db";
import { schools, users } from "@/db/schema";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import type {
  CreateSchoolInput,
  UpdateSchoolInput,
  SchoolQueryInput,
  AssignAdminInput,
  UpdateSubscriptionInput,
} from "./validators";

export class SchoolService {
  // Create a new school
  async createSchool(input: CreateSchoolInput, createdBy?: number) {
    // Check if school code already exists
    const existingSchool = await db.query.schools.findFirst({
      where: eq(schools.code, input.code.toUpperCase()),
    });

    if (existingSchool) {
      throw new Error(`School with code ${input.code} already exists`);
    }

    // Check if school name already exists
    const existingName = await db.query.schools.findFirst({
      where: eq(schools.name, input.name),
    });

    if (existingName) {
      throw new Error(`School with name "${input.name}" already exists`);
    }

    // Create school
    const [school] = await db
      .insert(schools)
      .values({
        name: input.name,
        code: input.code.toUpperCase(),
        email: input.email,
        phoneNumber: input.phoneNumber,
        address: input.address,
        city: input.city,
        state: input.state,
        country: input.country || "Nigeria",
        logoUrl: input.logoUrl,
        websiteUrl: input.websiteUrl,
        currency: input.currency || "NGN",
        academicYearFormat: input.academicYearFormat || this.getCurrentAcademicYear(),
        numberOfTerms: input.numberOfTerms || 3,
        paymentConfig: input.paymentConfig || {
          arcaEnabled: true,
          flutterwaveEnabled: true,
          allowPartialPayment: true,
          lateFeePercentage: 5.0,
        },
        isActive: true,
        subscriptionStatus: "trial",
        subscriptionExpiry: this.getTrialExpiryDate(),
      })
      .returning();

    return {
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
        email: school.email,
        phoneNumber: school.phoneNumber,
        address: school.address,
        city: school.city,
        state: school.state,
        country: school.country,
        logoUrl: school.logoUrl,
        websiteUrl: school.websiteUrl,
        currency: school.currency,
        academicYearFormat: school.academicYearFormat,
        numberOfTerms: school.numberOfTerms,
        paymentConfig: school.paymentConfig,
        isActive: school.isActive,
        subscriptionStatus: school.subscriptionStatus,
        subscriptionExpiry: school.subscriptionExpiry,
        createdAt: school.createdAt,
      },
      message: "School created successfully",
    };
  }

  // Get all schools with pagination and filtering
  async getSchools(query: SchoolQueryInput) {
    const { page, limit, search, status, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(schools.name, `%${search}%`),
          like(schools.code, `%${search}%`),
          like(schools.city, `%${search}%`),
          like(schools.state, `%${search}%`)
        )
      );
    }

    if (status !== "all") {
      if (status === "active") {
        conditions.push(eq(schools.isActive, true));
      } else if (status === "inactive") {
        conditions.push(eq(schools.isActive, false));
      } else {
        conditions.push(eq(schools.subscriptionStatus, status));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schools)
      .where(whereClause);

    // Get schools
    const orderByClause =
      sortOrder === "asc" ? asc(schools[sortBy]) : desc(schools[sortBy]);

    const schoolList = await db.query.schools.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: orderByClause,
      with: {
        adminUserId: true,
      },
    });

    // Get admin details for each school
    const schoolsWithAdmin = await Promise.all(
      schoolList.map(async (school) => {
        let admin = null;
        if (school.adminUserId) {
          admin = await db.query.users.findFirst({
            where: eq(users.id, school.adminUserId),
            columns: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          });
        }

        return {
          id: school.id,
          name: school.name,
          code: school.code,
          email: school.email,
          phoneNumber: school.phoneNumber,
          city: school.city,
          state: school.state,
          logoUrl: school.logoUrl,
          isActive: school.isActive,
          subscriptionStatus: school.subscriptionStatus,
          subscriptionExpiry: school.subscriptionExpiry,
          admin,
          createdAt: school.createdAt,
        };
      })
    );

    const totalPages = Math.ceil(count / limit);

    return {
      schools: schoolsWithAdmin,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // Get school by ID
  async getSchoolById(schoolId: number) {
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Get admin details
    let admin = null;
    if (school.adminUserId) {
      admin = await db.query.users.findFirst({
        where: eq(users.id, school.adminUserId),
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          avatarUrl: true,
        },
      });
    }

    return {
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
        email: school.email,
        phoneNumber: school.phoneNumber,
        address: school.address,
        city: school.city,
        state: school.state,
        country: school.country,
        logoUrl: school.logoUrl,
        websiteUrl: school.websiteUrl,
        currency: school.currency,
        academicYearFormat: school.academicYearFormat,
        numberOfTerms: school.numberOfTerms,
        paymentConfig: school.paymentConfig,
        isActive: school.isActive,
        subscriptionStatus: school.subscriptionStatus,
        subscriptionExpiry: school.subscriptionExpiry,
        createdAt: school.createdAt,
        updatedAt: school.updatedAt,
        admin,
      },
    };
  }

  // Update school
  async updateSchool(schoolId: number, input: UpdateSchoolInput) {
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Check if new name already exists (if name is being updated)
    if (input.name && input.name !== school.name) {
      const existingName = await db.query.schools.findFirst({
        where: and(eq(schools.name, input.name), sql`${schools.id} != ${schoolId}`),
      });

      if (existingName) {
        throw new Error(`School with name "${input.name}" already exists`);
      }
    }

    // Merge payment config
    const updatedPaymentConfig = input.paymentConfig
      ? { ...school.paymentConfig, ...input.paymentConfig }
      : school.paymentConfig;

    // Update school
    const [updatedSchool] = await db
      .update(schools)
      .set({
        ...input,
        paymentConfig: updatedPaymentConfig,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, schoolId))
      .returning();

    return {
      school: {
        id: updatedSchool.id,
        name: updatedSchool.name,
        code: updatedSchool.code,
        email: updatedSchool.email,
        phoneNumber: updatedSchool.phoneNumber,
        address: updatedSchool.address,
        city: updatedSchool.city,
        state: updatedSchool.state,
        country: updatedSchool.country,
        logoUrl: updatedSchool.logoUrl,
        websiteUrl: updatedSchool.websiteUrl,
        currency: updatedSchool.currency,
        academicYearFormat: updatedSchool.academicYearFormat,
        numberOfTerms: updatedSchool.numberOfTerms,
        paymentConfig: updatedSchool.paymentConfig,
        isActive: updatedSchool.isActive,
        subscriptionStatus: updatedSchool.subscriptionStatus,
        updatedAt: updatedSchool.updatedAt,
      },
      message: "School updated successfully",
    };
  }

  // Delete (deactivate) school
  async deleteSchool(schoolId: number) {
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Soft delete by marking as inactive
    await db
      .update(schools)
      .set({
        isActive: false,
        subscriptionStatus: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(schools.id, schoolId));

    return {
      message: "School deactivated successfully",
    };
  }

  // Assign admin to school
  async assignAdmin(schoolId: number, input: AssignAdminInput) {
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Check if user exists and is a school admin
    const admin = await db.query.users.findFirst({
      where: eq(users.id, input.adminUserId),
    });

    if (!admin) {
      throw new Error("Admin user not found");
    }

    if (admin.role !== "school_admin") {
      throw new Error("User must have school_admin role");
    }

    // Check if admin is already assigned to another school
    const existingAssignment = await db.query.schools.findFirst({
      where: and(
        eq(schools.adminUserId, input.adminUserId),
        sql`${schools.id} != ${schoolId}`
      ),
    });

    if (existingAssignment) {
      throw new Error("Admin is already assigned to another school");
    }

    // Assign admin
    const [updatedSchool] = await db
      .update(schools)
      .set({
        adminUserId: input.adminUserId,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, schoolId))
      .returning();

    return {
      school: {
        id: updatedSchool.id,
        name: updatedSchool.name,
        adminUserId: updatedSchool.adminUserId,
      },
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
      },
      message: "Admin assigned successfully",
    };
  }

  // Update subscription status
  async updateSubscription(schoolId: number, input: UpdateSubscriptionInput) {
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school) {
      throw new Error("School not found");
    }

    const updates: any = {
      subscriptionStatus: input.subscriptionStatus,
      updatedAt: new Date(),
    };

    if (input.subscriptionExpiry) {
      updates.subscriptionExpiry = new Date(input.subscriptionExpiry);
    }

    // If activating, set expiry to 1 year from now if not provided
    if (input.subscriptionStatus === "active" && !input.subscriptionExpiry) {
      updates.subscriptionExpiry = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      );
    }

    const [updatedSchool] = await db
      .update(schools)
      .set(updates)
      .where(eq(schools.id, schoolId))
      .returning();

    return {
      school: {
        id: updatedSchool.id,
        name: updatedSchool.name,
        subscriptionStatus: updatedSchool.subscriptionStatus,
        subscriptionExpiry: updatedSchool.subscriptionExpiry,
      },
      message: "Subscription updated successfully",
    };
  }

  // Get school statistics
  async getSchoolStats(schoolId: number) {
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Get student count
    const [{ studentCount }] = await db
      .select({ studentCount: sql<number>`count(*)` })
      .from(sql`students`)
      .where(sql`school_id = ${schoolId} AND status = 'active'`);

    // Get class count
    const [{ classCount }] = await db
      .select({ classCount: sql<number>`count(*)` })
      .from(sql`classes`)
      .where(sql`school_id = ${schoolId}`);

    // Get total revenue (successful payments)
    const [{ totalRevenue }] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`,
      })
      .from(sql`fee_payments`)
      .where(sql`school_id = ${schoolId} AND status = 'successful'`);

    // Get pending payments count
    const [{ pendingPayments }] = await db
      .select({ pendingPayments: sql<number>`count(*)` })
      .from(sql`fee_assignments`)
      .where(sql`school_id = ${schoolId} AND status IN ('pending', 'partial')`);

    // Get overdue payments count
    const [{ overduePayments }] = await db
      .select({ overduePayments: sql<number>`count(*)` })
      .from(sql`fee_assignments`)
      .where(
        sql`school_id = ${schoolId} AND status = 'overdue' AND due_date < NOW()`
      );

    return {
      schoolId: school.id,
      schoolName: school.name,
      statistics: {
        students: {
          total: studentCount || 0,
        },
        classes: {
          total: classCount || 0,
        },
        revenue: {
          total: parseFloat(totalRevenue?.toString() || "0"),
          currency: school.currency,
        },
        payments: {
          pending: pendingPayments || 0,
          overdue: overduePayments || 0,
        },
      },
      subscription: {
        status: school.subscriptionStatus,
        expiry: school.subscriptionExpiry,
        isActive: school.isActive,
      },
    };
  }

  // Helper: Get current academic year
  private getCurrentAcademicYear(): string {
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth();

    // Academic year typically starts in September (month 8)
    if (month >= 8) {
      return `${currentYear}/${currentYear + 1}`;
    } else {
      return `${currentYear - 1}/${currentYear}`;
    }
  }

  // Helper: Get trial expiry date (30 days from now)
  private getTrialExpiryDate(): Date {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
}
