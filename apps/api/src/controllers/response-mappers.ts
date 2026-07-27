import type { Order } from '../db/schema.js'
import type { Product } from '../domain/catalog.js'
import type { OrderPricing } from '../domain/pricing.js'

export function productResponse(product: Product) {
  return {
    ...product,
    priceUsd: product.priceUsdCents / 100,
  }
}

export function pricingResponse(pricing: OrderPricing) {
  return {
    ...pricing,
    items: pricing.items.map((item) => ({
      ...item,
      unitUsd: item.unitUsdCents / 100,
      lineUsd: item.lineUsdCents / 100,
    })),
    subtotalUsd: pricing.subtotalUsdCents / 100,
    discountUsd: pricing.discountUsdCents / 100,
    totalUsd: pricing.totalUsdCents / 100,
  }
}

export function orderResponse(order: Order) {
  return {
    id: order.id,
    customerName: order.customerName,
    customerContact: order.customerContact,
    status: order.status,
    items: order.items,
    expoDiscountEnabled: order.expoDiscountEnabled,
    subtotalUsdCents: order.subtotalUsdCents,
    subtotalUsd: order.subtotalUsdCents / 100,
    subtotalCny: order.subtotalCny,
    discountKind: order.discountKind,
    discountUsdCents: order.discountUsdCents,
    discountUsd: order.discountUsdCents / 100,
    discountCny: order.discountCny,
    totalUsdCents: order.totalUsdCents,
    totalUsd: order.totalUsdCents / 100,
    totalCny: order.totalCny,
    totalWeightG: order.totalWeightG,
    stripePaymentUrl: order.stripePaymentUrl,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}
