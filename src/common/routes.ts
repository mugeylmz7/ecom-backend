import { Router } from 'express'
import controller from '../resources/stripe/webhooks/controller'

const router: Router = Router()

// import routes

// Webhook rotası
router.post('/webhooks', controller.receiveUpdates)

// Front-end'den gelen Pay Total isteğini karşılayan rota
router.post('/checkout', controller.createCheckout)

// Higher level routes definition

export default router
