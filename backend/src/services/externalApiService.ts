import axios, { AxiosInstance } from 'axios'
import { config } from '../config'
import { logger } from '../utils/logger'
import { KeywordData, TrendData, KeywordSuggestion, CompetitorData } from '../models/Keyword'

export class ExternalApiService {
  private amazonApi: AxiosInstance
  private etsyApi: AxiosInstance
  private ebayApi: AxiosInstance
  private shopifyApi: AxiosInstance

  constructor() {
    this.amazonApi = this.createApiInstance('amazon')
    this.etsyApi = this.createApiInstance('etsy')
    this.ebayApi = this.createApiInstance('ebay')
    this.shopifyApi = this.createApiInstance('shopify')
  }

  private createApiInstance(platform: string): AxiosInstance {
    const apiConfig = config.externalApis[platform as keyof typeof config.externalApis]
    
    return axios.create({
      baseURL: apiConfig.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${apiConfig.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Digitallz-Keywords-Platform/1.0',
      },
    })
  }

  async searchKeyword(keyword: string, platform: string): Promise<KeywordData> {
    try {
      logger.info(`Searching keyword: ${keyword} on ${platform}`)

      switch (platform) {
        case 'amazon':
          return await this.searchAmazonKeyword(keyword)
        case 'etsy':
          return await this.searchEtsyKeyword(keyword)
        case 'ebay':
          return await this.searchEbayKeyword(keyword)
        case 'shopify':
          return await this.searchShopifyKeyword(keyword)
        default:
          throw new Error(`Platform ${platform} not supported`)
      }
    } catch (error) {
      logger.error(`Error searching keyword ${keyword} on ${platform}:`, error)
      throw error
    }
  }

  private async searchAmazonKeyword(keyword: string): Promise<KeywordData> {
    try {
      const response = await this.amazonApi.post('/keywords/search', {
        keyword,
        includeMetrics: true,
        includeTrends: true,
        includeRelated: true,
      })

      const data = response.data

      return {
        keyword: data.keyword,
        platform: 'amazon',
        searchVolume: data.searchVolume || 0,
        competition: data.competition || 0,
        cpc: data.cpc || 0,
        trendScore: data.trendScore || 0,
        difficultyScore: this.calculateDifficultyScore(data),
        opportunityScore: this.calculateOpportunityScore(data),
        relatedKeywords: data.relatedKeywords || [],
        trendData: data.trends || [],
        lastUpdated: new Date(),
      }
    } catch (error) {
      logger.error('Amazon API error:', error)
      throw new Error('Erreur lors de la recherche Amazon')
    }
  }

  private async searchEtsyKeyword(keyword: string): Promise<KeywordData> {
    try {
      const response = await this.etsyApi.get('/keywords/search', {
        params: {
          keyword,
          include_metrics: true,
          include_trends: true,
        },
      })

      const data = response.data

      return {
        keyword: data.keyword,
        platform: 'etsy',
        searchVolume: data.searchVolume || 0,
        competition: data.competition || 0,
        cpc: data.cpc || 0,
        trendScore: data.trendScore || 0,
        difficultyScore: this.calculateDifficultyScore(data),
        opportunityScore: this.calculateOpportunityScore(data),
        relatedKeywords: data.relatedKeywords || [],
        trendData: data.trends || [],
        categoryData: data.categoryData,
        lastUpdated: new Date(),
      }
    } catch (error) {
      logger.error('Etsy API error:', error)
      throw new Error('Erreur lors de la recherche Etsy')
    }
  }

  private async searchEbayKeyword(keyword: string): Promise<KeywordData> {
    try {
      const response = await this.ebayApi.get('/keywords/search', {
        params: {
          keyword,
          include_metrics: true,
        },
      })

      const data = response.data

      return {
        keyword: data.keyword,
        platform: 'ebay',
        searchVolume: data.searchVolume || 0,
        competition: data.competition || 0,
        cpc: data.cpc || 0,
        trendScore: data.trendScore || 0,
        difficultyScore: this.calculateDifficultyScore(data),
        opportunityScore: this.calculateOpportunityScore(data),
        relatedKeywords: data.relatedKeywords || [],
        trendData: data.trends || [],
        lastUpdated: new Date(),
      }
    } catch (error) {
      logger.error('eBay API error:', error)
      throw new Error('Erreur lors de la recherche eBay')
    }
  }

  private async searchShopifyKeyword(keyword: string): Promise<KeywordData> {
    try {
      const response = await this.shopifyApi.get('/keywords/search', {
        params: {
          keyword,
          include_metrics: true,
        },
      })

      const data = response.data

      return {
        keyword: data.keyword,
        platform: 'shopify',
        searchVolume: data.searchVolume || 0,
        competition: data.competition || 0,
        cpc: data.cpc || 0,
        trendScore: data.trendScore || 0,
        difficultyScore: this.calculateDifficultyScore(data),
        opportunityScore: this.calculateOpportunityScore(data),
        relatedKeywords: data.relatedKeywords || [],
        trendData: data.trends || [],
        lastUpdated: new Date(),
      }
    } catch (error) {
      logger.error('Shopify API error:', error)
      throw new Error('Erreur lors de la recherche Shopify')
    }
  }

  async getKeywordTrends(keyword: string, platform: string, dateRange: string = '30d'): Promise<TrendData[]> {
    try {
      logger.info(`Getting trends for: ${keyword} on ${platform}`)

      switch (platform) {
        case 'amazon':
          return await this.getAmazonTrends(keyword, dateRange)
        case 'etsy':
          return await this.getEtsyTrends(keyword, dateRange)
        case 'ebay':
          return await this.getEbayTrends(keyword, dateRange)
        case 'shopify':
          return await this.getShopifyTrends(keyword, dateRange)
        default:
          throw new Error(`Platform ${platform} not supported`)
      }
    } catch (error) {
      logger.error(`Error getting trends for ${keyword} on ${platform}:`, error)
      throw error
    }
  }

  private async getAmazonTrends(keyword: string, dateRange: string): Promise<TrendData[]> {
    const response = await this.amazonApi.get('/keywords/trends', {
      params: { keyword, dateRange },
    })
    return response.data.trends || []
  }

  private async getEtsyTrends(keyword: string, dateRange: string): Promise<TrendData[]> {
    const response = await this.etsyApi.get('/keywords/trends', {
      params: { keyword, dateRange },
    })
    return response.data.trends || []
  }

  private async getEbayTrends(keyword: string, dateRange: string): Promise<TrendData[]> {
    const response = await this.ebayApi.get('/keywords/trends', {
      params: { keyword, dateRange },
    })
    return response.data.trends || []
  }

  private async getShopifyTrends(keyword: string, dateRange: string): Promise<TrendData[]> {
    const response = await this.shopifyApi.get('/keywords/trends', {
      params: { keyword, dateRange },
    })
    return response.data.trends || []
  }

  async getRelatedKeywords(keyword: string, platform: string, limit: number = 10): Promise<string[]> {
    try {
      logger.info(`Getting related keywords for: ${keyword} on ${platform}`)

      switch (platform) {
        case 'amazon':
          return await this.getAmazonRelated(keyword, limit)
        case 'etsy':
          return await this.getEtsyRelated(keyword, limit)
        case 'ebay':
          return await this.getEbayRelated(keyword, limit)
        case 'shopify':
          return await this.getShopifyRelated(keyword, limit)
        default:
          throw new Error(`Platform ${platform} not supported`)
      }
    } catch (error) {
      logger.error(`Error getting related keywords for ${keyword} on ${platform}:`, error)
      throw error
    }
  }

  private async getAmazonRelated(keyword: string, limit: number): Promise<string[]> {
    const response = await this.amazonApi.get('/keywords/related', {
      params: { keyword, limit },
    })
    return response.data.relatedKeywords || []
  }

  private async getEtsyRelated(keyword: string, limit: number): Promise<string[]> {
    const response = await this.etsyApi.get('/keywords/related', {
      params: { keyword, limit },
    })
    return response.data.relatedKeywords || []
  }

  private async getEbayRelated(keyword: string, limit: number): Promise<string[]> {
    const response = await this.ebayApi.get('/keywords/related', {
      params: { keyword, limit },
    })
    return response.data.relatedKeywords || []
  }

  private async getShopifyRelated(keyword: string, limit: number): Promise<string[]> {
    const response = await this.shopifyApi.get('/keywords/related', {
      params: { keyword, limit },
    })
    return response.data.relatedKeywords || []
  }

  async getKeywordSuggestions(keyword: string, platform: string, limit: number = 10): Promise<KeywordSuggestion[]> {
    try {
      logger.info(`Getting suggestions for: ${keyword} on ${platform}`)

      switch (platform) {
        case 'amazon':
          return await this.getAmazonSuggestions(keyword, limit)
        case 'etsy':
          return await this.getEtsySuggestions(keyword, limit)
        case 'ebay':
          return await this.getEbaySuggestions(keyword, limit)
        case 'shopify':
          return await this.getShopifySuggestions(keyword, limit)
        default:
          throw new Error(`Platform ${platform} not supported`)
      }
    } catch (error) {
      logger.error(`Error getting suggestions for ${keyword} on ${platform}:`, error)
      throw error
    }
  }

  private async getAmazonSuggestions(keyword: string, limit: number): Promise<KeywordSuggestion[]> {
    const response = await this.amazonApi.get('/keywords/suggestions', {
      params: { keyword, limit },
    })
    return response.data.suggestions || []
  }

  private async getEtsySuggestions(keyword: string, limit: number): Promise<KeywordSuggestion[]> {
    const response = await this.etsyApi.get('/keywords/suggestions', {
      params: { keyword, limit },
    })
    return response.data.suggestions || []
  }

  private async getEbaySuggestions(keyword: string, limit: number): Promise<KeywordSuggestion[]> {
    const response = await this.ebayApi.get('/keywords/suggestions', {
      params: { keyword, limit },
    })
    return response.data.suggestions || []
  }

  private async getShopifySuggestions(keyword: string, limit: number): Promise<KeywordSuggestion[]> {
    const response = await this.shopifyApi.get('/keywords/suggestions', {
      params: { keyword, limit },
    })
    return response.data.suggestions || []
  }

  async getCompetitorAnalysis(keyword: string, platform: string): Promise<CompetitorData[]> {
    try {
      logger.info(`Getting competitor analysis for: ${keyword} on ${platform}`)

      switch (platform) {
        case 'amazon':
          return await this.getAmazonCompetitors(keyword)
        case 'etsy':
          return await this.getEtsyCompetitors(keyword)
        case 'ebay':
          return await this.getEbayCompetitors(keyword)
        case 'shopify':
          return await this.getShopifyCompetitors(keyword)
        default:
          throw new Error(`Platform ${platform} not supported`)
      }
    } catch (error) {
      logger.error(`Error getting competitor analysis for ${keyword} on ${platform}:`, error)
      throw error
    }
  }

  private async getAmazonCompetitors(keyword: string): Promise<CompetitorData[]> {
    const response = await this.amazonApi.get('/keywords/competitors', {
      params: { keyword },
    })
    return response.data.competitors || []
  }

  private async getEtsyCompetitors(keyword: string): Promise<CompetitorData[]> {
    const response = await this.etsyApi.get('/keywords/competitors', {
      params: { keyword },
    })
    return response.data.competitors || []
  }

  private async getEbayCompetitors(keyword: string): Promise<CompetitorData[]> {
    const response = await this.ebayApi.get('/keywords/competitors', {
      params: { keyword },
    })
    return response.data.competitors || []
  }

  private async getShopifyCompetitors(keyword: string): Promise<CompetitorData[]> {
    const response = await this.shopifyApi.get('/keywords/competitors', {
      params: { keyword },
    })
    return response.data.competitors || []
  }

  private calculateDifficultyScore(data: any): number {
    const competition = data.competition || 0
    const cpc = data.cpc || 0
    const searchVolume = data.searchVolume || 0

    // Score basé sur la concurrence (0-1)
    const competitionScore = Math.min(competition, 1.0)

    // Score basé sur le CPC (0-1)
    const cpcScore = Math.min(cpc / 10.0, 1.0)

    // Score basé sur le volume de recherche (inversé)
    const volumeScore = 1.0 - Math.min(searchVolume / 10000, 1.0)

    // Moyenne pondérée
    return Math.round((competitionScore * 0.4 + cpcScore * 0.3 + volumeScore * 0.3) * 100) / 100
  }

  private calculateOpportunityScore(data: any): number {
    const searchVolume = data.searchVolume || 0
    const trendScore = data.trendScore || 0
    const competition = data.competition || 0

    // Score basé sur le volume (0-1)
    const volumeScore = Math.min(searchVolume / 5000, 1.0)

    // Score basé sur les tendances (0-1)
    const trendScoreNorm = Math.max(0, Math.min(trendScore, 1.0))

    // Score basé sur la concurrence (inversé)
    const competitionScore = 1.0 - Math.min(competition, 1.0)

    // Moyenne pondérée
    return Math.round((volumeScore * 0.4 + trendScoreNorm * 0.3 + competitionScore * 0.3) * 100) / 100
  }
}

export const externalApiService = new ExternalApiService()
