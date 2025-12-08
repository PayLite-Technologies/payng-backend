import { db } from '@/core/db'
import { users, schools, students } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { hash, verify } from '@node-rs/argon2'
import { generateId } from 'lucia'
import { createSession, invalidateSession, invalidateUserSessions } from '@/core/auth'
import { config } from '@/core/config'
import type {
  RegisterUserInput,
  LoginUserInput,
  AdminLoginInput,
  VerifyEmailInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
  ChangePasswordInput,
  CreateSchoolAdminInput,
} from './validators'
import { sendEmail } from '@/utils/email'
import { generateRandomString, alphabet } from 'oslo/crypto'
import jwt from 'jsonwebtoken'

export class AuthService {
  // Hash password using Argon2
  private async hashPassword(password: string): Promise<string> {
    return await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    })
  }

  // Verify password
  private async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await verify(hash, password)
    } catch {
      return false
    }
  }

  // Generate verification token
  private generateVerificationToken(): string {
    return generateRandomString(32, alphabet('a-z', 'A-Z', '0-9'))
  }

  // Generate JWT token for email verification/password reset
  private generateJWT(payload: any, expiresIn: string = '1h'): string {
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn })
  }

  // Verify JWT token
  private verifyJWT(token: string): any {
    try {
      return jwt.verify(token, config.JWT_SECRET)
    } catch {
      return null
    }
  }

  // Register a new user (Parent/Student)
  async registerUser(input: RegisterUserInput) {
    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email.toLowerCase()),
    })

    if (existingUser) {
      throw new Error('Email already registered')
    }

    // Validate school exists
    const school = await db.query.schools.findFirst({
      where: eq(schools.code, input.schoolCode),
    })

    if (!school || !school.isActive) {
      throw new Error('Invalid or inactive school code')
    }

    // Hash password
    const passwordHash = await this.hashPassword(input.password)

    // Generate email verification token
    const verificationToken = this.generateVerificationToken()

    // Create user
    const [newUser] = await db.insert(users).values({
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      emailVerificationToken: verificationToken,
      emailVerified: false,
      isActive: true,
    }).returning()

    // Send verification email
    if (config.RESEND_API_KEY) {
      try {
        await this.sendVerificationEmail(newUser.email, verificationToken, newUser.firstName)
      } catch (error) {
        console.error('Failed to send verification email:', error)
        // Don't fail registration if email sending fails
      }
    }

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        emailVerified: newUser.emailVerified,
      },
      message: 'Registration successful. Please check your email for verification link.',
    }
  }

  // User login (Parent/Student)
  async loginUser(input: LoginUserInput) {
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.email, input.email.toLowerCase()),
        eq(users.isActive, true)
      ),
    })

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const validPassword = await this.verifyPassword(user.passwordHash, input.password)
    if (!validPassword) {
      throw new Error('Invalid email or password')
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated')
    }

    // Update last login
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id))

    // Create session
    const session = await createSession(user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    }
  }

  // Admin login (School Admin/Super Admin)
  async adminLogin(input: AdminLoginInput) {
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.email, input.email.toLowerCase()),
        eq(users.isActive, true)
      ),
    })

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Verify user has admin role
    if (!['school_admin', 'super_admin'].includes(user.role)) {
      throw new Error('Access denied. Admin privileges required.')
    }

    // If role is specified in input, verify it matches
    if (input.role && user.role !== input.role) {
      throw new Error('Invalid role for this login')
    }

    // Verify password
    const validPassword = await this.verifyPassword(user.passwordHash, input.password)
    if (!validPassword) {
      throw new Error('Invalid email or password')
    }

    // Update last login
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id))

    // Create session
    const session = await createSession(user.id)

    // For school admin, get school info
    let schoolInfo = null
    if (user.role === 'school_admin') {
      schoolInfo = await db.query.schools.findFirst({
        where: eq(schools.adminUserId, user.id),
      })
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
      school: schoolInfo,
    }
  }

  // Verify email
  async verifyEmail(input: VerifyEmailInput) {
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.email, input.email.toLowerCase()),
        eq(users.emailVerificationToken, input.token)
      ),
    })

    if (!user) {
      throw new Error('Invalid verification token')
    }

    if (user.emailVerified) {
      throw new Error('Email already verified')
    }

    // Update user as verified
    await db.update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
      })
      .where(eq(users.id, user.id))

    return {
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: true,
      },
    }
  }

  // Request password reset
  async forgotPassword(input: ForgotPasswordInput) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email.toLowerCase()),
    })

    if (!user) {
      // Don't reveal if email exists or not
      return {
        message: 'If an account with this email exists, you will receive a password reset link.',
      }
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = this.generateJWT(
      { userId: user.id, email: user.email },
      '1h'
    )

    // Update user with reset token
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await db.update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      })
      .where(eq(users.id, user.id))

    // Send reset email
    if (config.RESEND_API_KEY) {
      try {
        await this.sendPasswordResetEmail(user.email, resetToken, user.firstName)
      } catch (error) {
        console.error('Failed to send password reset email:', error)
      }
    }

    return {
      message: 'If an account with this email exists, you will receive a password reset link.',
    }
  }

  // Reset password
  async resetPassword(input: ResetPasswordInput) {
    // Verify JWT token
    const payload = this.verifyJWT(input.token)
    if (!payload) {
      throw new Error('Invalid or expired reset token')
    }

    // Find user and verify token matches
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, payload.userId),
        eq(users.passwordResetToken, input.token)
      ),
    })

    if (!user) {
      throw new Error('Invalid or expired reset token')
    }

    // Check if token is expired
    if (user.passwordResetExpiry && user.passwordResetExpiry < new Date()) {
      throw new Error('Reset token has expired')
    }

    // Hash new password
    const passwordHash = await this.hashPassword(input.password)

    // Update password and clear reset token
    await db.update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      })
      .where(eq(users.id, user.id))

    // Invalidate all existing sessions
    await invalidateUserSessions(user.id)

    return {
      message: 'Password reset successfully. Please log in with your new password.',
    }
  }

  // Update user profile
  async updateProfile(userId: number, input: UpdateProfileInput) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Update user profile
    const [updatedUser] = await db.update(users)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning()

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        avatarUrl: updatedUser.avatarUrl,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
      },
    }
  }

  // Change password
  async changePassword(userId: number, input: ChangePasswordInput) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Verify current password
    const validPassword = await this.verifyPassword(user.passwordHash, input.currentPassword)
    if (!validPassword) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const passwordHash = await this.hashPassword(input.newPassword)

    // Update password
    await db.update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    // Invalidate all other sessions (keep current one)
    await invalidateUserSessions(userId)

    return {
      message: 'Password changed successfully',
    }
  }

  // Create school admin (Super Admin only)
  async createSchoolAdmin(input: CreateSchoolAdminInput) {
    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email.toLowerCase()),
    })

    if (existingUser) {
      throw new Error('Email already registered')
    }

    // Verify school exists
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, input.schoolId),
    })

    if (!school) {
      throw new Error('School not found')
    }

    // Check if school already has an admin
    if (school.adminUserId) {
      throw new Error('School already has an admin')
    }

    // Hash password
    const passwordHash = await this.hashPassword(input.password)

    // Create school admin user
    const [newAdmin] = await db.insert(users).values({
      email: input.email.toLowerCase(),
      passwordHash,
      role: 'school_admin',
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      emailVerified: true, // Auto-verify admin accounts
      isActive: true,
    }).returning()

    // Update school with admin user ID
    await db.update(schools)
      .set({
        adminUserId: newAdmin.id,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, input.schoolId))

    return {
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        role: newAdmin.role,
      },
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
      },
    }
  }

  // Logout user
  async logout(sessionId: string, allSessions = false, userId?: number) {
    if (allSessions && userId) {
      // Logout from all sessions
      await invalidateUserSessions(userId)
    } else {
      // Logout from current session only
      await invalidateSession(sessionId)
    }

    return {
      message: allSessions ? 'Logged out from all sessions' : 'Logged out successfully',
    }
  }

  // Get user profile
  async getUserProfile(userId: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      throw new Error('User not found')
    }

    // If user is a parent, get their children
    let children = []
    if (user.role === 'parent') {
      children = await db.query.students.findMany({
        where: eq(students.parentUserIds, [userId]),
      })
    }

    // If user is school admin, get school info
    let school = null
    if (user.role === 'school_admin') {
      school = await db.query.schools.findFirst({
        where: eq(schools.adminUserId, userId),
      })
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      children,
      school,
    }
  }

  // Send verification email
  private async sendVerificationEmail(email: string, token: string, firstName: string) {
    const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Payng!</h2>
        <p>Hello ${firstName},</p>
        <p>Thank you for registering with Payng. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If you didn't create this account, please ignore this email.</p>
        <p>The verification link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by Payng. If you have any questions, please contact our support team.
        </p>
      </div>
    `

    await sendEmail(email, 'Verify your Payng account', html)
  }

  // Send password reset email
  private async sendPasswordResetEmail(email: string, token: string, firstName: string) {
    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${token}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${firstName},</p>
        <p>You requested to reset your password for your Payng account. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>The reset link will expire in 1 hour.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by Payng. If you have any questions, please contact our support team.
        </p>
      </div>
    `

    await sendEmail(email, 'Reset your Payng password', html)
  }
}
