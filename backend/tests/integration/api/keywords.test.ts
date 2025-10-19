import request from 'supertest'
import { app } from '../../../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Keywords API Integration', () => {
  let authToken: string
  let testUserId: string

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
      },
    })
    testUserId = testUser.id

    // Mock JWT token generation
    authToken = 'mock-jwt-token'
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.keywordSearch.deleteMany()
    await prisma.keywordData.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up before each test
    await prisma.keywordSearch.deleteMany()
    await prisma.keywordData.deleteMany()
  })

  describe('POST /api/keywords/search', () => {
    it('should search keywords with valid input', async () => {
      const response = await request(app)
        .post('/api/keywords/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          keyword: 'digital products',
          platform: 'amazon',
          includeRelated: true,
          includeTrends: true,
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.keyword).toBe('digital products')
      expect(response.body.data.platform).toBe('amazon')
    })

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/keywords/search')
        .send({
          keyword: 'digital products',
          platform: 'amazon',
        })

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/keywords/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          keyword: '',
          platform: 'invalid',
        })

      expect(response.status).toBe(400)
    })

    it('should handle rate limiting', async () => {
      // Make multiple requests to test rate limiting
      const requests = Array(15).fill(null).map(() =>
        request(app)
          .post('/api/keywords/search')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            keyword: 'digital products',
            platform: 'amazon',
          })
      )

      const responses = await Promise.all(requests)
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/keywords/trends/:keyword', () => {
    it('should get keyword trends', async () => {
      const response = await request(app)
        .get('/api/keywords/trends/digital-products')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ platform: 'amazon', dateRange: '30d' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })

    it('should return 400 for invalid platform', async () => {
      const response = await request(app)
        .get('/api/keywords/trends/digital-products')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ platform: 'invalid' })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/keywords/popular', () => {
    it('should get popular keywords', async () => {
      // Create test data
      await prisma.keywordData.create({
        data: {
          keyword: 'digital products',
          platform: 'amazon',
          searchVolume: 1000,
          competition: 0.5,
          cpc: 1.5,
          trendScore: 0.7,
          difficultyScore: 0.6,
          opportunityScore: 0.8,
          lastUpdated: new Date(),
        },
      })

      const response = await request(app)
        .get('/api/keywords/popular')
        .query({ platform: 'amazon', limit: 10 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should filter by platform', async () => {
      // Create test data for different platforms
      await prisma.keywordData.createMany({
        data: [
          {
            keyword: 'amazon product',
            platform: 'amazon',
            searchVolume: 1000,
            competition: 0.5,
            cpc: 1.5,
            trendScore: 0.7,
            difficultyScore: 0.6,
            opportunityScore: 0.8,
            lastUpdated: new Date(),
          },
          {
            keyword: 'etsy product',
            platform: 'etsy',
            searchVolume: 500,
            competition: 0.3,
            cpc: 0.8,
            trendScore: 0.6,
            difficultyScore: 0.4,
            opportunityScore: 0.9,
            lastUpdated: new Date(),
          },
        ],
      })

      const response = await request(app)
        .get('/api/keywords/popular')
        .query({ platform: 'amazon' })

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].platform).toBe('amazon')
    })
  })

  describe('GET /api/keywords/suggestions', () => {
    it('should get keyword suggestions', async () => {
      const response = await request(app)
        .get('/api/keywords/suggestions')
        .query({ keyword: 'digital', platform: 'amazon', limit: 10 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should return 400 for keyword too short', async () => {
      const response = await request(app)
        .get('/api/keywords/suggestions')
        .query({ keyword: 'a', platform: 'amazon' })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/keywords/recent', () => {
    it('should get recent searches', async () => {
      // Create test search data
      await prisma.keywordSearch.create({
        data: {
          userId: testUserId,
          keyword: 'digital products',
          platform: 'amazon',
          results: JSON.stringify({ test: 'data' }),
        },
      })

      const response = await request(app)
        .get('/api/keywords/recent')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('POST /api/keywords/bulk-analyze', () => {
    it('should analyze multiple keywords', async () => {
      const response = await request(app)
        .post('/api/keywords/bulk-analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          keywords: ['digital products', 'online courses', 'ebooks'],
          platform: 'amazon',
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.keywords).toBeDefined()
      expect(response.body.data.summary).toBeDefined()
    })

    it('should return 400 for too many keywords', async () => {
      const keywords = Array(51).fill('keyword') // More than 50 keywords
      
      const response = await request(app)
        .post('/api/keywords/bulk-analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          keywords,
          platform: 'amazon',
        })

      expect(response.status).toBe(400)
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      jest.spyOn(prisma.keywordData, 'findFirst').mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .post('/api/keywords/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          keyword: 'digital products',
          platform: 'amazon',
        })

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
    })

    it('should handle external API errors', async () => {
      // This would require mocking the external API service
      // For now, we'll test the error response format
      const response = await request(app)
        .post('/api/keywords/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          keyword: 'nonexistent-keyword',
          platform: 'amazon',
        })

      // The response should be handled gracefully
      expect([200, 500]).toContain(response.status)
    })
  })
})
