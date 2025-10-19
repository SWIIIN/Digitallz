import request from 'supertest'
import express from 'express'
import { keywordController } from '../../../src/controllers/keywordController'
import { keywordService } from '../../../src/services/keywordService'

// Mock the keyword service
jest.mock('../../../src/services/keywordService')
const mockKeywordService = keywordService as jest.Mocked<typeof keywordService>

// Create test app
const app = express()
app.use(express.json())

// Mock middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.user = { id: 'test-user-id' }
  next()
}

// Mock rate limiting
const mockRateLimit = (req: any, res: any, next: any) => next()

// Apply routes
app.post('/search', mockAuthMiddleware, mockRateLimit, keywordController.searchKeywords)
app.get('/trends/:keyword', mockAuthMiddleware, keywordController.getKeywordTrends)
app.get('/popular', keywordController.getPopularKeywords)
app.get('/suggestions', keywordController.getKeywordSuggestions)
app.get('/recent', mockAuthMiddleware, keywordController.getRecentSearches)
app.get('/competitors/:keyword', mockAuthMiddleware, keywordController.getCompetitorAnalysis)
app.get('/difficulty/:keyword', mockAuthMiddleware, keywordController.getKeywordDifficulty)
app.post('/bulk-analyze', mockAuthMiddleware, mockRateLimit, keywordController.bulkAnalyzeKeywords)

describe('KeywordController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /search', () => {
    it('should search keywords successfully', async () => {
      const mockResult = global.testUtils.createMockSearchResult()
      mockKeywordService.searchKeywords.mockResolvedValue(mockResult)

      const response = await request(app)
        .post('/search')
        .send({
          keyword: 'digital products',
          platform: 'amazon',
          includeRelated: true,
          includeTrends: true,
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockResult)
      expect(mockKeywordService.searchKeywords).toHaveBeenCalledWith({
        keyword: 'digital products',
        platform: 'amazon',
        includeRelated: true,
        includeTrends: true,
        userId: 'test-user-id',
      })
    })

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/search')
        .send({
          keyword: '',
          platform: 'invalid',
        })

      expect(response.status).toBe(400)
    })

    it('should handle service errors', async () => {
      mockKeywordService.searchKeywords.mockRejectedValue(new Error('Service error'))

      const response = await request(app)
        .post('/search')
        .send({
          keyword: 'digital products',
          platform: 'amazon',
        })

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Erreur lors de la recherche de mots-clés')
    })
  })

  describe('GET /trends/:keyword', () => {
    it('should get keyword trends successfully', async () => {
      const mockTrends = [
        { date: '2024-01-01', volume: 900, score: 0.6 },
        { date: '2024-01-02', volume: 1000, score: 0.7 },
      ]
      mockKeywordService.getKeywordTrends.mockResolvedValue(mockTrends)

      const response = await request(app)
        .get('/trends/digital-products')
        .query({ platform: 'amazon', dateRange: '30d' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTrends)
      expect(mockKeywordService.getKeywordTrends).toHaveBeenCalledWith({
        keyword: 'digital-products',
        platform: 'amazon',
        dateRange: '30d',
      })
    })

    it('should return 400 for invalid platform', async () => {
      const response = await request(app)
        .get('/trends/digital-products')
        .query({ platform: 'invalid' })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /popular', () => {
    it('should get popular keywords successfully', async () => {
      const mockKeywords = [global.testUtils.createMockKeywordData()]
      mockKeywordService.getPopularKeywords.mockResolvedValue(mockKeywords)

      const response = await request(app)
        .get('/popular')
        .query({ platform: 'amazon', limit: 10 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockKeywords)
      expect(mockKeywordService.getPopularKeywords).toHaveBeenCalledWith('amazon', 10)
    })

    it('should use default values when no query params', async () => {
      const mockKeywords = [global.testUtils.createMockKeywordData()]
      mockKeywordService.getPopularKeywords.mockResolvedValue(mockKeywords)

      const response = await request(app)
        .get('/popular')

      expect(response.status).toBe(200)
      expect(mockKeywordService.getPopularKeywords).toHaveBeenCalledWith(undefined, 20)
    })
  })

  describe('GET /suggestions', () => {
    it('should get keyword suggestions successfully', async () => {
      const mockSuggestions = [
        { keyword: 'digital marketing', searchVolume: 500, competition: 0.3, relevance: 0.9, type: 'related' },
        { keyword: 'online products', searchVolume: 300, competition: 0.4, relevance: 0.8, type: 'related' },
      ]
      mockKeywordService.getKeywordSuggestions.mockResolvedValue(mockSuggestions)

      const response = await request(app)
        .get('/suggestions')
        .query({ keyword: 'digital', platform: 'amazon', limit: 10 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockSuggestions)
      expect(mockKeywordService.getKeywordSuggestions).toHaveBeenCalledWith('digital', 'amazon', 10)
    })

    it('should return 400 for keyword too short', async () => {
      const response = await request(app)
        .get('/suggestions')
        .query({ keyword: 'a', platform: 'amazon' })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /recent', () => {
    it('should get recent searches successfully', async () => {
      const mockSearches = [
        {
          id: 'search-1',
          userId: 'test-user-id',
          keyword: 'digital products',
          platform: 'amazon',
          results: {},
          createdAt: new Date(),
        },
      ]
      mockKeywordService.getRecentSearches.mockResolvedValue(mockSearches)

      const response = await request(app)
        .get('/recent')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockSearches)
      expect(mockKeywordService.getRecentSearches).toHaveBeenCalledWith('test-user-id')
    })
  })

  describe('GET /competitors/:keyword', () => {
    it('should get competitor analysis successfully', async () => {
      const mockAnalysis = {
        keyword: 'digital products',
        platform: 'amazon',
        competitors: [
          {
            name: 'Competitor 1',
            url: 'https://example.com',
            title: 'Digital Products Guide',
            description: 'Best digital products',
            price: 29.99,
            rating: 4.5,
            reviews: 100,
            rank: 1,
            features: ['Feature 1', 'Feature 2'],
          },
        ],
        marketShare: [
          { competitor: 'Competitor 1', share: 0.4, trend: 'up' },
        ],
        pricing: {
          min: 19.99,
          max: 99.99,
          average: 49.99,
          median: 39.99,
          distribution: [],
        },
        recommendations: ['Recommendation 1', 'Recommendation 2'],
      }
      mockKeywordService.getCompetitorAnalysis.mockResolvedValue(mockAnalysis)

      const response = await request(app)
        .get('/competitors/digital-products')
        .query({ platform: 'amazon' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockAnalysis)
      expect(mockKeywordService.getCompetitorAnalysis).toHaveBeenCalledWith('digital-products', 'amazon')
    })
  })

  describe('GET /difficulty/:keyword', () => {
    it('should get keyword difficulty successfully', async () => {
      const mockDifficulty = {
        keyword: 'digital products',
        platform: 'amazon',
        difficulty: 0.7,
        factors: {
          searchVolume: 1000,
          competition: 0.8,
          cpc: 2.5,
          trendScore: 0.6,
        },
        recommendations: ['Recommendation 1'],
        score: {
          overall: 0.7,
          searchVolume: 0.1,
          competition: 0.8,
          cpc: 0.25,
          trend: 0.6,
        },
      }
      mockKeywordService.getKeywordDifficulty.mockResolvedValue(mockDifficulty)

      const response = await request(app)
        .get('/difficulty/digital-products')
        .query({ platform: 'amazon' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockDifficulty)
      expect(mockKeywordService.getKeywordDifficulty).toHaveBeenCalledWith('digital-products', 'amazon')
    })
  })

  describe('POST /bulk-analyze', () => {
    it('should analyze multiple keywords successfully', async () => {
      const mockResult = {
        keywords: [global.testUtils.createMockKeywordData()],
        summary: {
          totalKeywords: 1,
          analyzedKeywords: 1,
          avgSearchVolume: 1000,
          avgCompetition: 0.5,
          topOpportunities: [],
          recommendations: [],
        },
      }
      mockKeywordService.bulkAnalyzeKeywords.mockResolvedValue(mockResult)

      const response = await request(app)
        .post('/bulk-analyze')
        .send({
          keywords: ['digital products', 'online courses'],
          platform: 'amazon',
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockResult)
      expect(mockKeywordService.bulkAnalyzeKeywords).toHaveBeenCalledWith(
        ['digital products', 'online courses'],
        'amazon',
        'test-user-id'
      )
    })

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/bulk-analyze')
        .send({
          keywords: [],
          platform: 'amazon',
        })

      expect(response.status).toBe(400)
    })
  })
})
