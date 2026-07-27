import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from '../config.js'
import * as schema from './schema.js'

const client = postgres(config.databaseUrl, {
  max: config.nodeEnv === 'production' ? 5 : 1,
})

export const db = drizzle(client, { schema })
