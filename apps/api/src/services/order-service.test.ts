import { describe, expect, it, vi } from 'vitest'
import type { Order } from '../db/schema.js'
import {
  OrderService,
  type OrderStore,
  type PaymentGateway,
} from './order-service.js'

const pendingOrder: Order = {
  id: '10000000-0000-0000-0000-000000000001',
  customerName: 'Mia',
  customerContact: 'wechat-mia',
  status: 'pending',
  items: [],
  expoDiscountEnabled: true,
  subtotalUsdCents: 278_000,
  subtotalCny: 19_460,
  discountKind: 'expo',
  discountUsdCents: 27_800,
  discountCny: 1_946,
  totalUsdCents: 250_200,
  totalCny: 17_514,
  totalWeightG: 3_140,
  stripePaymentLinkId: null,
  stripePaymentUrl: null,
  stripeCheckoutSessionId: null,
  createdAt: new Date('2026-07-26T00:00:00Z'),
  updatedAt: new Date('2026-07-26T00:00:00Z'),
}

function dependencies(order = pendingOrder) {
  const repository: OrderStore = {
    list: vi.fn(async () => [order]),
    findById: vi.fn(async () => order),
    create: vi.fn(async (input) => ({ ...order, ...input })),
    savePaymentLink: vi.fn(async (_id, link) => ({
      ...order,
      stripePaymentLinkId: link.id,
      stripePaymentUrl: link.url,
    })),
    markPaid: vi.fn(async (id, sessionId) => ({
      ...order,
      id,
      status: 'paid',
      stripeCheckoutSessionId: sessionId,
    })),
  }
  const payments: PaymentGateway = {
    createPaymentLink: vi.fn(async () => ({
      id: 'plink_123',
      url: 'https://buy.stripe.com/test',
    })),
    findPaidCheckout: vi.fn(async () => ({
      orderId: order.id,
      checkoutSessionId: 'cs_123',
    })),
  }
  return { repository, payments }
}

describe('OrderService', () => {
  it('recalculates prices server-side when creating an order', async () => {
    const { repository, payments } = dependencies()
    const service = new OrderService(repository, payments)
    const order = await service.create({
      customerName: ' Mia ',
      customerContact: ' wechat-mia ',
      totalUsdCents: 1,
      items: [
        { sku: 'SD-KT-22', quantity: 1 },
        { sku: 'SD-KT-22', quantity: 1, blonde: true },
        { sku: 'RAW-MM-24', quantity: 3 },
      ],
    })

    expect(order.totalUsdCents).toBe(250_200)
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: 'Mia',
        totalUsdCents: 250_200,
        totalCny: 17_514,
      }),
    )
  })

  it('creates one payment link and persists its identifiers', async () => {
    const { repository, payments } = dependencies()
    const result = await new OrderService(repository, payments)
      .createPaymentLink(pendingOrder.id)

    expect(payments.createPaymentLink).toHaveBeenCalledOnce()
    expect(repository.savePaymentLink).toHaveBeenCalledWith(
      pendingOrder.id,
      { id: 'plink_123', url: 'https://buy.stripe.com/test' },
    )
    expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/)
  })

  it('uses the payment-status fallback to mark an order paid', async () => {
    const linked = {
      ...pendingOrder,
      stripePaymentLinkId: 'plink_123',
      stripePaymentUrl: 'https://buy.stripe.com/test',
    }
    const { repository, payments } = dependencies(linked)
    const result = await new OrderService(repository, payments)
      .refreshStatus(linked.id)

    expect(result.status).toBe('paid')
    expect(repository.markPaid).toHaveBeenCalledWith(linked.id, 'cs_123')
  })
})
