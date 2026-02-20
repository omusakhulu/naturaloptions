import winston from 'winston'

const { combine, timestamp, printf, colorize, json, errors } = winston.format

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).filter(k => k !== 'service').length
    ? JSON.stringify(Object.fromEntries(Object.entries(meta).filter(([k]) => k !== 'service')), null, 2)
    : ''

  return `${timestamp} [${level}]: ${stack || message} ${metaStr}`
})

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), logFormat)
  ),
  defaultMeta: { service: 'natural-options-admin' },
  transports: [new winston.transports.Console()]
})

// Only add file transports in production (not during build or test)
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5
    })
  )
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5
    })
  )
}

// Global crash handlers — log fatal errors before process exits
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Promise Rejection', { reason: String(reason) })
  })

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack })
    process.exit(1)
  })
}

export default logger

// Convenience child loggers for different contexts
export const apiLogger = logger.child({ context: 'api' })
export const dbLogger = logger.child({ context: 'db' })
export const authLogger = logger.child({ context: 'auth' })
export const webhookLogger = logger.child({ context: 'webhook' })
