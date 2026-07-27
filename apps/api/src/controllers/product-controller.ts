import type { Request, Response } from 'express'
import {
  productResponse,
  pricingResponse,
} from './response-mappers.js'
import { catalog, pricingFromInput } from '../services/pricing-service.js'

export class ProductController {
  list(request: Request, response: Response) {
    const search = String(request.query.search ?? '').trim().toLowerCase()
    const line = String(request.query.line ?? '')
    const type = String(request.query.type ?? '')
    const length = String(request.query.length ?? '')
    const products = catalog.filter((product) => {
      const searchable =
        `${product.sku} ${product.line} ${product.productType} ${product.lengthIn}`
          .toLowerCase()
      return (!search || searchable.includes(search)) &&
        (!line || product.line === line) &&
        (!type || product.productType === type) &&
        (!length || product.lengthIn === length)
    })

    response.json({
      data: products.map(productResponse),
      filters: {
        lines: [...new Set(catalog.map((product) => product.line))],
        types: [...new Set(catalog.map((product) => product.productType))],
        lengths: [
          ...new Set(catalog.map((product) => product.lengthIn).filter(Boolean)),
        ],
      },
    })
  }

  preview(request: Request, response: Response) {
    response.json({
      data: pricingResponse(pricingFromInput(request.body ?? {})),
    })
  }
}

export const productController = new ProductController()
