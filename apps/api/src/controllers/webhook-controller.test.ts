import type { Request, Response } from 'express'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  WebhookController,
} from './webhook-controller.js'
import type { StripePaymentGateway } from '../integrations/stripe-payment-gateway.js'
import type { OrderService } from '../services/order-service.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('WebhookController', () => {
  it('does not expose Stripe verification details to the caller', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const payments = {
      verifiedPaidCheckout: vi.fn(() => {
        throw new Error('sensitive Stripe verification detail')
      }),
    } as unknown as StripePaymentGateway
    const orders = {
      markPaid: vi.fn(),
    } as unknown as OrderService
    const controller = new WebhookController(payments, orders)
    const request = {
      body: Buffer.from('{}'),
      header: vi.fn().mockReturnValue('test-signature'),
    } as unknown as Request
    const response = {
      status: vi.fn(),
      json: vi.fn(),
    }
    response.status.mockReturnValue(response)

    await controller.stripe(request, response as unknown as Response)

    expect(response.status).toHaveBeenCalledWith(400)
    expect(response.json).toHaveBeenCalledWith({
      error: 'Invalid Stripe webhook',
    })
    expect(JSON.stringify(response.json.mock.calls)).not.toContain('sensitive')
  })
})
