import express from 'express'
import { healthController } from '../controllers/healthController'

const router = express.Router()

router.get('/', healthController.healthCheck)
router.get('/ready', healthController.readinessCheck)
router.get('/live', healthController.livenessCheck)

export { router as healthRoutes }