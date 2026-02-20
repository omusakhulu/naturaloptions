export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number, code?: string) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code || 'INTERNAL_ERROR'
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  public readonly details: Record<string, string[]>

  constructor(message: string, details?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR')
    this.details = details || {}
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    super(identifier ? `${resource} with id ${identifier} not found` : `${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}
