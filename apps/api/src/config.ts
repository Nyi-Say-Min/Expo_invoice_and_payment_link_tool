import 'dotenv/config'

export type AppMode = 'test' | 'live'

const appMode: AppMode = process.env.APP_MODE === 'live' ? 'live' : 'test'
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? ''
const nodeEnv = process.env.NODE_ENV ?? 'development'

if (stripeSecretKey) {
  const expectedPrefix = appMode === 'live' ? 'sk_live_' : 'sk_test_'
  if (!stripeSecretKey.startsWith(expectedPrefix)) {
    throw new Error(`Stripe key does not match APP_MODE=${appMode}`)
  }
}
if (nodeEnv === 'production' && !process.env.PASSCODE?.trim()) {
  throw new Error('PASSCODE is required in production')
}

export const config = {
  appMode,
  nodeEnv,
  port: Number(process.env.PORT ?? 3001),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432',
  stripeSecretKey,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? '',
  passcode: process.env.PASSCODE?.trim() ?? '',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}

export function requireConfig(
  key: 'stripeSecretKey' | 'stripeWebhookSecret' | 'passcode',
) {
  const value = config[key]
  if (!value) throw new Error(`${key} is not configured`)
  return value
}
