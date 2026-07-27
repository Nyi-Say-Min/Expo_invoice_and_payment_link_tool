import { createQrCodeDataUrl } from '../integrations/qr-code.js'
import {
  stripePaymentGateway,
  type PaidCheckout,
  type StripePaymentGateway,
} from '../integrations/stripe-payment-gateway.js'
import {
  orderRepository,
  type OrderRepository,
} from '../repositories/order-repository.js'
import { pricingFromInput } from './pricing-service.js'

export type CreateOrderInput = Record<string, unknown>
export type OrderStore = Pick<
  OrderRepository,
  'list' | 'findById' | 'create' | 'savePaymentLink' | 'markPaid'
>
export type PaymentGateway = Pick<
  StripePaymentGateway,
  'createPaymentLink' | 'findPaidCheckout'
>

function requiredText(value: unknown, label: string, maxLength = 120) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} is required`)
  }
  if (value.trim().length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer`)
  }
  return value.trim()
}

function notFound() {
  return Object.assign(new Error('Order not found'), { status: 404 })
}

export class OrderService {
  constructor(
    private repository: OrderStore = orderRepository,
    private payments: PaymentGateway = stripePaymentGateway,
  ) {}

  preview(input: CreateOrderInput) {
    return pricingFromInput(input)
  }

  list(limit = 100) {
    return this.repository.list(limit)
  }

  listAll() {
    return this.repository.list()
  }

  async create(input: CreateOrderInput) {
    const customerName = requiredText(input.customerName, 'Customer name')
    const customerContact = requiredText(input.customerContact, 'Customer contact')
    const pricing = this.preview(input)
    if (!pricing.items.length) throw new Error('Add at least one product')
    if (pricing.totalUsdCents <= 0) throw new Error('Order total must be positive')

    return this.repository.create({
      customerName,
      customerContact,
      status: 'pending',
      items: pricing.items,
      expoDiscountEnabled: input.expoDiscountEnabled !== false,
      subtotalUsdCents: pricing.subtotalUsdCents,
      subtotalCny: pricing.subtotalCny,
      discountKind: pricing.discountKind,
      discountUsdCents: pricing.discountUsdCents,
      discountCny: pricing.discountCny,
      totalUsdCents: pricing.totalUsdCents,
      totalCny: pricing.totalCny,
      totalWeightG: pricing.totalWeightG,
    })
  }

  async createPaymentLink(orderId: string) {
    let order = await this.repository.findById(orderId)
    if (!order) throw notFound()
    if (!order.stripePaymentUrl) {
      const link = await this.payments.createPaymentLink(order)
      order = await this.repository.savePaymentLink(order.id, link)
    }
    return {
      order,
      qrCodeDataUrl: await createQrCodeDataUrl(order.stripePaymentUrl!),
    }
  }

  async refreshStatus(orderId: string) {
    const order = await this.repository.findById(orderId)
    if (!order) throw notFound()
    if (!order.stripePaymentLinkId || order.status === 'paid') return order
    const paid = await this.payments.findPaidCheckout(order.stripePaymentLinkId)
    return paid
      ? await this.repository.markPaid(order.id, paid.checkoutSessionId) ?? order
      : order
  }

  markPaid(checkout: PaidCheckout) {
    return this.repository.markPaid(
      checkout.orderId,
      checkout.checkoutSessionId,
    )
  }
}

export const orderService = new OrderService()
