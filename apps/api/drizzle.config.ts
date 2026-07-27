import { defineConfig } from 'drizzle-kit'
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

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is required. Copy .env.example to .env and update its credentials.',
  )
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
