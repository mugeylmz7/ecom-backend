import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import routes from './common/routes'
import unknownEndpoint from './middlewares/unknownEndpoint'
import stripeWebhooksController from './resources/stripe/webhooks/controller';

// to use env variables
import './common/env'

const app: Application = express()

// middleware
app.disable('x-powered-by')
app.use(cors({ origin: 'http://localhost:3000' }))
app.use(helmet())
app.use(compression())

// 1. Stripe Webhook Endpoint (Stripe imza doğrulaması için RAW body gereklidir, express.json'dan ÖNCE olmalıdır)
app.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhooksController.receiveUpdates)

// 2. Genel İstekler İçin JSON Parsing
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.REQUEST_LIMIT || '100kb',
  }),
)
app.use(express.json())

// Health check
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    'health-check': 'OK: top level api working',
  })
})

// API Rotaları (/v1/checkout vb.)
app.use('/v1/', routes)

// Handle unknown endpoints
app.use('*', unknownEndpoint)

export default app
