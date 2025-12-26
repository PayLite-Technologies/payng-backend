import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";

import { trimTrailingSlash } from "hono/trailing-slash";
import { config } from "./core/config";
import { checkDbHealth } from "./core/db";

// Import middleware
import { errorHandler } from "./middlewares/errorHandler";
import { rateLimiter } from "./middlewares/rateLimiter";

// Import route modules
import authRoutes from "./modules/auth/routes";
import schoolRoutes from "./modules/school/routes";
import studentRoutes from "./modules/student/routes";

const app = new Hono();

// Global middleware
app.use("*", logger());

app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return true;
      
      // Development origins
      const devOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        config.FRONTEND_URL,
      ];
      
      // Production origins (from environment or defaults)
      const prodOrigins = [
        "https://payng.ng",
        "https://www.payng.ng",
        "https://app.payng.ng",
        process.env.FRONTEND_URL,
      ].filter(Boolean);
      
      const allowedOrigins = [
        ...devOrigins,
        ...prodOrigins,
        // Allow any subdomain of payng.ng
        /^https:\/\/.*\.payng\.ng$/,
      ];
      
      // Check if origin matches any allowed origin
      return allowedOrigins.some((allowed) => {
        if (typeof allowed === "string") {
          return origin === allowed;
        }
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Origin",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Requested-With",
      "X-API-Key",
      "X-Session-Id",
      "X-User-Role",
    ],
    exposeHeaders: ["X-Total-Count", "X-Page-Count"],
  }),
);

app.use(
  "*",
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use("*", prettyJSON());
app.use("*", trimTrailingSlash());

// Rate limiting for API routes
app.use("/api/*", rateLimiter());

// Health check routes
app.get("/health", async (c) => {
  const dbHealthy = await checkDbHealth();

  return c.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      services: {
        database: dbHealthy ? "healthy" : "unhealthy",
        payment: {
          arca: config.ARCA_API_KEY ? "configured" : "not_configured",
          flutterwave: config.FLUTTERWAVE_SECRET_KEY
            ? "configured"
            : "not_configured",
        },
        notifications: {
          email: config.RESEND_API_KEY ? "configured" : "not_configured",
          sms: config.SMS_API_KEY ? "configured" : "not_configured",
          whatsapp: config.WHATSAPP_API_KEY ? "configured" : "not_configured",
        },
      },
    },
    dbHealthy ? 200 : 503,
  );
});

app.get("/health/db", async (c) => {
  const isHealthy = await checkDbHealth();

  return c.json(
    {
      database: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
    },
    isHealthy ? 200 : 503,
  );
});

// API version info
app.get("/", (c) => {
  return c.json({
    name: "Payng API Server",
    version: "1.0.0",
    description: "Nigerian School Fees Payment Platform API",
    status: "running",
    environment: config.NODE_ENV,
    docs: `${config.FRONTEND_URL}/docs`,
    endpoints: {
      auth: "/api/auth/*",
      schools: "/api/schools/*",
      students: "/api/students/*",
      fees: "/api/fees/*",
      payments: "/api/payments/*",
      receipts: "/api/receipts/*",
      admin: "/api/admin/*",
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.route("/api/auth", authRoutes);
app.route("/api/schools", schoolRoutes);
app.route("/api/students", studentRoutes);

// Mount other routes (placeholder for future modules)
// app.route('/api/fees', feeRoutes)
// app.route('/api/payments', paymentRoutes)
// app.route('/api/receipts', receiptRoutes)
// app.route('/api/admin', adminRoutes)
// app.route('/api/notifications', notificationRoutes)

// Webhook routes (no authentication required)
app.post("/webhooks/arca", async (c) => {
  const signature = c.req.header("x-arca-signature") || "";
  const body = await c.req.text();

  try {
    // Process Arca webhook
    // Implementation will be added with payment module
    console.log("Arca webhook received:", {
      signature,
      bodyLength: body.length,
    });

    return c.json({ status: "success" }, 200);
  } catch (error) {
    console.error("Arca webhook processing failed:", error);
    return c.json({ error: "Webhook processing failed" }, 400);
  }
});

app.post("/webhooks/flutterwave", async (c) => {
  const signature = c.req.header("verif-hash") || "";
  const body = await c.req.text();

  try {
    // Process Flutterwave webhook
    // Implementation will be added with payment module
    console.log("Flutterwave webhook received:", {
      signature,
      bodyLength: body.length,
    });

    return c.json({ status: "success" }, 200);
  } catch (error) {
    console.error("Flutterwave webhook processing failed:", error);
    return c.json({ error: "Webhook processing failed" }, 400);
  }
});

// Cron job endpoints (secured by Vercel Cron secret)
app.get("/api/cron/payment-reminders", async (c) => {
  const authHeader = c.req.header("Authorization");
  const cronSecret = config.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Send payment reminders
    // Implementation will be added with cron module
    console.log("Payment reminders cron job executed");

    return c.json({
      success: true,
      message: "Payment reminders sent",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Payment reminders cron job failed:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/cron/fee-status-check", async (c) => {
  const authHeader = c.req.header("Authorization");
  const cronSecret = config.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Check fee payment status
    // Implementation will be added with cron module
    console.log("Fee status check cron job executed");

    return c.json({
      success: true,
      message: "Fee status check completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Fee status check cron job failed:", error);
    return c.json({ error: error.message }, 500);
  }
});

// API documentation endpoint
app.get("/api/docs", (c) => {
  return c.json({
    name: "Payng API Documentation",
    version: "1.0.0",
    baseUrl: c.req.url.replace("/api/docs", ""),
    endpoints: {
      authentication: {
        "POST /api/auth/register": "Register a new user (parent/student)",
        "POST /api/auth/login": "User login",
        "POST /api/auth/admin/login": "Admin login",
        "POST /api/auth/logout": "Logout user",
        "GET /api/auth/me": "Get current user profile",
        "POST /api/auth/verify-email": "Verify email address",
        "POST /api/auth/forgot-password": "Request password reset",
        "POST /api/auth/reset-password": "Reset password",
        "PATCH /api/auth/profile": "Update user profile",
        "POST /api/auth/change-password": "Change password",
      },
      schools: {
        "GET /api/schools": "List all schools (SuperAdmin)",
        "POST /api/schools": "Create school (SuperAdmin)",
        "GET /api/schools/:id": "Get school details",
        "PATCH /api/schools/:id": "Update school",
        "DELETE /api/schools/:id": "Deactivate school",
      },
      students: {
        "GET /api/students": "List students (SchoolAdmin)",
        "POST /api/students": "Create student profile",
        "GET /api/students/my-children": "Get parent's children",
        "GET /api/students/:id": "Get student details",
        "PATCH /api/students/:id": "Update student",
      },
      payments: {
        "POST /api/payments/initiate": "Initiate payment",
        "POST /api/payments/verify": "Verify payment",
        "GET /api/payments/history/:studentId": "Get payment history",
      },
      webhooks: {
        "POST /webhooks/arca": "Arca payment webhook",
        "POST /webhooks/flutterwave": "Flutterwave payment webhook",
      },
      system: {
        "GET /health": "System health check",
        "GET /health/db": "Database health check",
        "GET /api/docs": "API documentation",
      },
    },
    authentication: {
      type: "Session-based with Lucia",
      headers: {
        Authorization: "Bearer {session_id}",
        Cookie: "payng_session={session_id}",
      },
    },
    errorCodes: {
      400: "Bad Request - Invalid input data",
      401: "Unauthorized - Authentication required",
      403: "Forbidden - Insufficient permissions",
      404: "Not Found - Resource does not exist",
      409: "Conflict - Resource already exists",
      422: "Unprocessable Entity - Validation failed",
      429: "Too Many Requests - Rate limit exceeded",
      500: "Internal Server Error - Server error",
      503: "Service Unavailable - System maintenance",
    },
  });
});

// Catch-all for API routes (404)
app.all("/api/*", (c) => {
  return c.json(
    {
      success: false,
      error: "API endpoint not found",
      message: `${c.req.method} ${c.req.path} is not a valid API endpoint`,
      availableEndpoints: "/api/docs",
    },
    404,
  );
});

// Global 404 handler
app.notFound((c) => {
  // Check if this is an API request
  if (c.req.path.startsWith("/api/")) {
    return c.json(
      {
        success: false,
        error: "API endpoint not found",
        path: c.req.path,
      },
      404,
    );
  }

  // For non-API requests
  return c.json(
    {
      error: "Not Found",
      message: "The requested resource could not be found",
      path: c.req.path,
    },
    404,
  );
});

// Global error handler
app.onError(errorHandler);

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // In production, you might want to restart the process
  if (config.NODE_ENV === "production") {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // In production, you should restart the process
  if (config.NODE_ENV === "production") {
    process.exit(1);
  }
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n📡 Received ${signal}, shutting down gracefully...`);

  // Close database connections
  // closeDb()

  console.log("✅ Shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
