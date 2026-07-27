export type Product = {
  sku: string
  line: string
  productType: string
  lengthIn: string
  unit: string
  packWeightG: number | null
  priceUsdCents: number
  priceUsd: number
  priceCny: number
}

export type CartItem = {
  sku: string
  quantity: number
  blonde: boolean
}

export type Pricing = {
  subtotalUsd: number
  subtotalCny: number
  discountKind: 'none' | 'expo' | 'volume'
  discountUsd: number
  totalUsd: number
  totalCny: number
  totalWeightG: number
}

export type Filters = {
  lines: string[]
  types: string[]
  lengths: string[]
}

export type Draft = {
  items: CartItem[]
  customerName: string
  customerContact: string
  expoDiscountEnabled: boolean
}

export type Order = {
  id: string
  customerName: string
  customerContact: string
  status: 'pending' | 'paid'
  items: CartItem[]
  expoDiscountEnabled: boolean
  subtotalUsd: number
  subtotalCny: number
  discountKind: Pricing['discountKind']
  discountUsd: number
  totalUsd: number
  totalCny: number
  totalWeightG: number
  stripePaymentUrl: string | null
  createdAt: string
  updatedAt: string
}

export type PaymentLinkResult = {
  order: Order
  qrCodeDataUrl: string
}

export type ApiEnvelope<T> = {
  data: T
  filters?: Filters
}
