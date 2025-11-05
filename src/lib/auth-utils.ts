import bcrypt from 'bcrypt'
import { Session } from 'next-auth'

const SALT_ROUNDS = 12

// User roles hierarchy (higher number = more permissions)
export const RoleHierarchy = {
  USER: 1,
  SALES: 2,
  MANAGER: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5
}

export type UserRole = 'USER' | 'SALES' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN'

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' }
  }

  return { valid: true }
}

/**
 * Check if user has required role
 */
export function checkRole(session: Session | null, allowedRoles: UserRole[]): boolean {
  if (!session || !session.user) return false

  const userRole = session.user.role as UserRole
  const userLevel = RoleHierarchy[userRole] || 0

  return allowedRoles.some(role => {
    const requiredLevel = RoleHierarchy[role] || 0

    return userLevel >= requiredLevel
  })
}

/**
 * Check if user has specific role exactly
 */
export function hasExactRole(session: Session | null, role: UserRole): boolean {
  if (!session || !session.user) return false

  return session.user.role === role
}

/**
 * Check if user has minimum role level
 */
export function hasMinimumRole(session: Session | null, minRole: UserRole): boolean {
  if (!session || !session.user) return false

  const userRole = session.user.role as UserRole
  const userLevel = RoleHierarchy[userRole] || 0
  const minLevel = RoleHierarchy[minRole] || 0

  return userLevel >= minLevel
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(session: Session | null): boolean {
  return hasExactRole(session, 'SUPER_ADMIN')
}

/**
 * Check if user is admin or higher
 */
export function isAdmin(session: Session | null): boolean {
  return hasMinimumRole(session, 'ADMIN')
}

/**
 * Check if user can modify another user
 */
export function canModifyUser(session: Session | null, targetUserId: string): boolean {
  if (!session || !session.user) return false

  // Super admin can modify anyone
  if (isSuperAdmin(session)) return true

  // User can modify themselves
  if (session.user.id === targetUserId) return true

  return false
}

/**
 * Check if user can change roles
 */
export function canChangeRole(session: Session | null, newRole: UserRole): boolean {
  if (!session || !session.user) return false

  // Only super admin can assign super admin role
  if (newRole === 'SUPER_ADMIN') {
    return isSuperAdmin(session)
  }

  // Admin can assign roles below admin
  return isAdmin(session)
}

/**
 * Sanitize user data for API responses (remove sensitive info)
 */
export function sanitizeUser(user: any) {
  const { password, ...sanitized } = user

  return sanitized
}

/**
 * Generate a random secure password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const all = uppercase + lowercase + numbers + special

  let password = ''

  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Get user-friendly role name
 */
export function getRoleName(role: UserRole): string {
  const roleNames = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    SALES: 'Sales',
    USER: 'User'
  }

  return roleNames[role] || role
}

/**
 * Get all roles that can be assigned by current user
 */
export function getAssignableRoles(session: Session | null): UserRole[] {
  if (!session || !session.user) return []

  const userRole = session.user.role as UserRole

  if (userRole === 'SUPER_ADMIN') {
    return ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'USER']
  }

  if (userRole === 'ADMIN') {
    return ['MANAGER', 'SALES', 'USER']
  }

  return []
}
