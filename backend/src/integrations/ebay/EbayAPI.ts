import axios, { AxiosInstance } from 'axios'
import { Keyword } from '../../models/Keyword'
import { logger } from '../../utils/logger'
import { cacheService } from '../../services/cacheService'

interface EbayConfig {
  appId: string
  certId: string
  devId: string
  baseURL: string
  sandboxURL: string
  isSandbox: boolean
}

interface EbayItem {
  itemId: string
  title: string
  subtitle?: string
  price: {
    value: string
    currency: string
  }
  condition: string
  conditionId: string
  categoryId: string
  categoryPath: string[]
  itemWebUrl: string
  location: string
  country: string
  shippingOptions: any[]
  sellingStatus: {
    currentPrice: {
      value: string
      currency: string
    }
    timeLeft: string
    bidCount?: number
  }
  listingInfo: {
    listingType: string
    gift: boolean
    watchCount?: number
  }
  viewItemURL: string
  globalId: string
  primaryCategory: {
    categoryId: string
    categoryName: string
  }
  secondaryCategory?: {
    categoryId: string
    categoryName: string
  }
}

interface EbaySearchResponse {
  itemSummaries: EbayItem[]
  total: number
  limit: number
  offset: number
  href: string
  next?: string
  prev?: string
}

interface EbayCategory {
  categoryId: string
  categoryName: string
  categoryTreeNodeLevel: number
  categoryTreeNode: string
  categoryParentId: string
  leafCategory: boolean
}

export class EbayAPI {
  private client: AxiosInstance
  private config: EbayConfig
  private rateLimiter: Map<string, number> = new Map()
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    this.config = {
      appId: process.env.EBAY_APP_ID || '',
      certId: process.env.EBAY_CERT_ID || '',
      devId: process.env.EBAY_DEV_ID || '',
      baseURL: 'https://api.ebay.com',
      sandboxURL: 'https://api.sandbox.ebay.com',
      isSandbox: process.env.EBAY_SANDBOX === 'true'
    }

    this.client = axios.create({
      baseURL: this.config.isSandbox ? this.config.sandboxURL : this.config.baseURL,
      timeout: 10000,
      headers: {
        'User-Agent': 'Digitallz-Keywords-Platform/1.0',
        'Content-Type': 'application/json'
      }
    })

    // Intercepteur pour la gestion des erreurs
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('eBay API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const windowMs = 200 // 200ms entre les requêtes
    const lastRequest = this.rateLimiter.get('ebay') || 0

    if (now - lastRequest < windowMs) {
      const waitTime = windowMs - (now - lastRequest)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.rateLimiter.set('ebay', Date.now())
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const response = await axios.post(`${this.config.baseURL}/identity/v1/oauth2/token`, 
        'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.config.appId}:${this.config.certId}`).toString('base64')}`
          }
        }
      )

      this.accessToken = response.data.access_token
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000 // 1 minute de marge

      return this.accessToken

    } catch (error) {
      logger.error('Error getting eBay access token:', error)
      throw new Error('Failed to get eBay access token')
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    await this.checkRateLimit()

    const token = await this.getAccessToken()
    const response = await this.client.get(endpoint, {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    return response.data
  }

  async searchKeywords(query: string, maxResults: number = 50): Promise<Keyword[]> {
    try {
      // Vérifier le cache d'abord
      const cacheKey = `ebay:${query}:${maxResults}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        logger.info(`Cache hit for eBay query: ${query}`)
        return cached
      }

      logger.info(`Searching eBay for: ${query}`)
      
      const keywords: Keyword[] = []
      const limit = Math.min(200, maxResults) // eBay limite à 200 par requête
      let offset = 0

      while (keywords.length < maxResults && offset < 10000) { // Limite eBay
        try {
          const response = await this.makeRequest<EbaySearchResponse>('/buy/browse/v1/item_summary/search', {
            q: query,
            limit: limit,
            offset: offset,
            sort: 'bestMatch',
            filter: 'conditionIds:{3000|4000|5000}', // Nouveau, Occasion, Très bon état
            fieldgroups: 'EXTENDED'
          })

          if (response.itemSummaries && response.itemSummaries.length > 0) {
            for (const item of response.itemSummaries) {
              const keyword = this.transformItemToKeyword(item, query)
              if (keyword) {
                keywords.push(keyword)
              }
            }

            // Si on a moins de résultats que demandé, on a atteint la fin
            if (response.itemSummaries.length < limit) {
              break
            }

            offset += limit
          } else {
            break
          }

        } catch (error) {
          logger.error(`Error searching eBay offset ${offset}:`, error)
          break
        }
      }

      // Trier par volume de recherche estimé
      keywords.sort((a, b) => b.searchVolume - a.searchVolume)

      // Mettre en cache les résultats
      await cacheService.set(cacheKey, keywords, 3600) // 1 heure

      logger.info(`Found ${keywords.length} keywords for eBay query: ${query}`)
      return keywords.slice(0, maxResults)

    } catch (error) {
      logger.error('eBay search error:', error)
      throw new Error(`Failed to search eBay: ${error.message}`)
    }
  }

  private transformItemToKeyword(item: EbayItem, originalQuery: string): Keyword | null {
    try {
      if (!item.itemId || !item.title) {
        return null
      }

      // Extraire des mots-clés du titre
      const title = item.title.toLowerCase()
      const query = originalQuery.toLowerCase()
      
      // Calculer le volume de recherche estimé basé sur les enchères et vues
      const estimatedVolume = this.estimateSearchVolume(item)

      // Calculer le niveau de concurrence basé sur le prix et la catégorie
      const competition = this.calculateCompetition(item)

      // Calculer le CPC estimé pour eBay
      const cpc = this.estimateCPC(item.primaryCategory.categoryName)

      // Calculer le potentiel de revenus
      const price = parseFloat(item.sellingStatus.currentPrice.value) || 0
      const potentialRevenue = this.calculatePotentialRevenue(estimatedVolume, price, competition)

      // Extraire le mot-clé le plus pertinent
      const keyword = this.extractKeywordFromItem(item, query)

      return {
        id: `ebay-${item.itemId}`,
        term: keyword,
        platform: 'ebay',
        searchVolume: estimatedVolume,
        trend: this.determineTrend(estimatedVolume, item.listingInfo),
        competition: competition,
        potentialRevenue: potentialRevenue,
        cpc: cpc,
        difficulty: this.calculateDifficulty(competition, estimatedVolume),
        lastUpdated: new Date()
      }

    } catch (error) {
      logger.error('Error transforming eBay item:', error)
      return null
    }
  }

  private estimateSearchVolume(item: EbayItem): number {
    // Estimation basée sur les enchères et la catégorie
    const bidCount = item.sellingStatus.bidCount || 0
    const watchCount = item.listingInfo.watchCount || 0
    const categoryId = parseInt(item.primaryCategory.categoryId)
    
    let baseVolume = 100
    
    // Ajuster selon le nombre d'enchères
    if (bidCount > 10) baseVolume += 2000
    else if (bidCount > 5) baseVolume += 1000
    else if (bidCount > 0) baseVolume += 500
    
    // Ajuster selon les vues
    if (watchCount > 50) baseVolume += 1000
    else if (watchCount > 20) baseVolume += 500
    else if (watchCount > 5) baseVolume += 200
    
    // Ajuster selon la catégorie (certaines catégories sont plus populaires)
    if (categoryId >= 58058) baseVolume += 1000 // Electronics
    else if (categoryId >= 11450) baseVolume += 800 // Fashion
    else if (categoryId >= 11700) baseVolume += 600 // Home & Garden
    
    return Math.floor(Math.random() * baseVolume) + baseVolume
  }

  private calculateCompetition(item: EbayItem): 'low' | 'medium' | 'high' {
    const price = parseFloat(item.sellingStatus.currentPrice.value) || 0
    const bidCount = item.sellingStatus.bidCount || 0
    const watchCount = item.listingInfo.watchCount || 0
    
    if (price > 100 && (bidCount > 5 || watchCount > 20)) return 'high'
    if (price > 50 && (bidCount > 2 || watchCount > 10)) return 'medium'
    return 'low'
  }

  private estimateCPC(categoryName: string): number {
    // CPC estimé basé sur la catégorie eBay
    const category = categoryName.toLowerCase()
    
    const cpcRates: Record<string, number> = {
      'electronics': 2.0,
      'fashion': 1.5,
      'home & garden': 1.2,
      'collectibles': 0.8,
      'sporting goods': 1.8,
      'toys & hobbies': 1.0,
      'books': 0.5,
      'other': 1.0
    }
    
    for (const [key, rate] of Object.entries(cpcRates)) {
      if (category.includes(key)) {
        return rate
      }
    }
    
    return 1.0
  }

  private calculatePotentialRevenue(volume: number, price: number, competition: string): number {
    const conversionRate = competition === 'low' ? 0.03 : competition === 'medium' ? 0.02 : 0.01
    return volume * conversionRate * price
  }

  private determineTrend(item: EbayItem, listingInfo: any): 'up' | 'down' | 'stable' {
    // Tendance basée sur le type de listing et l'activité
    const bidCount = item.sellingStatus.bidCount || 0
    const watchCount = listingInfo.watchCount || 0
    
    if (listingInfo.listingType === 'AUCTION' && bidCount > 5) return 'up'
    if (watchCount > 20) return 'up'
    if (bidCount > 0 || watchCount > 5) return 'stable'
    return 'down'
  }

  private calculateDifficulty(competition: string, volume: number): number {
    let difficulty = 60 // Base difficulty pour eBay (plus compétitif)
    
    if (competition === 'high') difficulty += 25
    else if (competition === 'medium') difficulty += 15
    
    if (volume > 5000) difficulty += 20
    else if (volume > 1000) difficulty += 10
    
    return Math.min(100, Math.max(0, difficulty))
  }

  private extractKeywordFromItem(item: EbayItem, originalQuery: string): string {
    // Extraire les mots-clés pertinents du titre
    const title = item.title.toLowerCase()
    const query = originalQuery.toLowerCase()
    
    // Trouver les mots communs
    const titleWords = title.split(/\s+/)
    const queryWords = query.split(/\s+/)
    
    const commonWords = titleWords.filter(word => 
      queryWords.some(qWord => word.includes(qWord))
    )
    
    if (commonWords.length > 0) {
      return commonWords.join(' ')
    }
    
    // Fallback: utiliser les premiers mots du titre
    return titleWords.slice(0, 3).join(' ')
  }

  async getCategories(): Promise<EbayCategory[]> {
    try {
      const cacheKey = 'ebay:categories'
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      const response = await this.makeRequest<{ categories: EbayCategory[] }>('/commerce/taxonomy/v1/category_tree/0')
      
      if (response.categories) {
        await cacheService.set(cacheKey, response.categories, 86400) // 24 heures
        return response.categories
      }

      return []

    } catch (error) {
      logger.error('Error getting eBay categories:', error)
      return []
    }
  }

  async getItemDetails(itemId: string): Promise<EbayItem | null> {
    try {
      const cacheKey = `ebay:item:${itemId}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      const response = await this.makeRequest<{ items: EbayItem[] }>(`/buy/browse/v1/item/${itemId}`)
      
      const item = response.items?.[0]
      if (item) {
        await cacheService.set(cacheKey, item, 1800) // 30 minutes
      }

      return item || null

    } catch (error) {
      logger.error('Error getting item details:', error)
      return null
    }
  }

  async getRelatedKeywords(query: string): Promise<string[]> {
    try {
      const cacheKey = `ebay:related:${query}`
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

  async getTrendingKeywords(categoryId?: string): Promise<Keyword[]> {
    try {
      const cacheKey = `ebay:trending:${categoryId || 'all'}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      // Rechercher des mots-clés populaires sur eBay
      const popularQueries = [
        'vintage',
        'collectible',
        'rare',
        'antique',
        'retro',
        'limited edition',
        'new in box',
        'mint condition',
        'original',
        'authentic'
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

export const ebayAPI = new EbayAPI()
