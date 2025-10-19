import { Router } from 'express'
import { 
  searchKeywords, 
  getTrendingKeywords, 
  getKeywordAnalytics, 
  bulkAnalyzeKeywords 
} from '../controllers/keywordController'

const router = Router()

// Search keywords
router.get('/search', searchKeywords)

// Get trending keywords
router.get('/trending', getTrendingKeywords)

// Get keyword analytics
router.get('/analytics/:keyword', getKeywordAnalytics)

// Bulk analyze keywords
router.post('/bulk-analyze', bulkAnalyzeKeywords)

export { router as keywordRoutes }