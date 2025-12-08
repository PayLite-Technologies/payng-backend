import app from "./app";

// For Vercel serverless functions, we need to export the app directly
// The Vercel runtime will handle the server setup
export default app;

// For local development with Bun
if (import.meta.main) {
  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || "localhost";

  console.log("🚀 Starting Payng API Server...");
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`,
  );
  console.log(
    `💾 Database: ${process.env.DATABASE_URL ? "Configured" : "Not configured"}`,
  );

  const server = Bun.serve({
    port: Number(PORT),
    hostname: HOST,
    fetch: app.fetch,
    development: process.env.NODE_ENV !== "production",
  });

  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`📋 Health check: http://${HOST}:${PORT}/health`);
  console.log(`📚 API docs: http://${HOST}:${PORT}/api/docs`);

  // Graceful shutdown handlers for local development
  const shutdown = (signal: string) => {
    console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
    server.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
