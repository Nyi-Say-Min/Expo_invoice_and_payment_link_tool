import type { NextFunction, Request, Response } from 'express'
import { config } from '../config.js'

function isDatabaseError(error: unknown): error is Error {
  return error instanceof Error && error.name === 'DrizzleQueryError'
}

function databaseCause(error: Error) {
  const cause = 'cause' in error ? error.cause : null
  return cause instanceof Error ? cause.message : 'Unknown database error'
}

type StripeFailure = Error & {
  type?: string
  detail?: {
    code?: string
    message?: string
  }
}

function isStripeConnectionError(error: unknown): error is StripeFailure {
  return error instanceof Error &&
    'type' in error &&
    error.type === 'StripeConnectionError'
}

export const systemController = {
  health(_request: Request, response: Response) {
    response.json({ data: { ok: true, mode: config.appMode } })
  },

  notFound(_request: Request, response: Response) {
    response.status(404).json({ error: 'Not found' })
  },

  error(
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) {
    if (isDatabaseError(error)) {
      console.error(`Database request failed: ${databaseCause(error)}`)
      return response.status(503).json({
        error:
          'Database unavailable. Verify DATABASE_URL and run npm run db:migrate.',
      })
    }
    if (isStripeConnectionError(error)) {
      const code = error.detail?.code ?? 'unknown'
      const detail = error.detail?.message || error.message
      console.error(`Stripe connection failed (${code}): ${detail}`)
      return response.status(503).json({
        error:
          'Unable to reach Stripe API. Check outbound HTTPS access to api.stripe.com.',
      })
    }
    const status =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number'
        ? error.status
        : 400
    response.status(status).json({
      error: error instanceof Error ? error.message : 'Request failed',
    })
  },
}
