import axios, { AxiosInstance } from 'axios'
import { Keyword } from '../../models/Keyword'
import { logger } from '../../utils/logger'
import { cacheService } from '../../services/cacheService'

interface EtsyConfig {
  apiKey: string
  sharedSecret: string
  baseURL: string
}

interface EtsyListing {
  listing_id: number
  title: string
  description: string
  price: string
  currency_code: string
  tags: string[]
  category_path: string[]
  views: number
  num_favorers: number
  url: string
  creation_tsz: number
  ending_tsz: number
  state: string
  shop_id: number
  user_id: number
}

interface EtsySearchResponse {
  count: number
  results: EtsyListing[]
  params: {
    keywords: string
    limit: number
    offset: number
  }
}

interface EtsyCategory {
  category_id: number
  name: string
  meta_title: string
  meta_keywords: string
  page_title: string
  short_name: string
  category_path: string[]
  children: EtsyCategory[]
}

export class EtsyAPI {
  private client: AxiosInstance
  private config: EtsyConfig
  private rateLimiter: Map<string, number> = new Map()

  constructor() {
    this.config = {
      apiKey: process.env.ETSY_API_KEY || '',
      sharedSecret: process.env.ETSY_SHARED_SECRET || '',
      baseURL: 'https://openapi.etsy.com/v3'
    }

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: 10000,
      headers: {
        'x-api-key': this.config.apiKey,
        'User-Agent': 'Digitallz-Keywords-Platform/1.0'
      }
    })

    // Intercepteur pour la gestion des erreurs
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Etsy API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const windowMs = 100 // 100ms entre les requêtes
    const lastRequest = this.rateLimiter.get('etsy') || 0

    if (now - lastRequest < windowMs) {
      const waitTime = windowMs - (now - lastRequest)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.rateLimiter.set('etsy', Date.now())
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    await this.checkRateLimit()

    const response = await this.client.get(endpoint, { params })
    return response.data
  }

  async searchKeywords(query: string, maxResults: number = 50): Promise<Keyword[]> {
    try {
      // Vérifier le cache d'abord
      const cacheKey = `etsy:${query}:${maxResults}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        logger.info(`Cache hit for Etsy query: ${query}`)
        return cached
      }

      logger.info(`Searching Etsy for: ${query}`)
      
      const keywords: Keyword[] = []
      const limit = Math.min(100, maxResults) // Etsy limite à 100 par requête
      let offset = 0

      while (keywords.length < maxResults && offset < 1000) { // Limite Etsy
        try {
          const response = await this.makeRequest<EtsySearchResponse>('/application/shops/active/listings', {
            keywords: query,
            limit: limit,
            offset: offset,
            sort_on: 'score',
            sort_order: 'desc',
            includes: 'Images,Shop'
          })

          if (response.results && response.results.length > 0) {
            for (const listing of response.results) {
              const keyword = this.transformListingToKeyword(listing, query)
              if (keyword) {
                keywords.push(keyword)
              }
            }

            // Si on a moins de résultats que demandé, on a atteint la fin
            if (response.results.length < limit) {
              break
            }

            offset += limit
          } else {
            break
          }

        } catch (error) {
          logger.error(`Error searching Etsy offset ${offset}:`, error)
          break
        }
      }

      // Trier par volume de recherche estimé
      keywords.sort((a, b) => b.searchVolume - a.searchVolume)

      // Mettre en cache les résultats
      await cacheService.set(cacheKey, keywords, 3600) // 1 heure

      logger.info(`Found ${keywords.length} keywords for Etsy query: ${query}`)
      return keywords.slice(0, maxResults)

    } catch (error) {
      logger.error('Etsy search error:', error)
      throw new Error(`Failed to search Etsy: ${error.message}`)
    }
  }

  private transformListingToKeyword(listing: EtsyListing, originalQuery: string): Keyword | null {
    try {
      if (!listing.listing_id || !listing.title) {
        return null
      }

      // Extraire des mots-clés du titre et des tags
      const title = listing.title.toLowerCase()
      const tags = listing.tags.map(tag => tag.toLowerCase())
      const query = originalQuery.toLowerCase()
      
      // Calculer le volume de recherche estimé basé sur les vues
      const estimatedVolume = this.estimateSearchVolume(listing.views, listing.num_favorers)

      // Calculer le niveau de concurrence basé sur les favoris et le prix
      const competition = this.calculateCompetition(listing)

      // Calculer le CPC estimé pour Etsy
      const cpc = this.estimateCPC(listing.category_path)

      // Calculer le potentiel de revenus
      const price = parseFloat(listing.price) || 0
      const potentialRevenue = this.calculatePotentialRevenue(estimatedVolume, price, competition)

      // Extraire le mot-clé le plus pertinent
      const keyword = this.extractKeywordFromListing(listing, query)

      return {
        id: `etsy-${listing.listing_id}`,
        term: keyword,
        platform: 'etsy',
        searchVolume: estimatedVolume,
        trend: this.determineTrend(estimatedVolume, listing.creation_tsz),
        competition: competition,
        potentialRevenue: potentialRevenue,
        cpc: cpc,
        difficulty: this.calculateDifficulty(competition, estimatedVolume),
        lastUpdated: new Date()
      }

    } catch (error) {
      logger.error('Error transforming Etsy listing:', error)
      return null
    }
  }

  private estimateSearchVolume(views: number, favorers: number): number {
    // Estimation basée sur les vues et favoris Etsy
    const engagementRate = favorers / Math.max(views, 1)
    
    if (views > 10000 && engagementRate > 0.1) return Math.floor(Math.random() * 5000) + 5000
    if (views > 5000 && engagementRate > 0.05) return Math.floor(Math.random() * 3000) + 2000
    if (views > 1000 && engagementRate > 0.02) return Math.floor(Math.random() * 2000) + 500
    if (views > 100) return Math.floor(Math.random() * 500) + 100
    return Math.floor(Math.random() * 100) + 10
  }

  private calculateCompetition(listing: EtsyListing): 'low' | 'medium' | 'high' {
    const price = parseFloat(listing.price) || 0
    const favorers = listing.num_favorers
    const views = listing.views
    
    const engagementRate = favorers / Math.max(views, 1)
    
    if (price > 50 && engagementRate > 0.1) return 'high'
    if (price > 20 && engagementRate > 0.05) return 'medium'
    return 'low'
  }

  private estimateCPC(categoryPath: string[]): number {
    // CPC estimé basé sur la catégorie Etsy
    const category = categoryPath[0]?.toLowerCase() || 'other'
    
    const cpcRates: Record<string, number> = {
      'jewelry': 0.8,
      'home & living': 0.6,
      'art & collectibles': 0.4,
      'crafts & supplies': 0.3,
      'clothing': 1.2,
      'electronics & accessories': 1.5,
      'other': 0.5
    }
    
    return cpcRates[category] || 0.5
  }

  private calculatePotentialRevenue(volume: number, price: number, competition: string): number {
    const conversionRate = competition === 'low' ? 0.08 : competition === 'medium' ? 0.05 : 0.03
    return volume * conversionRate * price
  }

  private determineTrend(volume: number, creationTime: number): 'up' | 'down' | 'stable' {
    // Tendance basée sur l'âge du listing et le volume
    const ageInDays = (Date.now() / 1000 - creationTime) / (24 * 60 * 60)
    
    if (ageInDays < 30 && volume > 1000) return 'up'
    if (ageInDays < 90 && volume > 500) return 'stable'
    return 'down'
  }

  private calculateDifficulty(competition: string, volume: number): number {
    let difficulty = 40 // Base difficulty pour Etsy (généralement plus facile)
    
    if (competition === 'high') difficulty += 25
    else if (competition === 'medium') difficulty += 15
    
    if (volume > 3000) difficulty += 15
    else if (volume > 1000) difficulty += 10
    
    return Math.min(100, Math.max(0, difficulty))
  }

  private extractKeywordFromListing(listing: EtsyListing, originalQuery: string): string {
    // Priorité: tags > titre > catégorie
    const tags = listing.tags.map(tag => tag.toLowerCase())
    const title = listing.title.toLowerCase()
    const query = originalQuery.toLowerCase()
    
    // Trouver les tags qui correspondent à la requête
    const matchingTags = tags.filter(tag => 
      query.split(' ').some(qWord => tag.includes(qWord))
    )
    
    if (matchingTags.length > 0) {
      return matchingTags[0]
    }
    
    // Fallback: utiliser les premiers mots du titre
    const titleWords = title.split(/\s+/)
    return titleWords.slice(0, 3).join(' ')
  }

  async getCategories(): Promise<EtsyCategory[]> {
    try {
      const cacheKey = 'etsy:categories'
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      const response = await this.makeRequest<{ results: EtsyCategory[] }>('/application/shops/active/categories')
      
      if (response.results) {
        await cacheService.set(cacheKey, response.results, 86400) // 24 heures
        return response.results
      }

      return []

    } catch (error) {
      logger.error('Error getting Etsy categories:', error)
      return []
    }
  }

  async getShopListings(shopId: number, limit: number = 50): Promise<EtsyListing[]> {
    try {
      const cacheKey = `etsy:shop:${shopId}:${limit}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      const response = await this.makeRequest<EtsySearchResponse>(`/application/shops/${shopId}/listings/active`, {
        limit: limit,
        includes: 'Images'
      })

      const listings = response.results || []
      await cacheService.set(cacheKey, listings, 1800) // 30 minutes
      return listings

    } catch (error) {
      logger.error('Error getting shop listings:', error)
      return []
    }
  }

  async getRelatedKeywords(query: string): Promise<string[]> {
    try {
      const cacheKey = `etsy:related:${query}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      const keywords = await this.searchKeywords(query, 20)
      const relatedKeywords = keywords
        .map(k => k.term)
        .filter(term => term !== query)
        .slice(0, 10)

      await cacheService.set(cacheKey, relatedKeywords, 3600) // 1 heure
      return relatedKeywords

    } catch (error) {
      logger.error('Error getting related keywords:', error)
      return []
    }
  }

  async getTrendingKeywords(category?: string): Promise<Keyword[]> {
    try {
      const cacheKey = `etsy:trending:${category || 'all'}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      // Rechercher des mots-clés populaires dans la catégorie
      const popularQueries = [
        'digital download',
        'printable',
        'template',
        'planner',
        'sticker',
        'wall art',
        'invitation',
        'business card',
        'logo',
        'banner'
      ]

      const trendingKeywords: Keyword[] = []
      
      for (const query of popularQueries) {
        const keywords = await this.searchKeywords(query, 5)
        trendingKeywords.push(...keywords)
      }

      // Trier par volume de recherche
      trendingKeywords.sort((a, b) => b.searchVolume - a.searchVolume)

      await cacheService.set(cacheKey, trendingKeywords, 3600) // 1 heure
      return trendingKeywords.slice(0, 20)

    } catch (error) {
      logger.error('Error getting trending keywords:', error)
      return []
    }
  }
}

export const etsyAPI = new EtsyAPI()
