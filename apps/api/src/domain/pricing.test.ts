import { beforeAll, describe, expect, it } from 'vitest'
import { catalogBySku, loadCatalog, type Product } from './catalog.js'
import { calculateOrderPricing } from './pricing.js'

let products: Map<string, Product>

beforeAll(() => {
  products = catalogBySku(loadCatalog())
})

function product(sku: string) {
  const found = products.get(sku)
  if (!found) throw new Error(`Missing test product ${sku}`)
  return found
}

describe('calculateOrderPricing', () => {
  it('matches the measured live-call order', () => {
    const result = calculateOrderPricing([
      { product: product('SD-KT-22'), quantity: 1 },
      { product: product('SD-KT-22'), quantity: 1, blonde: true },
      { product: product('RAW-MM-24'), quantity: 3 },
    ])

    expect(result).toMatchObject({
      subtotalUsdCents: 278_000,
      subtotalCny: 19_460,
      discountKind: 'expo',
      discountUsdCents: 27_800,
      totalUsdCents: 250_200,
      totalCny: 17_514,
      totalWeightG: 3_140,
    })
    expect(result.items.map((item) => item.unitUsdCents)).toEqual([
      10_000,
      13_000,
      85_000,
    ])
  })

  it('applies volume discount at exactly 10kg without stacking expo discount', () => {
    const below = calculateOrderPricing([
      { product: product('RAW-MM-24'), quantity: 9.999 },
    ])
    const threshold = calculateOrderPricing([
      { product: product('RAW-MM-24'), quantity: 10 },
    ])

    expect(below.totalWeightG).toBe(9_999)
    expect(below.discountKind).toBe('expo')
    expect(threshold.totalWeightG).toBe(10_000)
    expect(threshold.discountKind).toBe('volume')
    expect(threshold.discountUsdCents).toBe(85_000)
  })

  it('supports disabling expo discount while volume remains automatic', () => {
    expect(calculateOrderPricing([
      { product: product('SD-KT-22'), quantity: 1 },
    ], false).discountKind).toBe('none')

    expect(calculateOrderPricing([
      { product: product('RAW-MM-24'), quantity: 10 },
    ], false).discountKind).toBe('volume')
  })

  it('accepts fractional kilograms but rejects invalid pack quantities', () => {
    expect(calculateOrderPricing([
      { product: product('RAW-MM-24'), quantity: 0.5 },
    ]).totalWeightG).toBe(500)

    expect(() => calculateOrderPricing([
      { product: product('SD-KT-22'), quantity: 0.5 },
    ])).toThrow('whole number')
    expect(() => calculateOrderPricing([
      { product: product('RAW-MM-24'), quantity: 0 },
    ])).toThrow('greater than zero')
  })

  it('does not assign unknown weight to the Trial Pack', () => {
    const result = calculateOrderPricing([
      { product: product('PROMO-TRIAL'), quantity: 2 },
    ])
    expect(result.totalWeightG).toBe(0)
    expect(result.subtotalCny).toBe(1_998)
  })
})
