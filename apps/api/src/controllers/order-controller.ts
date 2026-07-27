import type { Request, Response } from 'express'
import { exportOrdersCsv } from '../exports/orders-csv.js'
import { orderService, type OrderService } from '../services/order-service.js'
import { orderResponse, pricingResponse } from './response-mappers.js'

export class OrderController {
  constructor(private service: OrderService = orderService) {}

  list = async (_request: Request, response: Response) => {
    const orders = await this.service.list()
    response.json({ data: orders.map(orderResponse) })
  }

  preview = (request: Request, response: Response) => {
    response.json({
      data: pricingResponse(this.service.preview(request.body ?? {})),
    })
  }

  create = async (request: Request, response: Response) => {
    const order = await this.service.create(request.body ?? {})
    response.status(201).json({ data: orderResponse(order) })
  }

  createPaymentLink = async (request: Request, response: Response) => {
    const result = await this.service.createPaymentLink(String(request.params.id))
    response.json({
      data: {
        order: orderResponse(result.order),
        qrCodeDataUrl: result.qrCodeDataUrl,
      },
    })
  }

  refreshStatus = async (request: Request, response: Response) => {
    const order = await this.service.refreshStatus(String(request.params.id))
    response.json({ data: orderResponse(order) })
  }

  exportCsv = async (_request: Request, response: Response) => {
    const orders = await this.service.listAll()
    response
      .type('text/csv')
      .attachment(`trunov-orders-${new Date().toISOString().slice(0, 10)}.csv`)
      .send(exportOrdersCsv(orders))
  }
}

export const orderController = new OrderController()
