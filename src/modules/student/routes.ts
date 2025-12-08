import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createStudentSchema,
  updateStudentSchema,
  studentQuerySchema,
  studentIdSchema,
  assignParentSchema,
  assignClassSchema,
  transferStudentSchema,
  graduateStudentSchema,
  updateStatusSchema,
} from "./validators";
import { StudentService } from "./service";
import { authMiddleware } from "@/middlewares/auth";
import { rbacMiddleware } from "@/middlewares/rbac";

const router = new Hono();
const studentService = new StudentService();

// All routes require authentication
router.use("*", authMiddleware);

// Create student (School Admin only)
router.post(
  "/",
  rbacMiddleware(["super_admin", "school_admin"]),
  zValidator("json", createStudentSchema),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const user = c.get("user");
      const dbUser = c.get("dbUser");
      const schoolId = c.get("schoolId");

      // School admin can only create students in their school
      if (dbUser.role === "school_admin") {
        if (!schoolId || body.schoolId !== schoolId) {
          return c.json(
            {
              success: false,
              error: "You can only create students in your own school",
            },
            403
          );
        }
      }

      const result = await studentService.createStudent(body, parseInt(user.id));

      return c.json(
        {
          success: true,
          data: result,
        },
        201
      );
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  }
);

// Get all students (School Admin)
router.get(
  "/",
  rbacMiddleware(["super_admin", "school_admin"]),
  zValidator("query", studentQuerySchema),
  async (c) => {
    try {
      const query = c.req.valid("query");
      const dbUser = c.get("dbUser");
      const schoolId = c.get("schoolId");

      // School admin can only see their school's students
      if (dbUser.role === "school_admin") {
        if (!schoolId) {
          return c.json(
            {
              success: false,
              error: "School context required",
            },
            403
          );
        }

        const result = await studentService.getStudents(query, schoolId);
        return c.json({
          success: true,
          data: result,
        });
      }

      // Super admin can see all
      const result = await studentService.getStudents(query);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  }
);

// Get parent's children (Parent only)
router.get(
  "/my-children",
  rbacMiddleware(["parent"]),
  async (c) => {
    try {
      const user = c.get("user");
      const result = await studentService.getMyChildren(parseInt(user.id));

      return c.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  }
);

// Get student by ID
router.get(
  "/:id",
  rbacMiddleware(["super_admin", "school_admin", "parent", "student"]),
  zValidator("param", studentIdSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const dbUser = c.get("dbUser");
      const schoolId = c.get("schoolId");

      // School admin can only view their school's students
      if (dbUser.role === "school_admin") {
        if (!schoolId) {
          return c.json(
            {
              success: false,
              error: "School context required",
            },
            403
          );
        }
        const result = await studentService.getStudentById(id, schoolId);
        return c.json({
          success: true,
          data: result,
        });
      }

      // Parent can only view their children
      if (dbUser.role === "parent") {
        const student = await studentService.getStudentById(id);
        if (!student.student.parentUserIds.includes(dbUser.id)) {
          return c.json(
            {
              success: false,
              error: "Access denied. You can only view your own children.",
            },
            403
          );
        }
        return c.json({
          success: true,
          data: student,
        });
      }

      // Student can only view their own profile
      if (dbUser.role === "student") {
        if (parseInt(dbUser.id.toString()) !== id) {
          return c.json(
            {
              success: false,
              error: "Access denied. You can only view your own profile.",
            },
            403
          );
        }
      }

      const result = await studentService.getStudentById(id);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        error.message === "Student not found" ? 404 : 400
      );
    }
  }
);

// Update student
router.patch(
  "/:id",
  rbacMiddleware(["super_admin", "school_admin"]),
  zValidator("param", studentIdSchema),
  zValidator("json", updateStudentSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const dbUser = c.get("dbUser");
      const schoolId = c.get("schoolId");

      // School admin can only update their school's students
      if (dbUser.role === "school_admin") {
        if (!schoolId) {
          return c.json(
            {
              success: false,
              error: "School context required",
            },
            403
          );
        }

        const result = await studentService.updateStudent(id, body, schoolId);
        return c.json({
          success: true,
          data: result,
        });
      }

      // Super admin can update any student
      const result = await studentService.updateStudent(id, body);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  }
);

// Delete (deactivate) student
router.delete(
  "/:id",
  rbacMiddleware(["super_admin", "school_admin"]),
  zValidator("param", studentIdSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const dbUser = c.get("dbUser");
      const schoolId = c.get("schoolId");

      // School admin can only delete their school's students
      if (dbUser.role === "school_admin") {
        if (!schoolId) {
          return c.json(
            {
              success: false,
              error: "School context required",
            },
            403
          );
        }

        const result = await studentService.deleteStudent(id, schoolId);
        return c.json({
          success: true,
          data: result,
        });
      }

      const result = await studentService.deleteStudent(id);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  }
);

// Assign parent to student
router.post(
  "/:id/assign-parent",
  rbacMiddleware(["super_admin", "school_admin"]),
  zValidator("param", studentIdSchema),
  zValidator("json", assignParentSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const dbUser = c.get("dbUser");
      const schoolId = c.get("schoolId");

      if (dbUser.role === "school_admin" && !schoolId) {
        return c.json(
          {
            success: false,
            error: "School context required",
          },
          403
        );
      }

      const result = await studentService.assignParent(id, body, schoolId);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  }
);

// Assign class to student
router.post(
  "/:id/assign-class",
  rbacMiddleware(["super_admin", "school_admin"]),
  zValidator("param", studentIdSchema),
  zValidator("json", assignClassSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const dbUser = c.get("dbUser");
      const schoolId = c.get("schoolId");

      if (dbUser.role === "school_admin" && !schoolId) {
        return c.json(
          {
            success: false,
            error: "School context required",
          },
          403
        );
      }

      const result = await studentService.assignClass(id, body, schoolId);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  }
);

// Transfer student
router.post(
  "/:id/transfer",
  rbacMiddleware(["super_admin", "school_admin"]),
  zValidator("param", studentIdSchema),
  zValidator("json", transferStudentSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const dbUser = c.get("dbUser");
      const schoolId = c.get("schoolId");

      if (dbUser.role === "school_admin" && !schoolId) {
        return c.json(
          {
            success: false,
            error: "School context required",
          },
          403
        );
      }

      const result = await studentService.transferStudent(id, body, schoolId);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  }
);

// Graduate student
router.post(
  "/:id/graduate",
  rbacMiddleware(["super_admin", "school_admin"]),
  zValidator("param", studentIdSchema),
  zValidator("json", graduateStudentSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const dbUser = c.get("dbUser");
      const schoolId = c.get("schoolId");

      if (dbUser.role === "school_admin" && !schoolId) {
        return c.json(
          {
            success: false,
            error: "School context required",
          },
          403
        );
      }

      const result = await studentService.graduateStudent(id, body, schoolId);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  }
);

// Update student status
router.patch(
  "/:id/status",
  rbacMiddleware(["super_admin", "school_admin"]),
  zValidator("param", studentIdSchema),
  zValidator("json", updateStatusSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const dbUser = c.get("dbUser");
      const schoolId = c.get("schoolId");

      if (dbUser.role === "school_admin" && !schoolId) {
        return c.json(
          {
            success: false,
            error: "School context required",
          },
          403
        );
      }

      const result = await studentService.updateStatus(id, body, schoolId);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  }
);

// Health check for student module
router.get("/health", (c) => {
  return c.json({
    module: "student",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
