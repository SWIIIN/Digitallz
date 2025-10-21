import express from 'express'
import { keywordController } from '../controllers/keywordController'
import { validateKeywordSearch } from '../middleware/validation'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// Routes publiques
router.get('/search', validateKeywordSearch, keywordController.searchKeywords)
router.get('/trends', keywordController.getTrends)
router.get('/platforms', keywordController.getPlatforms)

// Routes protégées
router.use(authenticateToken)

router.get('/history', keywordController.getSearchHistory)
router.post('/favorites', keywordController.addToFavorites)
router.delete('/favorites/:id', keywordController.removeFromFavorites)
router.get('/favorites', keywordController.getFavorites)
router.post('/export', keywordController.exportKeywords)
router.get('/analytics', keywordController.getAnalytics)

// Routes pour les données brutes (data processor)
router.get('/raw', keywordController.getRawData)
router.get('/processed', keywordController.getProcessedData)
router.post('/processed', keywordController.saveProcessedData)

export { router as keywordRoutes }