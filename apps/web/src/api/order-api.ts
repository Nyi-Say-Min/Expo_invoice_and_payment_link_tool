import { httpClient } from '../lib/http-client'
import type { ApiEnvelope, CartItem, Pricing } from '../types/commerce'

export async function getPricing(
  items: CartItem[],
  expoDiscountEnabled: boolean,
) {
  const response = await httpClient.post<ApiEnvelope<Pricing>>(
    '/api/orders/preview',
    { items, expoDiscountEnabled },
  )
  return response.data.data
}
