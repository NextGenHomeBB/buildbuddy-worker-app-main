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

// Global rate limiter instance
export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000) // 5 attempts per 15 minutes