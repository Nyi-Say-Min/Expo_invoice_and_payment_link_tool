import express, { Router } from 'express'
import { webhookController } from '../controllers/webhook-controller.js'

export const webhookRouter = Router()

webhookRouter.post(
  '/stripe',
  express.raw({ type: 'application/json', limit: '1mb' }),
  webhookController.stripe,
)
