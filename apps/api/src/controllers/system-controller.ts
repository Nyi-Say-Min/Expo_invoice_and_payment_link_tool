import type { NextFunction, Request, Response } from 'express'
import { config } from '../config.js'

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
