import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from '@/core/db'
import { config } from '@/core/config'

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...')

    await migrate(db, { migrationsFolder: './drizzle' })

    console.log('✅ Database migrations completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migrations if this file is executed directly
if (import.meta.main) {
  runMigrations()
}

export { runMigrations }
