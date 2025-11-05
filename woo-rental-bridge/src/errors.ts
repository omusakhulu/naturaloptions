// src/errors.ts
export class WooRentalBridgeError extends Error {
  declare cause?: Error
  code?: string
  
  constructor(
    message: string,
    public readonly options?: {
      cause?: Error
      code?: string
      [key: string]: any
    }
  ) {
    super(message)
    this.name = 'WooRentalBridgeError'

    if (options?.cause) {
      this.cause = options.cause
    }

    if (options?.code) {
      this.code = options.code
    }
  }
}

export class AuthenticationError extends WooRentalBridgeError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, { ...options, code: 'AUTHENTICATION_ERROR' })
    this.name = 'AuthenticationError'
  }
}

export class ApiError extends WooRentalBridgeError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseData?: any,
    options?: {
      cause?: Error
      code?: string
    }
  ) {
    super(message, { ...options, status })
    this.name = 'ApiError'
  }
}

export class ResourceNotFoundError extends WooRentalBridgeError {
  constructor(
    public readonly resource: string,
    public readonly id?: string | number,
    options?: {
      cause?: Error
      code?: string
    }
  ) {
    super(id !== undefined ? `${resource} with ID ${id} not found` : `${resource} not found`, {
      ...options,
      code: 'RESOURCE_NOT_FOUND'
    })
    this.name = 'ResourceNotFoundError'
  }
}

// Export all error classes for easier importing
const Errors = {
  WooRentalBridgeError,
  AuthenticationError,
  ApiError,
  ResourceNotFoundError
}

export default Errors
