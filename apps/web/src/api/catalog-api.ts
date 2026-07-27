import { httpClient } from '../lib/http-client'
import type { ApiEnvelope, Product } from '../types/commerce'

export async function getCatalog() {
  const response = await httpClient.get<ApiEnvelope<Product[]>>('/api/products')
  return {
    products: response.data.data,
    filters: response.data.filters!,
  }
}
