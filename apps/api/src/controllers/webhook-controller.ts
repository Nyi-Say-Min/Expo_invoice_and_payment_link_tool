import type { Request, Response } from 'express'
import {
  stripePaymentGateway,
  type StripePaymentGateway,
} from '../integrations/stripe-payment-gateway.js'
import { orderService, type OrderService } from '../services/order-service.js'

export class WebhookController {
  constructor(
    private payments: StripePaymentGateway = stripePaymentGateway,
    private orders: OrderService = orderService,
  ) {}

  stripe = async (request: Request, response: Response) => {
    const signature = request.header('stripe-signature')
    if (!signature) {
      response.status(400).json({ error: 'Missing Stripe signature' })
      return
    }

    try {
      const checkout = this.payments.verifiedPaidCheckout(
        request.body,
        signature,
      )
      if (checkout) await this.orders.markPaid(checkout)
      response.json({ received: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Stripe webhook rejected: ${message}`)
      response.status(400).json({
        error: 'Invalid Stripe webhook',
      })
    }
  }
}

export const webhookController = new WebhookController()
