import DOMPurify from 'dompurify'
import { z } from 'zod'

// XSS Protection utility
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: []
  })
}

// Safe text rendering (strips all HTML)
export const sanitizeText = (text: string): string => {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

// Input validation schemas
export const taskValidationSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .refine(val => sanitizeText(val).length > 0, 'Title cannot be empty after sanitization'),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  priority: z.enum(['low', 'medium', 'high'])
})

export const profileValidationSchema = z.object({
  full_name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .refine(val => sanitizeText(val).length > 0, 'Name cannot be empty after sanitization')
})

// Enhanced validation schemas for security
export const userRoleValidationSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role: z.enum(['admin', 'manager', 'worker'])
})

export const projectAssignmentSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  assignee: z.string().uuid('Invalid assignee ID').optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional()
})

// Enhanced profile validation with work role security
export const enhancedProfileValidationSchema = z.object({
  full_name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .refine(val => sanitizeText(val).length > 0, 'Name cannot be empty after sanitization'),
  work_role: z.array(z.string().max(50)).max(5, 'Too many work roles').optional(),
  avatar_url: z.string().url().optional().or(z.literal(''))
})

// Task list validation
export const taskListValidationSchema = z.object({
  name: z.string()
    .min(1, 'List name is required')
    .max(100, 'List name must be less than 100 characters')
    .refine(val => sanitizeText(val).length > 0, 'List name cannot be empty after sanitization'),
  color_hex: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
})

// Rate limiting for sensitive operations
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now()
    const userAttempts = this.attempts.get(key) || []
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs)
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false
    }
    
    // Add current attempt
    recentAttempts.push(now)
    this.attempts.set(key, recentAttempts)
    
    return true
  }
  
  getRemainingTime(key: string): number {
    const userAttempts = this.attempts.get(key) || []
    if (userAttempts.length === 0) return 0
    
    const oldestAttempt = Math.min(...userAttempts)
    const timeElapsed = Date.now() - oldestAttempt
    
    return Math.max(0, this.windowMs - timeElapsed)
  }
}

// Global rate limiter instances
export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000) // 5 attempts per 15 minutes
export const taskCreationLimiter = new RateLimiter(10, 5 * 60 * 1000) // 10 tasks per 5 minutes
export const taskUpdateLimiter = new RateLimiter(20, 5 * 60 * 1000) // 20 task updates per 5 minutes
export const profileUpdateLimiter = new RateLimiter(5, 10 * 60 * 1000) // 5 profile updates per 10 minutes
export const taskListLimiter = new RateLimiter(5, 5 * 60 * 1000) // 5 list operations per 5 minutes
export const roleChangeLimiter = new RateLimiter(3, 60 * 60 * 1000) // 3 role changes per hour

// Enhanced security utility functions with database rate limiting integration
export const validateOperation = async (operation: string, userId: string): Promise<boolean> => {
  const key = `${operation}:${userId}`
  
  // Client-side rate limiting first (immediate feedback)
  const clientAllowed = (() => {
    switch (operation) {
      case 'auth':
        return authRateLimiter.isAllowed(key)
      case 'task_creation':
        return taskCreationLimiter.isAllowed(key)
      case 'task_update':
        return taskUpdateLimiter.isAllowed(key)
      case 'profile_update':
        return profileUpdateLimiter.isAllowed(key)
      case 'task_list_operation':
        return taskListLimiter.isAllowed(key)
      case 'role_change':
        return roleChangeLimiter.isAllowed(key)
      default:
        return true
    }
  })()
  
  if (!clientAllowed) {
    logSecurityEvent({
      action: `Rate limit exceeded for ${operation}`,
      userId,
      severity: 'medium',
      details: { operation, timestamp: new Date().toISOString() }
    })
    return false
  }
  
  // For critical operations, also check database rate limiting
  if (['role_change', 'profile_update'].includes(operation)) {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.rpc('check_rate_limit', {
        operation_name: operation,
        max_attempts: operation === 'role_change' ? 3 : 5,
        window_minutes: operation === 'role_change' ? 60 : 10
      })
      
      if (!data) {
        logSecurityEvent({
          action: `Database rate limit exceeded for ${operation}`,
          userId,
          severity: 'high',
          details: { operation, timestamp: new Date().toISOString() }
        })
        return false
      }
    } catch (error) {
      logSecurityEvent({
        action: `Rate limit check failed for ${operation}`,
        userId,
        severity: 'medium',
        details: { operation, error: error instanceof Error ? error.message : 'Unknown error' }
      })
      // Allow operation to proceed if rate limit check fails to avoid blocking users
    }
  }
  
  return true
}

// Enhanced logging for security events
export const logSecurityEvent = (event: {
  action: string
  userId?: string
  details?: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}) => {
  console.log(`[SECURITY] ${event.severity.toUpperCase()}: ${event.action}`, {
    userId: event.userId,
    timestamp: new Date().toISOString(),
    details: event.details
  })
}