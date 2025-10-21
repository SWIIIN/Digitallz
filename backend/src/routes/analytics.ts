import express from 'express'
import { analyticsController } from '../controllers/analyticsController'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// Toutes les routes nécessitent une authentification
router.use(authenticateToken)

router.get('/dashboard', analyticsController.getDashboard)
router.get('/trends', analyticsController.getTrends)
router.get('/platforms', analyticsController.getPlatformStats)
router.get('/keywords', analyticsController.getKeywordStats)
router.get('/performance', analyticsController.getPerformance)
router.post('/track', analyticsController.trackEvent)

export { router as analyticsRoutes }