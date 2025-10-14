import app from "./app";
import { config } from "dotenv";

// Load environment variables
config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

const server = Bun.serve({
  port: Number(PORT),
  hostname: HOST,
  fetch: app.fetch,
  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 PayNG API Server running on http://${HOST}:${PORT}`);
console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  server.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down server...");
  server.stop();
  process.exit(0);
});