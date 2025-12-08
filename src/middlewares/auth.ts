import { lucia, validateSession } from '@/core/auth'
import type { Context, Next } from 'hono'
import { db } from '@/core/db'
import { users, schools } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function authMiddleware(c: Context, next: Next) {
  // Get session ID from Authorization header or cookie
  const authHeader = c.req.header('Authorization')
  const sessionCookie = c.req.header('Cookie')

  let sessionId: string | null = null

  // Check Authorization header first (Bearer token)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionId = authHeader.replace('Bearer ', '')
  }
  // Fall back to session cookie
  else if (sessionCookie) {
    const cookies = parseCookies(sessionCookie)
    sessionId = cookies.payng_session || null
  }

  if (!sessionId) {
    return c.json({
      success: false,
      error: 'Unauthorized - No session provided'
    }, 401)
  }

  try {
    // Validate session with Lucia
    const { session, user } = await validateSession(sessionId)

    if (!session) {
      return c.json({
        success: false,
        error: 'Unauthorized - Invalid or expired session'
      }, 401)
    }

    if (!user) {
      return c.json({
        success: false,
        error: 'Unauthorized - User not found'
      }, 401)
    }

    // Get full user details from database
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, parseInt(user.id)),
    })

    if (!dbUser || !dbUser.isActive) {
      return c.json({
        success: false,
        error: 'Unauthorized - User account is inactive'
      }, 401)
    }

    // Attach user and session to context
    c.set('user', user)
    c.set('session', session)
    c.set('dbUser', dbUser)

    // For multi-tenancy: Extract schoolId based on user role
    let schoolId: number | null = null

    if (dbUser.role === 'school_admin') {
      // Get school ID from the school where this user is admin
      const school = await db.query.schools.findFirst({
        where: eq(schools.adminUserId, dbUser.id),
      })
      schoolId = school?.id || null
    }

    // Attach schoolId to context if available
    if (schoolId) {
      c.set('schoolId', schoolId)
    }

    // Set user context for easier access
    c.set('userRole', dbUser.role)
    c.set('userId', dbUser.id)

    await next()
  } catch (error) {
    console.error('Authentication middleware error:', error)
    return c.json({
      success: false,
      error: 'Authentication failed'
    }, 401)
  }
}

// Optional middleware for routes that work with or without authentication
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  const sessionCookie = c.req.header('Cookie')

  let sessionId: string | null = null

  // Check Authorization header first (Bearer token)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionId = authHeader.replace('Bearer ', '')
  }
  // Fall back to session cookie
  else if (sessionCookie) {
    const cookies = parseCookies(sessionCookie)
    sessionId = cookies.payng_session || null
  }

  if (sessionId) {
    try {
      const { session, user } = await validateSession(sessionId)

      if (session && user) {
        // Get full user details
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, parseInt(user.id)),
        })

        if (dbUser && dbUser.isActive) {
          c.set('user', user)
          c.set('session', session)
          c.set('dbUser', dbUser)
          c.set('userRole', dbUser.role)
          c.set('userId', dbUser.id)

          // Set schoolId for school admins
          if (dbUser.role === 'school_admin') {
            const school = await db.query.schools.findFirst({
              where: eq(schools.adminUserId, dbUser.id),
            })
            if (school) {
              c.set('schoolId', school.id)
            }
          }
        }
      }
    } catch (error) {
      // Silent fail for optional auth
      console.warn('Optional auth middleware error:', error)
    }
  }

  await next()
}

// Middleware to require email verification
export async function requireEmailVerification(c: Context, next: Next) {
  const dbUser = c.get('dbUser')

  if (!dbUser) {
    return c.json({
      success: false,
      error: 'User not found in context'
    }, 500)
  }

  if (!dbUser.emailVerified) {
    return c.json({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    }, 403)
  }

  await next()
}

// Middleware to check if user belongs to a school
export async function requireSchoolContext(c: Context, next: Next) {
  const dbUser = c.get('dbUser')
  const schoolId = c.get('schoolId')

  if (!dbUser) {
    return c.json({
      success: false,
      error: 'User not found in context'
    }, 500)
  }

  // Super admin can access any school context
  if (dbUser.role === 'super_admin') {
    await next()
    return
  }

  // School admin must have a school
  if (dbUser.role === 'school_admin' && !schoolId) {
    return c.json({
      success: false,
      error: 'School admin must be associated with a school'
    }, 403)
  }

  await next()
}

// Helper function to parse cookies
function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  cookieString.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=')
    const value = rest.join('=')
    if (name && value) {
      cookies[name.trim()] = decodeURIComponent(value.trim())
    }
  })

  return cookies
}

// Helper to extract session from request
export function getSessionFromRequest(c: Context): string | null {
  const authHeader = c.req.header('Authorization')
  const sessionCookie = c.req.header('Cookie')

  // Check Authorization header first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '')
  }

  // Check session cookie
  if (sessionCookie) {
    const cookies = parseCookies(sessionCookie)
    return cookies.payng_session || null
  }

  return null
}

// Helper to check if user is authenticated
export function isAuthenticated(c: Context): boolean {
  const user = c.get('user')
  const session = c.get('session')
  return !!(user && session)
}

// Helper to get user from context safely
export function getAuthenticatedUser(c: Context) {
  const user = c.get('user')
  const dbUser = c.get('dbUser')
  const session = c.get('session')

  if (!user || !dbUser || !session) {
    throw new Error('User not authenticated')
  }

  return {
    user,
    dbUser,
    session,
    schoolId: c.get('schoolId') || null,
    userRole: c.get('userRole'),
    userId: c.get('userId'),
  }
}
