import { db } from "@/core/db";
import { students, users, schools, classes } from "@/db/schema";
import { eq, and, or, like, desc, asc, sql, inArray } from "drizzle-orm";
import type {
  CreateStudentInput,
  UpdateStudentInput,
  StudentQueryInput,
  AssignParentInput,
  AssignClassInput,
  TransferStudentInput,
  GraduateStudentInput,
  UpdateStatusInput,
} from "./validators";

export class StudentService {
  // Create a new student
  async createStudent(input: CreateStudentInput, createdBy?: number) {
    // Check if student ID already exists in this school
    const existingStudent = await db.query.students.findFirst({
      where: and(
        eq(students.studentId, input.studentId),
        eq(students.schoolId, input.schoolId)
      ),
    });

    if (existingStudent) {
      throw new Error(
        `Student with ID ${input.studentId} already exists in this school`
      );
    }

    // Validate school exists
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, input.schoolId),
    });

    if (!school || !school.isActive) {
      throw new Error("School not found or inactive");
    }

    // Validate class if provided
    if (input.classId) {
      const classExists = await db.query.classes.findFirst({
        where: and(
          eq(classes.id, input.classId),
          eq(classes.schoolId, input.schoolId)
        ),
      });

      if (!classExists) {
        throw new Error("Class not found or does not belong to this school");
      }
    }

    // Find or validate parent users
    const parentUserIds: number[] = [];
    for (const email of input.parentEmails) {
      const parent = await db.query.users.findFirst({
        where: and(eq(users.email, email.toLowerCase()), eq(users.role, "parent")),
      });

      if (parent) {
        parentUserIds.push(parent.id);
      } else {
        throw new Error(
          `Parent with email ${email} not found. Please ensure parent is registered first.`
        );
      }
    }

    // Set academic year if not provided
    const academicYear = input.academicYear || this.getCurrentAcademicYear();
    const currentTerm = input.currentTerm || "Term 1";

    // Create student
    const [student] = await db
      .insert(students)
      .values({
        studentId: input.studentId,
        admissionNumber: input.admissionNumber,
        schoolId: input.schoolId,
        parentUserIds: parentUserIds,
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        classId: input.classId,
        currentTerm: currentTerm,
        academicYear: academicYear,
        enrollmentDate: input.enrollmentDate
          ? new Date(input.enrollmentDate)
          : new Date(),
        status: "active",
        scholarshipStatus: input.scholarshipStatus,
        specialNeeds: input.specialNeeds,
        medicalInfo: input.medicalInfo,
      })
      .returning();

    // Update class enrollment count if class assigned
    if (input.classId) {
      await db
        .update(classes)
        .set({
          currentEnrollment: sql`${classes.currentEnrollment} + 1`,
        })
        .where(eq(classes.id, input.classId));
    }

    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        admissionNumber: student.admissionNumber,
        schoolId: student.schoolId,
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        classId: student.classId,
        currentTerm: student.currentTerm,
        academicYear: student.academicYear,
        enrollmentDate: student.enrollmentDate,
        status: student.status,
        parentUserIds: student.parentUserIds,
        createdAt: student.createdAt,
      },
      message: "Student created successfully",
    };
  }

  // Get all students with pagination and filtering
  async getStudents(query: StudentQueryInput, schoolId?: number) {
    const { page, limit, search, classId, status, academicYear, term, gender, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // School filter (required for multi-tenancy)
    if (schoolId) {
      conditions.push(eq(students.schoolId, schoolId));
    }

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(students.studentId, `%${search}%`),
          like(students.firstName, `%${search}%`),
          like(students.lastName, `%${search}%`),
          like(students.admissionNumber, `%${search}%`)
        )
      );
    }

    // Class filter
    if (classId) {
      conditions.push(eq(students.classId, classId));
    }

    // Status filter
    if (status !== "all") {
      conditions.push(eq(students.status, status));
    }

    // Academic year filter
    if (academicYear) {
      conditions.push(eq(students.academicYear, academicYear));
    }

    // Term filter
    if (term) {
      conditions.push(eq(students.currentTerm, term));
    }

    // Gender filter
    if (gender) {
      conditions.push(eq(students.gender, gender));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(students)
      .where(whereClause);

    // Get students
    const orderByClause =
      sortOrder === "asc" ? asc(students[sortBy]) : desc(students[sortBy]);

    const studentList = await db.query.students.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: orderByClause,
    });

    // Get additional info for each student
    const studentsWithInfo = await Promise.all(
      studentList.map(async (student) => {
        // Get class info
        let classInfo = null;
        if (student.classId) {
          classInfo = await db.query.classes.findFirst({
            where: eq(classes.id, student.classId),
            columns: {
              id: true,
              name: true,
              level: true,
              section: true,
            },
          });
        }

        // Get parent info
        const parents = [];
        if (student.parentUserIds && student.parentUserIds.length > 0) {
          const parentUsers = await db.query.users.findMany({
            where: inArray(users.id, student.parentUserIds),
            columns: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          });
          parents.push(...parentUsers);
        }

        return {
          id: student.id,
          studentId: student.studentId,
          admissionNumber: student.admissionNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          middleName: student.middleName,
          gender: student.gender,
          status: student.status,
          class: classInfo,
          currentTerm: student.currentTerm,
          academicYear: student.academicYear,
          parents,
          enrollmentDate: student.enrollmentDate,
          createdAt: student.createdAt,
        };
      })
    );

    const totalPages = Math.ceil(count / limit);

    return {
      students: studentsWithInfo,
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

  // Get student by ID
  async getStudentById(studentId: number, schoolId?: number) {
    const conditions = [eq(students.id, studentId)];
    if (schoolId) {
      conditions.push(eq(students.schoolId, schoolId));
    }

    const student = await db.query.students.findFirst({
      where: and(...conditions),
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Get school info
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, student.schoolId),
      columns: {
        id: true,
        name: true,
        code: true,
        city: true,
        state: true,
      },
    });

    // Get class info
    let classInfo = null;
    if (student.classId) {
      classInfo = await db.query.classes.findFirst({
        where: eq(classes.id, student.classId),
      });
    }

    // Get parent info
    const parents = [];
    if (student.parentUserIds && student.parentUserIds.length > 0) {
      const parentUsers = await db.query.users.findMany({
        where: inArray(users.id, student.parentUserIds),
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          avatarUrl: true,
        },
      });
      parents.push(...parentUsers);
    }

    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        admissionNumber: student.admissionNumber,
        schoolId: student.schoolId,
        school,
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        avatarUrl: student.avatarUrl,
        classId: student.classId,
        class: classInfo,
        currentTerm: student.currentTerm,
        academicYear: student.academicYear,
        enrollmentDate: student.enrollmentDate,
        graduationDate: student.graduationDate,
        status: student.status,
        scholarshipStatus: student.scholarshipStatus,
        specialNeeds: student.specialNeeds,
        medicalInfo: student.medicalInfo,
        parents,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
    };
  }

  // Get parent's children
  async getMyChildren(parentUserId: number) {
    const studentList = await db
      .select()
      .from(students)
      .where(sql`${parentUserId} = ANY(${students.parentUserIds})`);

    const childrenWithInfo = await Promise.all(
      studentList.map(async (student) => {
        // Get school info
        const school = await db.query.schools.findFirst({
          where: eq(schools.id, student.schoolId),
          columns: {
            id: true,
            name: true,
            code: true,
          },
        });

        // Get class info
        let classInfo = null;
        if (student.classId) {
          classInfo = await db.query.classes.findFirst({
            where: eq(classes.id, student.classId),
            columns: {
              id: true,
              name: true,
              level: true,
            },
          });
        }

        return {
          id: student.id,
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          middleName: student.middleName,
          avatarUrl: student.avatarUrl,
          status: student.status,
          school,
          class: classInfo,
          currentTerm: student.currentTerm,
          academicYear: student.academicYear,
        };
      })
    );

    return {
      children: childrenWithInfo,
    };
  }

  // Update student
  async updateStudent(studentId: number, input: UpdateStudentInput, schoolId?: number) {
    const conditions = [eq(students.id, studentId)];
    if (schoolId) {
      conditions.push(eq(students.schoolId, schoolId));
    }

    const student = await db.query.students.findFirst({
      where: and(...conditions),
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Check if new student ID already exists (if being updated)
    if (input.studentId && input.studentId !== student.studentId) {
      const existingStudent = await db.query.students.findFirst({
        where: and(
          eq(students.studentId, input.studentId),
          eq(students.schoolId, student.schoolId),
          sql`${students.id} != ${studentId}`
        ),
      });

      if (existingStudent) {
        throw new Error(`Student with ID ${input.studentId} already exists`);
      }
    }

    // Validate class if being updated
    if (input.classId && input.classId !== student.classId) {
      const classExists = await db.query.classes.findFirst({
        where: and(
          eq(classes.id, input.classId),
          eq(classes.schoolId, student.schoolId)
        ),
      });

      if (!classExists) {
        throw new Error("Class not found or does not belong to this school");
      }

      // Update enrollment counts
      if (student.classId) {
        await db
          .update(classes)
          .set({
            currentEnrollment: sql`${classes.currentEnrollment} - 1`,
          })
          .where(eq(classes.id, student.classId));
      }

      await db
        .update(classes)
        .set({
          currentEnrollment: sql`${classes.currentEnrollment} + 1`,
        })
        .where(eq(classes.id, input.classId));
    }

    // Update student
    const [updatedStudent] = await db
      .update(students)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId))
      .returning();

    return {
      student: {
        id: updatedStudent.id,
        studentId: updatedStudent.studentId,
        admissionNumber: updatedStudent.admissionNumber,
        firstName: updatedStudent.firstName,
        lastName: updatedStudent.lastName,
        middleName: updatedStudent.middleName,
        dateOfBirth: updatedStudent.dateOfBirth,
        gender: updatedStudent.gender,
        avatarUrl: updatedStudent.avatarUrl,
        classId: updatedStudent.classId,
        currentTerm: updatedStudent.currentTerm,
        academicYear: updatedStudent.academicYear,
        status: updatedStudent.status,
        updatedAt: updatedStudent.updatedAt,
      },
      message: "Student updated successfully",
    };
  }

  // Delete (deactivate) student
  async deleteStudent(studentId: number, schoolId?: number) {
    const conditions = [eq(students.id, studentId)];
    if (schoolId) {
      conditions.push(eq(students.schoolId, schoolId));
    }

    const student = await db.query.students.findFirst({
      where: and(...conditions),
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Soft delete by marking as suspended
    await db
      .update(students)
      .set({
        status: "suspended",
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    // Update class enrollment if student was in a class
    if (student.classId) {
      await db
        .update(classes)
        .set({
          currentEnrollment: sql`${classes.currentEnrollment} - 1`,
        })
        .where(eq(classes.id, student.classId));
    }

    return {
      message: "Student deactivated successfully",
    };
  }

  // Assign parent to student
  async assignParent(studentId: number, input: AssignParentInput, schoolId?: number) {
    const conditions = [eq(students.id, studentId)];
    if (schoolId) {
      conditions.push(eq(students.schoolId, schoolId));
    }

    const student = await db.query.students.findFirst({
      where: and(...conditions),
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Verify parent user exists and has parent role
    const parent = await db.query.users.findFirst({
      where: eq(users.id, input.parentUserId),
    });

    if (!parent) {
      throw new Error("Parent user not found");
    }

    if (parent.role !== "parent") {
      throw new Error("User must have parent role");
    }

    // Check if parent is already assigned
    if (student.parentUserIds.includes(input.parentUserId)) {
      throw new Error("Parent is already assigned to this student");
    }

    // Add parent to student's parent list
    const updatedParentIds = [...student.parentUserIds, input.parentUserId];

    await db
      .update(students)
      .set({
        parentUserIds: updatedParentIds,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      parent: {
        id: parent.id,
        email: parent.email,
        firstName: parent.firstName,
        lastName: parent.lastName,
      },
      message: "Parent assigned successfully",
    };
  }

  // Assign class to student
  async assignClass(studentId: number, input: AssignClassInput, schoolId?: number) {
    const conditions = [eq(students.id, studentId)];
    if (schoolId) {
      conditions.push(eq(students.schoolId, schoolId));
    }

    const student = await db.query.students.findFirst({
      where: and(...conditions),
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Verify class exists and belongs to school
    const classInfo = await db.query.classes.findFirst({
      where: and(
        eq(classes.id, input.classId),
        eq(classes.schoolId, student.schoolId)
      ),
    });

    if (!classInfo) {
      throw new Error("Class not found or does not belong to this school");
    }

    // Check class capacity
    if (classInfo.currentEnrollment >= classInfo.capacity) {
      throw new Error("Class has reached maximum capacity");
    }

    // Remove from old class if exists
    if (student.classId) {
      await db
        .update(classes)
        .set({
          currentEnrollment: sql`${classes.currentEnrollment} - 1`,
        })
        .where(eq(classes.id, student.classId));
    }

    // Update student
    await db
      .update(students)
      .set({
        classId: input.classId,
        currentTerm: input.term || student.currentTerm,
        academicYear: input.academicYear || student.academicYear,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    // Update new class enrollment
    await db
      .update(classes)
      .set({
        currentEnrollment: sql`${classes.currentEnrollment} + 1`,
      })
      .where(eq(classes.id, input.classId));

    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      class: {
        id: classInfo.id,
        name: classInfo.name,
        level: classInfo.level,
      },
      message: "Class assigned successfully",
    };
  }

  // Transfer student to another school
  async transferStudent(studentId: number, input: TransferStudentInput, schoolId?: number) {
    const conditions = [eq(students.id, studentId)];
    if (schoolId) {
      conditions.push(eq(students.schoolId, schoolId));
    }

    const student = await db.query.students.findFirst({
      where: and(...conditions),
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Verify new school exists
    const newSchool = await db.query.schools.findFirst({
      where: eq(schools.id, input.toSchoolId),
    });

    if (!newSchool || !newSchool.isActive) {
      throw new Error("Target school not found or inactive");
    }

    // Update student status
    await db
      .update(students)
      .set({
        status: "transferred",
        classId: null, // Remove class assignment
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    // Update class enrollment if student was in a class
    if (student.classId) {
      await db
        .update(classes)
        .set({
          currentEnrollment: sql`${classes.currentEnrollment} - 1`,
        })
        .where(eq(classes.id, student.classId));
    }

    return {
      message: "Student transferred successfully",
      fromSchool: student.schoolId,
      toSchool: input.toSchoolId,
    };
  }

  // Graduate student
  async graduateStudent(studentId: number, input: GraduateStudentInput, schoolId?: number) {
    const conditions = [eq(students.id, studentId)];
    if (schoolId) {
      conditions.push(eq(students.schoolId, schoolId));
    }

    const student = await db.query.students.findFirst({
      where: and(...conditions),
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Update student status
    await db
      .update(students)
      .set({
        status: "graduated",
        graduationDate: new Date(input.graduationDate),
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    // Update class enrollment if student was in a class
    if (student.classId) {
      await db
        .update(classes)
        .set({
          currentEnrollment: sql`${classes.currentEnrollment} - 1`,
        })
        .where(eq(classes.id, student.classId));
    }

    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      message: "Student graduated successfully",
    };
  }

  // Update student status
  async updateStatus(studentId: number, input: UpdateStatusInput, schoolId?: number) {
    const conditions = [eq(students.id, studentId)];
    if (schoolId) {
      conditions.push(eq(students.schoolId, schoolId));
    }

    const student = await db.query.students.findFirst({
      where: and(...conditions),
    });

    if (!student) {
      throw new Error("Student not found");
    }

    await db
      .update(students)
      .set({
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        status: input.status,
      },
      message: `Student status updated to ${input.status}`,
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
}
