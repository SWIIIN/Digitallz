import express from 'express'
import { subscriptionController } from '../controllers/subscriptionController'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// Toutes les routes nécessitent une authentification
router.use(authenticateToken)

router.get('/plans', subscriptionController.getPlans)
router.get('/current', subscriptionController.getCurrentSubscription)
router.post('/create', subscriptionController.createSubscription)
router.post('/upgrade', subscriptionController.upgradeSubscription)
router.post('/downgrade', subscriptionController.downgradeSubscription)
router.post('/cancel', subscriptionController.cancelSubscription)
router.post('/reactivate', subscriptionController.reactivateSubscription)
router.get('/billing', subscriptionController.getBillingHistory)
router.post('/webhook', subscriptionController.handleWebhook)

export { router as subscriptionRoutes }