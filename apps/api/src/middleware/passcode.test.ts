import type { NextFunction, Request, Response } from 'express'
import { afterEach, describe, expect, it, vi } from 'vitest'

const originalPasscode = process.env.PASSCODE

afterEach(() => {
  if (originalPasscode === undefined) delete process.env.PASSCODE
  else process.env.PASSCODE = originalPasscode
  vi.resetModules()
})

function responseDouble() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  }
  response.status.mockReturnValue(response)
  return response
}

describe('requirePasscode', () => {
  it('rejects a missing passcode header', async () => {
    process.env.PASSCODE = 'configured-test-passcode'
    const { requirePasscode } = await import('./passcode.js')
    const request = {
      header: vi.fn().mockReturnValue(undefined),
    } as unknown as Request
    const response = responseDouble()
    const next = vi.fn() as NextFunction

    requirePasscode(request, response as unknown as Response, next)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalledWith({ error: 'Invalid passcode' })
    expect(next).not.toHaveBeenCalled()
  })

  it('accepts the configured passcode', async () => {
    process.env.PASSCODE = 'configured-test-passcode'
    const { requirePasscode } = await import('./passcode.js')
    const request = {
      header: vi.fn().mockReturnValue('configured-test-passcode'),
    } as unknown as Request
    const response = responseDouble()
    const next = vi.fn() as NextFunction

    requirePasscode(request, response as unknown as Response, next)

    expect(next).toHaveBeenCalledOnce()
    expect(response.status).not.toHaveBeenCalled()
  })
})
