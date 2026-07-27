import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { systemController } from './controllers/system-controller.js'
import { requirePasscode } from './middleware/passcode.js'
import { ordersRouter } from './routes/orders.js'
import { productsRouter } from './routes/products.js'
import { webhookRouter } from './routes/webhook.js'

const app = express()

app.use(cors({
  origin(origin, callback) {
    if (!origin || config.corsOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Origin is not allowed'))
  },
}))

app.get('/health', systemController.health)
app.use('/api/webhooks', webhookRouter)
app.use(express.json({ limit: '256kb' }))
app.use('/api', requirePasscode)
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)

app.use(systemController.notFound)
app.use(systemController.error)

app.listen(config.port, () => {
  console.log(`TRUNOV API listening on port ${config.port} (${config.appMode} mode)`)
})
