import { describe, it, expect } from 'vitest'

import { AppError, ValidationError, NotFoundError, AuthError, ForbiddenError, ConflictError } from '../errors'

describe('AppError', () => {
  it('sets message, statusCode, code, and isOperational', () => {
    const error = new AppError('Something went wrong', 500, 'SERVER_ERROR')

    expect(error.message).toBe('Something went wrong')
    expect(error.statusCode).toBe(500)
    expect(error.code).toBe('SERVER_ERROR')
    expect(error.isOperational).toBe(true)
  })

  it('defaults code to INTERNAL_ERROR when not provided', () => {
    const error = new AppError('Oops', 500)

    expect(error.code).toBe('INTERNAL_ERROR')
  })

  it('has a stack trace', () => {
    const error = new AppError('Stack test', 500)

    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('Stack test')
  })

  it('is an instance of Error', () => {
    const error = new AppError('test', 500)

    expect(error).toBeInstanceOf(Error)
  })
})

describe('ValidationError', () => {
  it('has statusCode 400 and code VALIDATION_ERROR', () => {
    const error = new ValidationError('Invalid input')

    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.message).toBe('Invalid input')
  })

  it('defaults details to an empty object', () => {
    const error = new ValidationError('Bad data')

    expect(error.details).toEqual({})
  })

  it('accepts custom details', () => {
    const details = { email: ['Email is required', 'Must be valid'], name: ['Too short'] }
    const error = new ValidationError('Validation failed', details)

    expect(error.details).toEqual(details)
  })

  it('is an instance of AppError and Error', () => {
    const error = new ValidationError('test')

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(Error)
  })
})

describe('NotFoundError', () => {
  it('has statusCode 404 and code NOT_FOUND', () => {
    const error = new NotFoundError('User')

    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })

  it('includes resource name and identifier in message when identifier is provided', () => {
    const error = new NotFoundError('User', '123')

    expect(error.message).toBe('User with id 123 not found')
  })

  it('works with numeric identifier', () => {
    const error = new NotFoundError('Order', 42)

    expect(error.message).toBe('Order with id 42 not found')
  })

  it('says resource not found when no identifier is provided', () => {
    const error = new NotFoundError('Product')

    expect(error.message).toBe('Product not found')
  })

  it('is an instance of AppError and Error', () => {
    const error = new NotFoundError('Item')

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(Error)
  })
})

describe('AuthError', () => {
  it('has statusCode 401 and code UNAUTHORIZED', () => {
    const error = new AuthError()

    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('UNAUTHORIZED')
  })

  it('defaults message to Unauthorized', () => {
    const error = new AuthError()

    expect(error.message).toBe('Unauthorized')
  })

  it('accepts a custom message', () => {
    const error = new AuthError('Token expired')

    expect(error.message).toBe('Token expired')
  })

  it('is an instance of AppError and Error', () => {
    const error = new AuthError()

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(Error)
  })
})

describe('ForbiddenError', () => {
  it('has statusCode 403 and code FORBIDDEN', () => {
    const error = new ForbiddenError()

    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('FORBIDDEN')
  })

  it('defaults message to Forbidden', () => {
    const error = new ForbiddenError()

    expect(error.message).toBe('Forbidden')
  })

  it('accepts a custom message', () => {
    const error = new ForbiddenError('Admin access required')

    expect(error.message).toBe('Admin access required')
  })

  it('is an instance of AppError and Error', () => {
    const error = new ForbiddenError()

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(Error)
  })
})

describe('ConflictError', () => {
  it('has statusCode 409 and code CONFLICT', () => {
    const error = new ConflictError('Resource already exists')

    expect(error.statusCode).toBe(409)
    expect(error.code).toBe('CONFLICT')
  })

  it('sets a custom message', () => {
    const error = new ConflictError('Email already in use')

    expect(error.message).toBe('Email already in use')
  })

  it('is an instance of AppError and Error', () => {
    const error = new ConflictError('Duplicate')

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(Error)
  })
})
