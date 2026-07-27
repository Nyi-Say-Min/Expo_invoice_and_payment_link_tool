import { describe, expect, it } from 'vitest'
import type { Order } from '../db/schema.js'
import type { Product } from '../domain/catalog.js'
import { calculateOrderPricing } from '../domain/pricing.js'
import {
  orderResponse,
  pricingResponse,
  productResponse,
} from './response-mappers.js'

const product: Product = {
  sku: 'SD-KT-22',
  line: 'Single-Donor',
  productType: 'Keratin Tips 100 pcs',
  lengthIn: '22',
  unit: 'pack_100pcs',
  packWeightG: 70,
  priceUsdCents: 10_000,
  priceCny: 700,
}

describe('API response mappers', () => {
  it('adds display currency values to product and pricing responses', () => {
    expect(productResponse(product).priceUsd).toBe(100)
    const pricing = pricingResponse(calculateOrderPricing([
      { product, quantity: 1, blonde: true },
    ]))
    expect(pricing.items[0]).toMatchObject({
      unitUsdCents: 13_000,
      unitUsd: 130,
      lineUsd: 130,
    })
    expect(pricing.totalUsd).toBe(117)
  })

  it('does not expose internal Stripe identifiers in order responses', () => {
    const order = {
      id: '10000000-0000-0000-0000-000000000001',
      customerName: 'Mia',
      customerContact: 'wechat-mia',
      status: 'pending',
      items: [],
      expoDiscountEnabled: true,
      subtotalUsdCents: 10_000,
      subtotalCny: 700,
      discountKind: 'expo',
      discountUsdCents: 1_000,
      discountCny: 70,
      totalUsdCents: 9_000,
      totalCny: 630,
      totalWeightG: 70,
      stripePaymentLinkId: 'plink_private',
      stripePaymentUrl: 'https://buy.stripe.com/example',
      stripeCheckoutSessionId: 'cs_private',
      createdAt: new Date('2026-07-27T00:00:00Z'),
      updatedAt: new Date('2026-07-27T00:00:00Z'),
    } satisfies Order
    const response = orderResponse(order)

    expect(response.totalUsd).toBe(90)
    expect(response).not.toHaveProperty('stripePaymentLinkId')
    expect(response).not.toHaveProperty('stripeCheckoutSessionId')
  })
})
