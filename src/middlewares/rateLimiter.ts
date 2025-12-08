import type { Context, Next } from 'hono'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

interface RateLimitOptions {
  windowMs?: number // Time window in milliseconds
  maxRequests?: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (c: Context) => string // Custom key generation
}

class MemoryRateLimitStore {
  private store: RateLimitStore = {}
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now()
    const resetTime = now + windowMs

    if (!this.store[key] || now > this.store[key].resetTime) {
      this.store[key] = {
        count: 1,
        resetTime,
      }
    } else {
      this.store[key].count++
    }

    return this.store[key]
  }

  reset(key: string): void {
    delete this.store[key]
  }

  cleanup(): void {
    const now = Date.now()
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) {
        delete this.store[key]
      }
    })
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store = {}
  }
}

// Global store instance
const globalStore = new MemoryRateLimitStore()

export function rateLimiter(options: RateLimitOptions = {}): (c: Context, next: Next) => Promise<Response | void> {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
  } = options

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c)
    const { count, resetTime } = globalStore.increment(key, windowMs)

    // Set rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString())
    c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - count).toString())
    c.header('X-RateLimit-Reset', new Date(resetTime).toISOString())

    if (count > maxRequests) {
      return c.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message,
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        },
        429
      )
    }

    // Continue to next middleware
    await next()

    // Post-processing: decrement count if needed
    if (skipSuccessfulRequests || skipFailedRequests) {
      const response = c.res
      const shouldSkip =
        (skipSuccessfulRequests && response.status < 400) ||
        (skipFailedRequests && response.status >= 400)

      if (shouldSkip && globalStore.store[key]) {
        globalStore.store[key].count = Math.max(0, globalStore.store[key].count - 1)
      }
    }
  }
}

// Default key generator based on IP address and user ID
function defaultKeyGenerator(c: Context): string {
  // Try to get user ID if authenticated
  const user = c.get('user')
  const userId = user?.id

  // Get IP address from various possible headers
  const ip =
    c.req.header('X-Forwarded-For')?.split(',')[0] ||
    c.req.header('X-Real-IP') ||
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Client-IP') ||
    'unknown'

  // Use user ID if available, otherwise use IP
  return userId ? `user:${userId}` : `ip:${ip}`
}

// Specific rate limiters for different endpoints
export function authRateLimiter(): (c: Context, next: Next) => Promise<Response | void> {
  return rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later',
    keyGenerator: (c) => {
      const ip = c.req.header('X-Forwarded-For')?.split(',')[0] ||
                c.req.header('X-Real-IP') ||
                'unknown'
      const email = c.req.json?.().then(body => body?.email).catch(() => null)
      return `auth:${ip}:${email || 'unknown'}`
    },
  })
}

export function paymentRateLimiter(): (c: Context, next: Next) => Promise<Response | void> {
  return rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 payment attempts per 5 minutes
    message: 'Too many payment attempts, please try again later',
    keyGenerator: (c) => {
      const user = c.get('user')
      const userId = user?.id || 'anonymous'
      return `payment:${userId}`
    },
  })
}

export function apiRateLimiter(): (c: Context, next: Next) => Promise<Response | void> {
  return rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // 1000 requests per 15 minutes for API
    message: 'API rate limit exceeded',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  })
}

export function webhookRateLimiter(): (c: Context, next: Next) => Promise<Response | void> {
  return rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 webhook calls per minute
    message: 'Webhook rate limit exceeded',
    keyGenerator: (c) => {
      // Use specific webhook identifier
      const path = c.req.path
      const ip = c.req.header('X-Forwarded-For')?.split(',')[0] || 'unknown'
      return `webhook:${path}:${ip}`
    },
  })
}

// Strict rate limiter for sensitive operations
export function strictRateLimiter(): (c: Context, next: Next) => Promise<Response | void> {
  return rateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // Only 3 attempts per hour
    message: 'Too many sensitive operation attempts, please try again later',
    keyGenerator: (c) => {
      const user = c.get('user')
      const userId = user?.id || 'anonymous'
      const ip = c.req.header('X-Forwarded-For')?.split(',')[0] || 'unknown'
      return `strict:${userId}:${ip}`
    },
  })
}

// Per-user rate limiter
export function userRateLimiter(maxRequests = 100): (c: Context, next: Next) => Promise<Response | void> {
  return rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests,
    message: 'User rate limit exceeded',
    keyGenerator: (c) => {
      const user = c.get('user')
      const userId = user?.id
      if (!userId) {
        throw new Error('User rate limiter requires authentication')
      }
      return `user:${userId}`
    },
  })
}

// IP-based rate limiter
export function ipRateLimiter(maxRequests = 100): (c: Context, next: Next) => Promise<Response | void> {
  return rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests,
    message: 'IP rate limit exceeded',
    keyGenerator: (c) => {
      const ip = c.req.header('X-Forwarded-For')?.split(',')[0] ||
                c.req.header('X-Real-IP') ||
                'unknown'
      return `ip:${ip}`
    },
  })
}

// Bypass rate limiter for specific conditions
export function bypassRateLimit(condition: (c: Context) => boolean) {
  return (rateLimiterMiddleware: (c: Context, next: Next) => Promise<Response | void>) => {
    return async (c: Context, next: Next) => {
      if (condition(c)) {
        await next()
        return
      }
      return rateLimiterMiddleware(c, next)
    }
  }
}

// Reset rate limit for a specific key
export function resetRateLimit(key: string): void {
  globalStore.reset(key)
}

// Get current rate limit status
export function getRateLimitStatus(key: string): { count: number; resetTime: number } | null {
  return globalStore.store[key] || null
}

// Cleanup function for graceful shutdown
export function cleanupRateLimit(): void {
  globalStore.destroy()
}

// Export default rate limiter
export default rateLimiter
