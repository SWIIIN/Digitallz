import axios, { AxiosInstance } from 'axios'
import { Keyword } from '../../models/Keyword'
import { logger } from '../../utils/logger'
import { cacheService } from '../../services/cacheService'

interface GumroadConfig {
  accessToken: string
  baseURL: string
}

interface GumroadProduct {
  id: string
  name: string
  description: string
  price: number
  currency: string
  url: string
  short_url: string
  thumbnail_url: string
  tags: string[]
  category: string
  published: boolean
  created_at: string
  updated_at: string
  sales_count: number
  view_count: number
  like_count: number
  custom_permalink: string
}

interface GumroadSearchResponse {
  success: boolean
  products: GumroadProduct[]
}

export class GumroadAPI {
  private client: AxiosInstance
  private config: GumroadConfig
  private rateLimiter: Map<string, number> = new Map()

  constructor() {
    this.config = {
      accessToken: process.env.GUMROAD_ACCESS_TOKEN || '',
      baseURL: 'https://api.gumroad.com/v2'
    }

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Digitallz-Keywords-Platform/1.0'
      }
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Gumroad API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const windowMs = 1000 // 1 seconde entre les requêtes
    const lastRequest = this.rateLimiter.get('gumroad') || 0

    if (now - lastRequest < windowMs) {
      const waitTime = windowMs - (now - lastRequest)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.rateLimiter.set('gumroad', Date.now())
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    await this.checkRateLimit()

    const response = await this.client.get(endpoint, { params })
    return response.data
  }

  async searchKeywords(query: string, maxResults: number = 50): Promise<Keyword[]> {
    try {
      const cacheKey = `gumroad:${query}:${maxResults}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        logger.info(`Cache hit for Gumroad query: ${query}`)
        return cached
      }

      logger.info(`Searching Gumroad for: ${query}`)
      
      const keywords: Keyword[] = []
      const limit = Math.min(50, maxResults) // Gumroad limite à 50 par requête
      let page = 1

      while (keywords.length < maxResults && page <= 10) {
        try {
          const response = await this.makeRequest<GumroadSearchResponse>('/products', {
            query: query,
            limit: limit,
            page: page
          })

          if (response.success && response.products && response.products.length > 0) {
            for (const product of response.products) {
              const keyword = this.transformProductToKeyword(product, query)
              if (keyword) {
                keywords.push(keyword)
              }
            }

            if (response.products.length < limit) {
              break
            }

            page++
          } else {
            break
          }

        } catch (error) {
          logger.error(`Error searching Gumroad page ${page}:`, error)
          break
        }
      }

      keywords.sort((a, b) => b.searchVolume - a.searchVolume)
      await cacheService.set(cacheKey, keywords, 3600)

      logger.info(`Found ${keywords.length} keywords for Gumroad query: ${query}`)
      return keywords.slice(0, maxResults)

    } catch (error) {
      logger.error('Gumroad search error:', error)
      throw new Error(`Failed to search Gumroad: ${error.message}`)
    }
  }

  private transformProductToKeyword(product: GumroadProduct, originalQuery: string): Keyword | null {
    try {
      if (!product.id || !product.name) {
        return null
      }

      const title = product.name.toLowerCase()
      const tags = product.tags.map(tag => tag.toLowerCase())
      const query = originalQuery.toLowerCase()
      
      const estimatedVolume = this.estimateSearchVolume(product)
      const competition = this.calculateCompetition(product)
      const cpc = this.estimateCPC(product.category)
      const price = product.price
      const potentialRevenue = this.calculatePotentialRevenue(estimatedVolume, price, competition)
      const keyword = this.extractKeywordFromProduct(product, query)

      return {
        id: `gumroad-${product.id}`,
        term: keyword,
        platform: 'gumroad',
        searchVolume: estimatedVolume,
        trend: this.determineTrend(estimatedVolume, product),
        competition: competition,
        potentialRevenue: potentialRevenue,
        cpc: cpc,
        difficulty: this.calculateDifficulty(competition, estimatedVolume),
        lastUpdated: new Date()
      }

    } catch (error) {
      logger.error('Error transforming Gumroad product:', error)
      return null
    }
  }

  private estimateSearchVolume(product: GumroadProduct): number {
    const salesCount = product.sales_count || 0
    const viewCount = product.view_count || 0
    const likeCount = product.like_count || 0
    
    let baseVolume = 100
    
    if (salesCount > 100) baseVolume += 2000
    else if (salesCount > 50) baseVolume += 1000
    else if (salesCount > 10) baseVolume += 500
    
    if (viewCount > 1000) baseVolume += 1000
    else if (viewCount > 500) baseVolume += 500
    
    if (likeCount > 50) baseVolume += 500
    else if (likeCount > 20) baseVolume += 200
    
    return Math.floor(Math.random() * baseVolume) + baseVolume
  }

  private calculateCompetition(product: GumroadProduct): 'low' | 'medium' | 'high' {
    const price = product.price
    const salesCount = product.sales_count || 0
    const tagCount = product.tags.length
    
    if (price > 50 && salesCount > 20 && tagCount > 5) return 'high'
    if (price > 20 && (salesCount > 5 || tagCount > 3)) return 'medium'
    return 'low'
  }

  private estimateCPC(category: string): number {
    const cpcRates: Record<string, number> = {
      'software': 2.0,
      'design': 1.5,
      'writing': 1.0,
      'music': 1.2,
      'video': 1.8,
      'photography': 1.3,
      'other': 1.0
    }
    
    return cpcRates[category.toLowerCase()] || 1.0
  }

  private calculatePotentialRevenue(volume: number, price: number, competition: string): number {
    const conversionRate = competition === 'low' ? 0.1 : competition === 'medium' ? 0.06 : 0.03
    return volume * conversionRate * price
  }

  private determineTrend(volume: number, product: GumroadProduct): 'up' | 'down' | 'stable' {
    const createdAt = new Date(product.created_at)
    const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    
    if (ageInDays < 30 && volume > 1000) return 'up'
    if (ageInDays < 90 && volume > 500) return 'stable'
    return 'down'
  }

  private calculateDifficulty(competition: string, volume: number): number {
    let difficulty = 30 // Base difficulty pour Gumroad (généralement plus facile)
    
    if (competition === 'high') difficulty += 30
    else if (competition === 'medium') difficulty += 15
    
    if (volume > 2000) difficulty += 20
    else if (volume > 500) difficulty += 10
    
    return Math.min(100, Math.max(0, difficulty))
  }

  private extractKeywordFromProduct(product: GumroadProduct, originalQuery: string): string {
    const tags = product.tags.map(tag => tag.toLowerCase())
    const title = product.name.toLowerCase()
    const query = originalQuery.toLowerCase()
    
    const matchingTags = tags.filter(tag => 
      query.split(' ').some(qWord => tag.includes(qWord))
    )
    
    if (matchingTags.length > 0) {
      return matchingTags[0]
    }
    
    const titleWords = title.split(/\s+/)
    return titleWords.slice(0, 3).join(' ')
  }

  async getRelatedKeywords(query: string): Promise<string[]> {
    try {
      const cacheKey = `gumroad:related:${query}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      const keywords = await this.searchKeywords(query, 20)
      const relatedKeywords = keywords
        .map(k => k.term)
        .filter(term => term !== query)
        .slice(0, 10)

      await cacheService.set(cacheKey, relatedKeywords, 3600)
      return relatedKeywords

    } catch (error) {
      logger.error('Error getting related keywords:', error)
      return []
    }
  }
}

export const gumroadAPI = new GumroadAPI()
