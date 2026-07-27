import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from '../config.js'
import * as schema from './schema.js'

const client = postgres(config.databaseUrl, {
  max: config.nodeEnv === 'production' ? 5 : 1,
})

export const db = drizzle(client, { schema })

export async function assertDatabaseReady() {
  const [result] = await client<{ ordersTable: string | null }[]>`
    select to_regclass('public.orders')::text as "ordersTable"
  `
  if (!result?.ordersTable) {
    throw new Error(
      'Database schema is missing. Run npm run db:migrate before starting the API.',
    )
  }
}
