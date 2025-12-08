import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from 'dotenv'

// Load environment variables
config()

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create a connection pool with optimized settings for serverless
const client = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Disable prepared statements for better serverless compatibility
})

// Create Drizzle database instance
export const db = drizzle(client)

// Graceful shutdown function
export const closeDb = async () => {
  await client.end()
}

// Health check function
export const checkDbHealth = async () => {
  try {
    await client`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}
