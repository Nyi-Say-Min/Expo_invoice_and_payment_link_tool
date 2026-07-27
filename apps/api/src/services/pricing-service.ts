import { catalogBySku, loadCatalog } from '../domain/catalog.js'
import { calculateOrderPricing } from '../domain/pricing.js'

export const catalog = loadCatalog()
const productsBySku = catalogBySku(catalog)

export function pricingFromInput(input: Record<string, unknown>) {
  const items = input.items
  if (!Array.isArray(items) || items.length > 50) {
    throw new Error('items must be an array with at most 50 entries')
  }
  return calculateOrderPricing(items.map((value) => {
    if (!value || typeof value !== 'object') {
      throw new Error('Each order item must be an object')
    }
    const item = value as Record<string, unknown>
    const product = productsBySku.get(String(item.sku ?? ''))
    if (!product) throw new Error(`Unknown SKU: ${String(item.sku ?? '')}`)
    return {
      product,
      quantity: Number(item.quantity),
      blonde: Boolean(item.blonde),
    }
  }), input.expoDiscountEnabled !== false)
}
