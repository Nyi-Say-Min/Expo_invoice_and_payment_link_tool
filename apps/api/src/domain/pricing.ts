import type { Product } from './catalog.js'

export type OrderItemInput = {
  product: Product
  quantity: number
  blonde?: boolean
}

export type DiscountKind = 'none' | 'expo' | 'volume'

export type PricedItem = {
  sku: string
  description: string
  quantity: number
  blonde: boolean
  unitUsdCents: number
  unitCny: number
  lineUsdCents: number
  lineCny: number
  weightG: number
}

export type OrderPricing = {
  items: PricedItem[]
  subtotalUsdCents: number
  subtotalCny: number
  discountKind: DiscountKind
  discountUsdCents: number
  discountCny: number
  totalUsdCents: number
  totalCny: number
  totalWeightG: number
}

const BLONDE_MULTIPLIER = 1.3
const DISCOUNT_RATE = 0.1
const VOLUME_THRESHOLD_G = 10_000

function validateQuantity(product: Product, quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(`${product.sku}: quantity must be greater than zero`)
  }
  if (product.unit !== 'per_kg' && !Number.isInteger(quantity)) {
    throw new Error(`${product.sku}: quantity must be a whole number`)
  }
  if (product.unit === 'per_kg' && Math.round(quantity * 1000) !== quantity * 1000) {
    throw new Error(`${product.sku}: per_kg quantity supports at most 3 decimal places`)
  }
}

function description(product: Product) {
  return [
    product.line,
    product.productType,
    product.lengthIn ? `${product.lengthIn}"` : '',
  ].filter(Boolean).join(' ')
}

export function calculateOrderPricing(
  inputs: OrderItemInput[],
  expoDiscountEnabled = true,
): OrderPricing {
  const items = inputs.map(({ product, quantity, blonde = false }) => {
    validateQuantity(product, quantity)
    const multiplier = blonde ? BLONDE_MULTIPLIER : 1
    const unitUsdCents = Math.round(product.priceUsdCents * multiplier)
    const unitCny = Math.round(product.priceCny * multiplier)

    return {
      sku: product.sku,
      description: description(product),
      quantity,
      blonde,
      unitUsdCents,
      unitCny,
      lineUsdCents: Math.round(unitUsdCents * quantity),
      lineCny: Math.round(unitCny * quantity),
      weightG: Math.round((product.packWeightG ?? 0) * quantity),
    }
  })

  const subtotalUsdCents = items.reduce((sum, item) => sum + item.lineUsdCents, 0)
  const subtotalCny = items.reduce((sum, item) => sum + item.lineCny, 0)
  const totalWeightG = items.reduce((sum, item) => sum + item.weightG, 0)
  const discountKind: DiscountKind =
    totalWeightG >= VOLUME_THRESHOLD_G
      ? 'volume'
      : expoDiscountEnabled
        ? 'expo'
        : 'none'
  const discountUsdCents =
    discountKind === 'none' ? 0 : Math.round(subtotalUsdCents * DISCOUNT_RATE)
  const discountCny =
    discountKind === 'none' ? 0 : Math.round(subtotalCny * DISCOUNT_RATE)

  return {
    items,
    subtotalUsdCents,
    subtotalCny,
    discountKind,
    discountUsdCents,
    discountCny,
    totalUsdCents: subtotalUsdCents - discountUsdCents,
    totalCny: subtotalCny - discountCny,
    totalWeightG,
  }
}
