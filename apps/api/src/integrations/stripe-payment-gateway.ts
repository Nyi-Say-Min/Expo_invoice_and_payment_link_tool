import Stripe from 'stripe'
import { requireConfig } from '../config.js'
import type { Order } from '../db/schema.js'

export type PaidCheckout = {
  orderId: string
  checkoutSessionId: string
}

export class StripePaymentGateway {
  private client() {
    return new Stripe(requireConfig('stripeSecretKey'))
  }

  async createPaymentLink(order: Order) {
    const link = await this.client().paymentLinks.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: order.totalUsdCents,
          product_data: {
            name: `TRUNOV HAIR order ${order.id.slice(0, 8)}`,
            metadata: { orderId: order.id },
          },
        },
        quantity: 1,
      }],
      metadata: { orderId: order.id },
      payment_intent_data: { metadata: { orderId: order.id } },
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: {
          custom_message: 'Payment received. Please return to the TRUNOV HAIR booth.',
        },
      },
    }, {
      idempotencyKey: `trunov-order-${order.id}-payment-link-v1`,
    })
    return { id: link.id, url: link.url }
  }

  async findPaidCheckout(paymentLinkId: string): Promise<PaidCheckout | null> {
    const sessions = await this.client().checkout.sessions.list({
      payment_link: paymentLinkId,
      limit: 20,
    })
    const session = sessions.data.find((item) => item.payment_status === 'paid')
    const orderId = session?.metadata?.orderId
    return session && orderId
      ? { orderId, checkoutSessionId: session.id }
      : null
  }

  verifiedPaidCheckout(body: Buffer, signature: string): PaidCheckout | null {
    const event = this.client().webhooks.constructEvent(
      body,
      signature,
      requireConfig('stripeWebhookSecret'),
    )
    if (
      event.type !== 'checkout.session.completed' &&
      event.type !== 'checkout.session.async_payment_succeeded'
    ) return null

    const session = event.data.object
    const orderId = session.metadata?.orderId
    const paid =
      session.payment_status === 'paid' ||
      event.type === 'checkout.session.async_payment_succeeded'
    return orderId && paid
      ? { orderId, checkoutSessionId: session.id }
      : null
  }
}

export const stripePaymentGateway = new StripePaymentGateway()
