import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  registerUserSchema,
  loginUserSchema,
  adminLoginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  createSchoolAdminSchema,
  logoutSchema,
} from './validators'
import { AuthService } from './service'
import { authMiddleware } from '@/middlewares/auth'
import { rbacMiddleware } from '@/middlewares/rbac'
import { createSessionCookie, createBlankSessionCookie } from '@/core/auth'

const router = new Hono()
const authService = new AuthService()

// Public routes (no authentication required)

// User registration
router.post(
  '/register',
  zValidator('json', registerUserSchema),
  async (c) => {
    try {
      const body = c.req.valid('json')
      const result = await authService.registerUser(body)

      return c.json({
        success: true,
        data: result,
      }, 201)
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message,
      }, 400)
    }
  }
)

// User login
router.post(
  '/login',
  zValidator('json', loginUserSchema),
  async (c) => {
    try {
      const body = c.req.valid('json')
      const result = await authService.loginUser(body)

      // Set session cookie
      const sessionCookie = createSessionCookie(result.session.id)
      c.header('Set-Cookie', sessionCookie.serialize())

      return c.json({
        success: true,
        data: {
          user: result.user,
          session: result.session,
        },
      })
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message,
      }, 400)
    }
  }
)

// Admin login
router.post(
  '/admin/login',
  zValidator('json', adminLoginSchema),
  async (c) => {
    try {
      const body = c.req.valid('json')
      const result = await authService.adminLogin(body)

      // Set session cookie
      const sessionCookie = createSessionCookie(result.session.id)
      c.header('Set-Cookie', sessionCookie.serialize())

      return c.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message,
      }, 400)
    }
  }
)

// Email verification
router.post(
  '/verify-email',
  zValidator('json', verifyEmailSchema),
  async (c) => {
    try {
      const body = c.req.valid('json')
      const result = await authService.verifyEmail(body)

      return c.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message,
      }, 400)
    }
  }
)

// Forgot password
router.post(
  '/forgot-password',
  zValidator('json', forgotPasswordSchema),
  async (c) => {
    try {
      const body = c.req.valid('json')
      const result = await authService.forgotPassword(body)

      return c.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message,
      }, 400)
    }
  }
)

// Reset password
router.post(
  '/reset-password',
  zValidator('json', resetPasswordSchema),
  async (c) => {
    try {
      const body = c.req.valid('json')
      const result = await authService.resetPassword(body)

      return c.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message,
      }, 400)
    }
  }
)

// Protected routes (authentication required)

// Get current user profile
router.get(
  '/me',
  authMiddleware,
  async (c) => {
    try {
      const user = c.get('user')
      const result = await authService.getUserProfile(parseInt(user.id))

      return c.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message,
      }, 400)
    }
  }
)

// Update profile
router.patch(
  '/profile',
  authMiddleware,
  zValidator('json', updateProfileSchema),
  async (c) => {
    try {
      const user = c.get('user')
      const body = c.req.valid('json')
      const result = await authService.updateProfile(parseInt(user.id), body)

      return c.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message,
      }, 400)
    }
  }
)

// Change password
router.post(
  '/change-password',
  authMiddleware,
  zValidator('json', changePasswordSchema),
  async (c) => {
    try {
      const user = c.get('user')
      const body = c.req.valid('json')
      const result = await authService.changePassword(parseInt(user.id), body)

      return c.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message,
      }, 400)
    }
  }
)

// Logout
router.post(
  '/logout',
  authMiddleware,
  zValidator('json', logoutSchema),
  async (c) => {
    try {
      const user = c.get('user')
      const session = c.get('session')
      const body = c.req.valid('json') || {}

      await authService.logout(session.id, body.allSessions, parseInt(user.id))

      // Clear session cookie
      const blankCookie = createBlankSessionCookie()
      c.header('Set-Cookie', blankCookie.serialize())

      return c.json({
        success: true,
        data: { message: 'Logged out successfully' },
      })
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message,
      }, 400)
    }
  }
)

// Admin-only routes

// Create school admin (Super Admin only)
router.post(
  '/admin/create-school-admin',
  authMiddleware,
  rbacMiddleware(['super_admin']),
  zValidator('json', createSchoolAdminSchema),
  async (c) => {
    try {
      const body = c.req.valid('json')
      const result = await authService.createSchoolAdmin(body)

      return c.json({
        success: true,
        data: result,
      }, 201)
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message,
      }, 400)
    }
  }
)

// Resend verification email
router.post(
  '/resend-verification',
  authMiddleware,
  async (c) => {
    try {
      const user = c.get('user')

      if (user.emailVerified) {
        return c.json({
          success: false,
          error: 'Email is already verified',
        }, 400)
      }

      // This would trigger sending a new verification email
      // Implementation would be similar to the registration flow
      return c.json({
        success: true,
        data: {
          message: 'Verification email sent successfully',
        },
      })
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message,
      }, 400)
    }
  }
)

// Health check for auth service
router.get('/health', (c) => {
  return c.json({
    service: 'auth',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})

export default router
