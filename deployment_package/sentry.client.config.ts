import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // Adjust this value in production.
  tracesSampleRate: 0.1,

  // Capture Replay for 0% of all sessions, plus for 100% of sessions with an error.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  environment: process.env.NODE_ENV,

  // Disable Sentry when DSN is not configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN
})
