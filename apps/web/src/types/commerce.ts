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

export type PricedItem = CartItem & {
  description: string
  unitUsdCents: number
  unitCny: number
  lineUsdCents: number
  lineCny: number
  weightG: number
}

export type PricingItem = PricedItem & {
  unitUsd: number
  lineUsd: number
}

export type Pricing = {
  items: PricingItem[]
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
  items: PricedItem[]
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

export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}
