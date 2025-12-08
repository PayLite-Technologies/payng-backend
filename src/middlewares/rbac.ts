import type { Context, Next } from 'hono'

// Role hierarchy for permission checks
const ROLE_HIERARCHY = {
  super_admin: 4,
  school_admin: 3,
  parent: 2,
  student: 1,
} as const

type UserRole = keyof typeof ROLE_HIERARCHY

export function rbacMiddleware(allowedRoles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user')
    const dbUser = c.get('dbUser')

    if (!user || !dbUser) {
      return c.json({
        success: false,
        error: 'Authentication required'
      }, 401)
    }

    const userRole = dbUser.role as UserRole

    if (!allowedRoles.includes(userRole)) {
      return c.json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      }, 403)
    }

    await next()
  }
}

// Middleware that allows access if user has at least the minimum role level
export function minimumRoleMiddleware(minimumRole: UserRole) {
  return async (c: Context, next: Next) => {
    const dbUser = c.get('dbUser')

    if (!dbUser) {
      return c.json({
        success: false,
        error: 'Authentication required'
      }, 401)
    }

    const userRole = dbUser.role as UserRole
    const userLevel = ROLE_HIERARCHY[userRole]
    const minimumLevel = ROLE_HIERARCHY[minimumRole]

    if (userLevel < minimumLevel) {
      return c.json({
        success: false,
        error: `Access denied. Minimum role required: ${minimumRole}`
      }, 403)
    }

    await next()
  }
}

// School-specific RBAC - ensures user can only access their school's data
export function schoolScopedMiddleware(c: Context, next: Next) {
  return async (c: Context, next: Next) => {
    const dbUser = c.get('dbUser')
    const schoolId = c.get('schoolId')

    if (!dbUser) {
      return c.json({
        success: false,
        error: 'Authentication required'
      }, 401)
    }

    // Super admin can access any school
    if (dbUser.role === 'super_admin') {
      await next()
      return
    }

    // School admin must have school context
    if (dbUser.role === 'school_admin' && !schoolId) {
      return c.json({
        success: false,
        error: 'School context required'
      }, 403)
    }

    // For parents and students, we need to verify their association with the school
    // This will be handled in individual route handlers with additional checks

    await next()
  }
}

// Resource ownership middleware - checks if user owns or has access to resource
export function resourceOwnershipMiddleware(resourceType: string) {
  return async (c: Context, next: Next) => {
    const dbUser = c.get('dbUser')
    const userId = c.get('userId')

    if (!dbUser || !userId) {
      return c.json({
        success: false,
        error: 'Authentication required'
      }, 401)
    }

    // Super admin has access to all resources
    if (dbUser.role === 'super_admin') {
      c.set('hasResourceAccess', true)
      await next()
      return
    }

    // School admin has access to school resources
    if (dbUser.role === 'school_admin') {
      c.set('hasResourceAccess', true)
      await next()
      return
    }

    // For parents and students, access will be verified in route handlers
    // based on the specific resource and relationships
    c.set('hasResourceAccess', false)
    await next()
  }
}

// Helper functions for permission checking

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return userRole === requiredRole
}

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole]
}

export function canAccessSchool(userRole: UserRole, userSchoolId: number | null, targetSchoolId: number): boolean {
  // Super admin can access any school
  if (userRole === 'super_admin') {
    return true
  }

  // School admin can only access their own school
  if (userRole === 'school_admin') {
    return userSchoolId === targetSchoolId
  }

  // Parents and students access is determined by their associations
  return false
}

export function isSuperAdmin(userRole: UserRole): boolean {
  return userRole === 'super_admin'
}

export function isSchoolAdmin(userRole: UserRole): boolean {
  return userRole === 'school_admin'
}

export function isParent(userRole: UserRole): boolean {
  return userRole === 'parent'
}

export function isStudent(userRole: UserRole): boolean {
  return userRole === 'student'
}

// Middleware for API key access (for external integrations)
export function apiKeyMiddleware(c: Context, next: Next) {
  return async (c: Context, next: Next) => {
    const apiKey = c.req.header('X-API-Key')

    if (!apiKey) {
      return c.json({
        success: false,
        error: 'API key required'
      }, 401)
    }

    // In a real implementation, you'd validate the API key against a database
    // For now, we'll just check if it matches a config value
    const validApiKey = process.env.API_KEY

    if (!validApiKey || apiKey !== validApiKey) {
      return c.json({
        success: false,
        error: 'Invalid API key'
      }, 403)
    }

    // Set API access flag
    c.set('isApiAccess', true)
    await next()
  }
}

// Combined middleware for routes that support both user auth and API key
export function userOrApiKeyMiddleware(c: Context, next: Next) {
  return async (c: Context, next: Next) => {
    const apiKey = c.req.header('X-API-Key')

    // Try API key first
    if (apiKey) {
      const validApiKey = process.env.API_KEY
      if (validApiKey && apiKey === validApiKey) {
        c.set('isApiAccess', true)
        await next()
        return
      }
    }

    // Fall back to user authentication
    const user = c.get('user')
    const dbUser = c.get('dbUser')

    if (!user || !dbUser) {
      return c.json({
        success: false,
        error: 'Authentication required (user login or valid API key)'
      }, 401)
    }

    await next()
  }
}

// Permission constants for different resources
export const PERMISSIONS = {
  SCHOOL: {
    CREATE: ['super_admin'],
    READ: ['super_admin', 'school_admin'],
    UPDATE: ['super_admin', 'school_admin'],
    DELETE: ['super_admin'],
  },
  STUDENT: {
    CREATE: ['super_admin', 'school_admin'],
    READ: ['super_admin', 'school_admin', 'parent', 'student'],
    UPDATE: ['super_admin', 'school_admin'],
    DELETE: ['super_admin', 'school_admin'],
  },
  PAYMENT: {
    CREATE: ['super_admin', 'school_admin', 'parent'],
    READ: ['super_admin', 'school_admin', 'parent', 'student'],
    UPDATE: ['super_admin', 'school_admin'],
    DELETE: ['super_admin'],
  },
  FEE: {
    CREATE: ['super_admin', 'school_admin'],
    READ: ['super_admin', 'school_admin', 'parent', 'student'],
    UPDATE: ['super_admin', 'school_admin'],
    DELETE: ['super_admin', 'school_admin'],
  },
} as const

// Helper to check resource permissions
export function hasPermission(
  userRole: UserRole,
  resource: keyof typeof PERMISSIONS,
  action: keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]
): boolean {
  const allowedRoles = PERMISSIONS[resource][action] as UserRole[]
  return allowedRoles.includes(userRole)
}
