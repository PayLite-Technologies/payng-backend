import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createSchoolSchema,
  updateSchoolSchema,
  schoolQuerySchema,
  schoolIdSchema,
  assignAdminSchema,
  updateSubscriptionSchema,
} from "./validators";
import { SchoolService } from "./service";
import { authMiddleware } from "@/middlewares/auth";
import { rbacMiddleware } from "@/middlewares/rbac";

const router = new Hono();
const schoolService = new SchoolService();

// All routes require authentication
router.use("*", authMiddleware);

// Create school (Super Admin only)
router.post(
  "/",
  rbacMiddleware(["super_admin"]),
  zValidator("json", createSchoolSchema),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const user = c.get("user");
      const result = await schoolService.createSchool(body, parseInt(user.id));

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

// Get all schools (Super Admin and School Admin)
router.get(
  "/",
  rbacMiddleware(["super_admin", "school_admin"]),
  zValidator("query", schoolQuerySchema),
  async (c) => {
    try {
      const query = c.req.valid("query");
      const user = c.get("user");
      const dbUser = c.get("dbUser");

      // If school admin, only show their school
      if (dbUser.role === "school_admin") {
        const schoolId = c.get("schoolId");
        if (!schoolId) {
          return c.json(
            {
              success: false,
              error: "School context required for school admin",
            },
            403
          );
        }

        const result = await schoolService.getSchoolById(schoolId);
        return c.json({
          success: true,
          data: {
            schools: [result.school],
            pagination: {
              page: 1,
              limit: 1,
              total: 1,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          },
        });
      }

      // Super admin can see all schools
      const result = await schoolService.getSchools(query);

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

// Get school by ID
router.get(
  "/:id",
  rbacMiddleware(["super_admin", "school_admin"]),
  zValidator("param", schoolIdSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const dbUser = c.get("dbUser");
      const schoolId = c.get("schoolId");

      // School admin can only view their own school
      if (dbUser.role === "school_admin" && schoolId !== id) {
        return c.json(
          {
            success: false,
            error: "Access denied. You can only view your own school.",
          },
          403
        );
      }

      const result = await schoolService.getSchoolById(id);

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
        error.message === "School not found" ? 404 : 400
      );
    }
  }
);

// Update school
router.patch(
  "/:id",
  rbacMiddleware(["super_admin", "school_admin"]),
  zValidator("param", schoolIdSchema),
  zValidator("json", updateSchoolSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const dbUser = c.get("dbUser");
      const schoolId = c.get("schoolId");

      // School admin can only update their own school
      if (dbUser.role === "school_admin" && schoolId !== id) {
        return c.json(
          {
            success: false,
            error: "Access denied. You can only update your own school.",
          },
          403
        );
      }

      // School admin cannot change subscription status
      if (dbUser.role === "school_admin" && body.subscriptionStatus) {
        return c.json(
          {
            success: false,
            error: "Only super admin can update subscription status",
          },
          403
        );
      }

      const result = await schoolService.updateSchool(id, body);

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

// Delete (deactivate) school (Super Admin only)
router.delete(
  "/:id",
  rbacMiddleware(["super_admin"]),
  zValidator("param", schoolIdSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const result = await schoolService.deleteSchool(id);

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

// Assign admin to school (Super Admin only)
router.post(
  "/:id/assign-admin",
  rbacMiddleware(["super_admin"]),
  zValidator("param", schoolIdSchema),
  zValidator("json", assignAdminSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const result = await schoolService.assignAdmin(id, body);

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

// Update subscription (Super Admin only)
router.patch(
  "/:id/subscription",
  rbacMiddleware(["super_admin"]),
  zValidator("param", schoolIdSchema),
  zValidator("json", updateSubscriptionSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const result = await schoolService.updateSubscription(id, body);

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

// Get school statistics
router.get(
  "/:id/stats",
  rbacMiddleware(["super_admin", "school_admin"]),
  zValidator("param", schoolIdSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const dbUser = c.get("dbUser");
      const schoolId = c.get("schoolId");

      // School admin can only view their own school stats
      if (dbUser.role === "school_admin" && schoolId !== id) {
        return c.json(
          {
            success: false,
            error: "Access denied. You can only view your own school statistics.",
          },
          403
        );
      }

      const result = await schoolService.getSchoolStats(id);

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

// Health check for school module
router.get("/health", (c) => {
  return c.json({
    module: "school",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
