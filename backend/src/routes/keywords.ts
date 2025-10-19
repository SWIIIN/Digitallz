import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { keywordController } from '../controllers/keywordController'
import { authMiddleware } from '../middleware/auth'
import { validateRequest } from '../middleware/validateRequest'
import { rateLimitMiddleware } from '../middleware/rateLimit'

const router = Router()

// Search keywords
router.post(
  '/search',
  [
    body('keyword')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Le mot-clé doit contenir entre 1 et 100 caractères'),
    body('platform')
      .isIn(['amazon', 'etsy', 'ebay', 'shopify'])
      .withMessage('Plateforme non supportée'),
    body('includeRelated')
      .optional()
      .isBoolean()
      .withMessage('includeRelated doit être un booléen'),
    body('includeTrends')
      .optional()
      .isBoolean()
      .withMessage('includeTrends doit être un booléen'),
  ],
  validateRequest,
  authMiddleware,
  rateLimitMiddleware('search', 10, 60), // 10 requests per minute
  keywordController.searchKeywords
)

// Get keyword trends
router.get(
  '/trends/:keyword',
  [
    param('keyword')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Mot-clé invalide'),
    query('platform')
      .optional()
      .isIn(['amazon', 'etsy', 'ebay', 'shopify'])
      .withMessage('Plateforme non supportée'),
    query('dateRange')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Période non supportée'),
  ],
  validateRequest,
  authMiddleware,
  keywordController.getKeywordTrends
)

// Get popular keywords
router.get(
  '/popular',
  [
    query('platform')
      .optional()
      .isIn(['amazon', 'etsy', 'ebay', 'shopify'])
      .withMessage('Plateforme non supportée'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite doit être entre 1 et 100'),
  ],
  validateRequest,
  keywordController.getPopularKeywords
)

// Get keyword suggestions
router.get(
  '/suggestions',
  [
    query('keyword')
      .isString()
      .isLength({ min: 2, max: 100 })
      .withMessage('Le mot-clé doit contenir entre 2 et 100 caractères'),
    query('platform')
      .isIn(['amazon', 'etsy', 'ebay', 'shopify'])
      .withMessage('Plateforme non supportée'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limite doit être entre 1 et 50'),
  ],
  validateRequest,
  keywordController.getKeywordSuggestions
)

// Get recent searches
router.get(
  '/recent',
  authMiddleware,
  keywordController.getRecentSearches
)

// Get competitor analysis
router.get(
  '/competitors/:keyword',
  [
    param('keyword')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Mot-clé invalide'),
    query('platform')
      .isIn(['amazon', 'etsy', 'ebay', 'shopify'])
      .withMessage('Plateforme non supportée'),
  ],
  validateRequest,
  authMiddleware,
  keywordController.getCompetitorAnalysis
)

// Get keyword difficulty
router.get(
  '/difficulty/:keyword',
  [
    param('keyword')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Mot-clé invalide'),
    query('platform')
      .isIn(['amazon', 'etsy', 'ebay', 'shopify'])
      .withMessage('Plateforme non supportée'),
  ],
  validateRequest,
  authMiddleware,
  keywordController.getKeywordDifficulty
)

// Bulk keyword analysis
router.post(
  '/bulk-analyze',
  [
    body('keywords')
      .isArray({ min: 1, max: 50 })
      .withMessage('Entre 1 et 50 mots-clés requis'),
    body('keywords.*')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Chaque mot-clé doit contenir entre 1 et 100 caractères'),
    body('platform')
      .isIn(['amazon', 'etsy', 'ebay', 'shopify'])
      .withMessage('Plateforme non supportée'),
  ],
  validateRequest,
  authMiddleware,
  rateLimitMiddleware('bulk', 5, 60), // 5 requests per minute
  keywordController.bulkAnalyzeKeywords
)

export { router as keywordRoutes }
