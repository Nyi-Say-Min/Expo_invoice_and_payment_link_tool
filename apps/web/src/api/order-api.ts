import { httpClient } from '../lib/http-client'
import type {
  ApiEnvelope,
  CartItem,
  Draft,
  Order,
  PaymentLinkResult,
  Pricing,
} from '../types/commerce'

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

export async function createOrder(draft: Draft) {
  const response = await httpClient.post<ApiEnvelope<Order>>(
    '/api/orders',
    draft,
  )
  return response.data.data
}

export async function createPaymentLink(orderId: string) {
  const response = await httpClient.post<ApiEnvelope<PaymentLinkResult>>(
    `/api/orders/${orderId}/payment-link`,
  )
  return response.data.data
}

export async function refreshOrderStatus(orderId: string) {
  const response = await httpClient.post<ApiEnvelope<Order>>(
    `/api/orders/${orderId}/refresh-status`,
  )
  return response.data.data
}
