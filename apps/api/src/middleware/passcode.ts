import { timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { requireConfig } from '../config.js'

function matches(provided: string, expected: string) {
  const providedBytes = Buffer.from(provided)
  const expectedBytes = Buffer.from(expected)
  return providedBytes.length === expectedBytes.length &&
    timingSafeEqual(providedBytes, expectedBytes)
}

export function requirePasscode(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const expected = requireConfig('passcode')
  if (!matches(request.header('x-passcode') ?? '', expected)) {
    response.status(401).json({ error: 'Invalid passcode' })
    return
  }
  next()
}
