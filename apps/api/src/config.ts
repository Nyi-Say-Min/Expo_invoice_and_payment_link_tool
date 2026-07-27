import { config as loadEnv } from 'dotenv'
import path from 'node:path'

loadEnv({
  path: [
    path.resolve(process.cwd(), 'apps/api/.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
  ],
  quiet: true,
})

export type AppMode = 'test' | 'live'

const appMode: AppMode = process.env.APP_MODE === 'live' ? 'live' : 'test'
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? ''
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? ''
const nodeEnv = process.env.NODE_ENV ?? 'development'

function isPlaceholder(value: string) {
  return value.includes('...') || /your_|replace|changeme/i.test(value)
}

function validateStripeSecretKey(value: string) {
  const expectedPrefixes = appMode === 'live'
    ? ['sk_live_', 'rk_live_']
    : ['sk_test_', 'rk_test_']
  if (isPlaceholder(value)) {
    throw new Error('STRIPE_SECRET_KEY is still a placeholder')
  }
  if (!expectedPrefixes.some((prefix) => value.startsWith(prefix))) {
    throw new Error(`Stripe key does not match APP_MODE=${appMode}`)
  }
}

export const config = {
  appMode,
  nodeEnv,
  port: Number(process.env.PORT ?? 3001),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/trunov_expo',
  stripeSecretKey,
  stripeWebhookSecret,
  passcode: process.env.PASSCODE?.trim() ?? '',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}

export function validateConfig() {
  if (stripeSecretKey) validateStripeSecretKey(stripeSecretKey)
  if (
    stripeWebhookSecret &&
    (isPlaceholder(stripeWebhookSecret) ||
      !stripeWebhookSecret.startsWith('whsec_'))
  ) {
    throw new Error('STRIPE_WEBHOOK_SECRET is invalid or still a placeholder')
  }
  if (nodeEnv === 'production' && !config.passcode) {
    throw new Error('PASSCODE is required in production')
  }
}

export function requireConfig(
  key: 'stripeSecretKey' | 'stripeWebhookSecret' | 'passcode',
) {
  const value = config[key]
  if (!value) throw new Error(`${key} is not configured`)
  if (key === 'stripeSecretKey') validateStripeSecretKey(value)
  if (
    key === 'stripeWebhookSecret' &&
    (isPlaceholder(value) || !value.startsWith('whsec_'))
  ) {
    throw new Error('STRIPE_WEBHOOK_SECRET is invalid or still a placeholder')
  }
  return value
}
