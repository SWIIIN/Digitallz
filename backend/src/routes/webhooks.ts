import express from 'express'
import { webhookController } from '../controllers/webhookController'

const router = express.Router()

// Routes publiques pour les webhooks
router.post('/stripe', webhookController.handleStripeWebhook)
router.post('/amazon', webhookController.handleAmazonWebhook)
router.post('/etsy', webhookController.handleEtsyWebhook)
router.post('/ebay', webhookController.handleEbayWebhook)

export { router as webhookRoutes }