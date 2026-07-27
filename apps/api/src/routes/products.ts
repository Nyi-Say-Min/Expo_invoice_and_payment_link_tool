import { Router } from 'express'
import { productController } from '../controllers/product-controller.js'

export const productsRouter = Router()

productsRouter.get('/', productController.list)
productsRouter.post('/price-preview', productController.preview)
