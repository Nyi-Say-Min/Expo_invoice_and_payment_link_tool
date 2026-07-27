import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import type { PricedItem } from '../domain/pricing.js'

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerName: text('customer_name').notNull(),
  customerContact: text('customer_contact').notNull(),
  status: text('status').notNull().default('pending'),
  items: jsonb('items').$type<PricedItem[]>().notNull(),
  expoDiscountEnabled: boolean('expo_discount_enabled').notNull(),
  subtotalUsdCents: integer('subtotal_usd_cents').notNull(),
  subtotalCny: integer('subtotal_cny').notNull(),
  discountKind: text('discount_kind').notNull(),
  discountUsdCents: integer('discount_usd_cents').notNull(),
  discountCny: integer('discount_cny').notNull(),
  totalUsdCents: integer('total_usd_cents').notNull(),
  totalCny: integer('total_cny').notNull(),
  totalWeightG: integer('total_weight_g').notNull(),
  stripePaymentLinkId: text('stripe_payment_link_id').unique(),
  stripePaymentUrl: text('stripe_payment_url'),
  stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Order = typeof orders.$inferSelect
