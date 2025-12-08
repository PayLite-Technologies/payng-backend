import { Lucia } from 'lucia'
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle'
import { db } from './db'
import { sessions, users } from '@/db/schema'
import { config } from './config'

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
    name: 'payng_session',
    expires: false, // Session cookies
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      role: attributes.role,
      firstName: attributes.firstName,
      lastName: attributes.lastName,
      phoneNumber: attributes.phoneNumber,
      avatarUrl: attributes.avatarUrl,
      emailVerified: attributes.emailVerified,
      isActive: attributes.isActive,
      lastLoginAt: attributes.lastLoginAt,
    }
  },
})

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: {
      email: string
      role: 'super_admin' | 'school_admin' | 'parent' | 'student'
      firstName: string
      lastName: string
      phoneNumber: string | null
      avatarUrl: string | null
      emailVerified: boolean
      isActive: boolean
      lastLoginAt: Date | null
    }
  }
}

// Helper types for authentication
export type AuthUser = {
  id: string
  email: string
  role: 'super_admin' | 'school_admin' | 'parent' | 'student'
  firstName: string
  lastName: string
  phoneNumber?: string | null
  avatarUrl?: string | null
  emailVerified: boolean
  isActive: boolean
  lastLoginAt?: Date | null
}

export type AuthSession = {
  id: string
  userId: string
  expiresAt: Date
}

// Session management helpers
export async function createSession(userId: number) {
  const session = await lucia.createSession(userId.toString(), {})
  return session
}

export async function validateSession(sessionId: string) {
  const result = await lucia.validateSession(sessionId)
  return result
}

export async function invalidateSession(sessionId: string) {
  await lucia.invalidateSession(sessionId)
}

export async function invalidateUserSessions(userId: number) {
  await lucia.invalidateUserSessions(userId.toString())
}

// Cookie helpers
export function createSessionCookie(sessionId: string) {
  return lucia.createSessionCookie(sessionId)
}

export function createBlankSessionCookie() {
  return lucia.createBlankSessionCookie()
}
