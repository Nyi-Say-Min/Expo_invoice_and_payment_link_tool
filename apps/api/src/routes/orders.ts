import { Router } from 'express'
import { orderController } from '../controllers/order-controller.js'

export const ordersRouter = Router()

ordersRouter.get('/export.csv', orderController.exportCsv)
ordersRouter.get('/', orderController.list)
ordersRouter.post('/preview', orderController.preview)
ordersRouter.post('/', orderController.create)
ordersRouter.post('/:id/payment-link', orderController.createPaymentLink)
ordersRouter.post('/:id/refresh-status', orderController.refreshStatus)
