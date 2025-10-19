import { keywordService } from '../../../src/services/keywordService'
import { externalApiService } from '../../../src/services/externalApiService'
import { keywordRepository } from '../../../src/repositories/keywordRepository'
import { cacheService } from '../../../src/services/cacheService'
import { analyticsService } from '../../../src/services/analyticsService'

// Mock dependencies
jest.mock('../../../src/services/externalApiService')
jest.mock('../../../src/repositories/keywordRepository')
jest.mock('../../../src/services/cacheService')
jest.mock('../../../src/services/analyticsService')

const mockExternalApiService = externalApiService as jest.Mocked<typeof externalApiService>
const mockKeywordRepository = keywordRepository as jest.Mocked<typeof keywordRepository>
const mockCacheService = cacheService as jest.Mocked<typeof cacheService>
const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>

describe('KeywordService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('searchKeywords', () => {
    it('should return cached data when available', async () => {
      const mockCachedData = {
        keyword: 'digital products',
        platform: 'amazon',
        data: global.testUtils.createMockKeywordData(),
        relatedKeywords: [],
        trends: [],
        analysis: {
          totalKeywords: 1,
          avgSearchVolume: 1000,
          avgCompetition: 0.5,
          topOpportunities: [],
          trendingKeywords: [],
        },
      }

      mockCacheService.get.mockResolvedValue(mockCachedData)

      const result = await keywordService.searchKeywords({
        keyword: 'digital products',
        platform: 'amazon',
        includeRelated: true,
        includeTrends: true,
        userId: 'test-user-id',
      })

      expect(result).toEqual(mockCachedData)
      expect(mockCacheService.get).toHaveBeenCalledWith('keyword:digital products:amazon')
      expect(mockExternalApiService.searchKeyword).not.toHaveBeenCalled()
    })

    it('should fetch from external API when not cached', async () => {
      const mockKeywordData = global.testUtils.createMockKeywordData()
      const mockSearchResult = global.testUtils.createMockSearchResult()

      mockCacheService.get.mockResolvedValue(null)
      mockKeywordRepository.findByKeyword.mockResolvedValue(null)
      mockExternalApiService.searchKeyword.mockResolvedValue(mockKeywordData)
      mockKeywordRepository.create.mockResolvedValue(mockKeywordData)
      mockCacheService.set.mockResolvedValue(undefined)
      mockKeywordRepository.logSearch.mockResolvedValue({
        id: 'search-id',
        userId: 'test-user-id',
        keyword: 'digital products',
        platform: 'amazon',
        results: JSON.stringify(mockSearchResult),
        createdAt: new Date(),
      })
      mockAnalyticsService.trackKeywordSearch.mockResolvedValue(undefined)

      const result = await keywordService.searchKeywords({
        keyword: 'digital products',
        platform: 'amazon',
        includeRelated: false,
        includeTrends: false,
        userId: 'test-user-id',
      })

      expect(result).toBeDefined()
      expect(result.keyword).toBe('digital products')
      expect(result.platform).toBe('amazon')
      expect(mockExternalApiService.searchKeyword).toHaveBeenCalledWith('digital products', 'amazon')
      expect(mockKeywordRepository.create).toHaveBeenCalledWith(mockKeywordData)
      expect(mockCacheService.set).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      mockCacheService.get.mockResolvedValue(null)
      mockKeywordRepository.findByKeyword.mockResolvedValue(null)
      mockExternalApiService.searchKeyword.mockRejectedValue(new Error('API Error'))

      await expect(
        keywordService.searchKeywords({
          keyword: 'digital products',
          platform: 'amazon',
          includeRelated: false,
          includeTrends: false,
          userId: 'test-user-id',
        })
      ).rejects.toThrow('API Error')
    })
  })

  describe('getKeywordTrends', () => {
    it('should return cached trends when available', async () => {
      const mockTrends = [
        { date: '2024-01-01', volume: 900, score: 0.6 },
        { date: '2024-01-02', volume: 1000, score: 0.7 },
      ]

      mockCacheService.get.mockResolvedValue(mockTrends)

      const result = await keywordService.getKeywordTrends('digital products', 'amazon', '30d')

      expect(result).toEqual(mockTrends)
      expect(mockCacheService.get).toHaveBeenCalledWith('trends:digital products:amazon:30d')
    })

    it('should fetch trends from external API when not cached', async () => {
      const mockTrends = [
        { date: '2024-01-01', volume: 900, score: 0.6 },
        { date: '2024-01-02', volume: 1000, score: 0.7 },
      ]

      mockCacheService.get.mockResolvedValue(null)
      mockExternalApiService.getKeywordTrends.mockResolvedValue(mockTrends)
      mockCacheService.set.mockResolvedValue(undefined)

      const result = await keywordService.getKeywordTrends('digital products', 'amazon', '30d')

      expect(result).toEqual(mockTrends)
      expect(mockExternalApiService.getKeywordTrends).toHaveBeenCalledWith('digital products', 'amazon', '30d')
      expect(mockCacheService.set).toHaveBeenCalledWith('trends:digital products:amazon:30d', mockTrends, 1800)
    })
  })

  describe('getPopularKeywords', () => {
    it('should return cached popular keywords when available', async () => {
      const mockKeywords = [global.testUtils.createMockKeywordData()]

      mockCacheService.get.mockResolvedValue(mockKeywords)

      const result = await keywordService.getPopularKeywords('amazon', 10)

      expect(result).toEqual(mockKeywords)
      expect(mockCacheService.get).toHaveBeenCalledWith('popular:amazon:10')
    })

    it('should fetch popular keywords from repository when not cached', async () => {
      const mockKeywords = [global.testUtils.createMockKeywordData()]

      mockCacheService.get.mockResolvedValue(null)
      mockKeywordRepository.getPopularKeywords.mockResolvedValue(mockKeywords)
      mockCacheService.set.mockResolvedValue(undefined)

      const result = await keywordService.getPopularKeywords('amazon', 10)

      expect(result).toEqual(mockKeywords)
      expect(mockKeywordRepository.getPopularKeywords).toHaveBeenCalledWith('amazon', 10)
      expect(mockCacheService.set).toHaveBeenCalledWith('popular:amazon:10', mockKeywords, 600)
    })
  })

  describe('bulkAnalyzeKeywords', () => {
    it('should analyze multiple keywords successfully', async () => {
      const keywords = ['digital products', 'online courses', 'ebooks']
      const mockKeywordData = global.testUtils.createMockKeywordData()

      mockExternalApiService.searchKeyword
        .mockResolvedValueOnce({ ...mockKeywordData, keyword: 'digital products' })
        .mockResolvedValueOnce({ ...mockKeywordData, keyword: 'online courses' })
        .mockResolvedValueOnce({ ...mockKeywordData, keyword: 'ebooks' })

      const result = await keywordService.bulkAnalyzeKeywords(keywords, 'amazon', 'test-user-id')

      expect(result.keywords).toHaveLength(3)
      expect(result.summary.totalKeywords).toBe(3)
      expect(result.summary.analyzedKeywords).toBe(3)
      expect(mockExternalApiService.searchKeyword).toHaveBeenCalledTimes(3)
    })

    it('should handle errors in bulk analysis', async () => {
      const keywords = ['digital products', 'invalid keyword']
      const mockKeywordData = global.testUtils.createMockKeywordData()

      mockExternalApiService.searchKeyword
        .mockResolvedValueOnce({ ...mockKeywordData, keyword: 'digital products' })
        .mockRejectedValueOnce(new Error('API Error'))

      const result = await keywordService.bulkAnalyzeKeywords(keywords, 'amazon', 'test-user-id')

      expect(result.keywords).toHaveLength(1)
      expect(result.summary.analyzedKeywords).toBe(1)
      expect(result.summary.recommendations).toContain('1 mots-clés n\'ont pas pu être analysés')
    })
  })
})
