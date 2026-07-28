import { afterEach, describe, expect, it, vi } from 'vitest'

const originalAppMode = process.env.APP_MODE
const originalNodeEnv = process.env.NODE_ENV
const originalPasscode = process.env.PASSCODE
const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY

afterEach(() => {
  if (originalAppMode === undefined) delete process.env.APP_MODE
  else process.env.APP_MODE = originalAppMode

  if (originalNodeEnv === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = originalNodeEnv

  if (originalPasscode === undefined) delete process.env.PASSCODE
  else process.env.PASSCODE = originalPasscode

  if (originalStripeSecretKey === undefined) delete process.env.STRIPE_SECRET_KEY
  else process.env.STRIPE_SECRET_KEY = originalStripeSecretKey

  vi.resetModules()
})

describe('submission safeguards', () => {
  it('rejects any non-test application mode', async () => {
    process.env.APP_MODE = 'live'
    process.env.NODE_ENV = 'test'
    process.env.PASSCODE = 'test-passcode'
    process.env.STRIPE_SECRET_KEY = 'not-used-in-live-mode-test'

    const { validateConfig } = await import('./config.js')

    expect(() => validateConfig()).toThrow(
      'APP_MODE must be test for this test-mode-only application',
    )
  })

  it('accepts test mode with a test Stripe key and passcode', async () => {
    process.env.APP_MODE = 'test'
    process.env.NODE_ENV = 'test'
    process.env.PASSCODE = 'test-passcode'
    process.env.STRIPE_SECRET_KEY = 'sk_test_not-a-real-key'

    const { validateConfig } = await import('./config.js')

    expect(() => validateConfig()).not.toThrow()
  })

  it('requires a passcode in every environment', async () => {
    process.env.APP_MODE = 'test'
    process.env.NODE_ENV = 'development'
    process.env.PASSCODE = ''
    process.env.STRIPE_SECRET_KEY = ''

    const { validateConfig } = await import('./config.js')

    expect(() => validateConfig()).toThrow(
      'PASSCODE is required and cannot be a placeholder',
    )
  })

  it('rejects the example passcode placeholder', async () => {
    process.env.APP_MODE = 'test'
    process.env.NODE_ENV = 'development'
    process.env.PASSCODE = 'replace-with-a-strong-passcode'
    process.env.STRIPE_SECRET_KEY = ''

    const { validateConfig } = await import('./config.js')

    expect(() => validateConfig()).toThrow(
      'PASSCODE is required and cannot be a placeholder',
    )
  })
})
