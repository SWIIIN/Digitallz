import axios, { AxiosInstance } from 'axios'
import crypto from 'crypto'
import { Keyword } from '../../models/Keyword'
import { logger } from '../../utils/logger'
import { cacheService } from '../../services/cacheService'

interface AmazonConfig {
  accessKey: string
  secretKey: string
  associateTag: string
  region: string
  endpoint: string
}

interface AmazonSearchParams {
  Keywords: string
  SearchIndex: string
  ItemPage?: number
  ResponseGroup?: string
  Sort?: string
}

interface AmazonItem {
  ASIN: string
  Title: string
  DetailPageURL: string
  SalesRank: string
  ListPrice?: {
    Amount: string
    CurrencyCode: string
  }
  OfferSummary?: {
    LowestNewPrice?: {
      Amount: string
      CurrencyCode: string
    }
  }
  ItemAttributes?: {
    ProductGroup: string
    Title: string
  }
}

interface AmazonResponse {
  ItemSearchResponse: {
    Items: {
      Item: AmazonItem[]
      TotalResults: string
      TotalPages: string
    }
  }
}

export class AmazonAPI {
  private client: AxiosInstance
  private config: AmazonConfig
  private rateLimiter: Map<string, number> = new Map()

  constructor() {
    this.config = {
      accessKey: process.env.AMAZON_ACCESS_KEY || '',
      secretKey: process.env.AMAZON_SECRET_KEY || '',
      associateTag: process.env.AMAZON_ASSOCIATE_TAG || '',
      region: process.env.AMAZON_REGION || 'us-east-1',
      endpoint: this.getEndpoint(process.env.AMAZON_REGION || 'us-east-1')
    }

    this.client = axios.create({
      baseURL: this.config.endpoint,
      timeout: 10000,
      headers: {
        'User-Agent': 'Digitallz-Keywords-Platform/1.0'
      }
    })

    // Intercepteur pour la gestion des erreurs
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Amazon API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  private getEndpoint(region: string): string {
    const endpoints: Record<string, string> = {
      'us-east-1': 'https://webservices.amazon.com',
      'us-west-2': 'https://webservices.amazon.com',
      'eu-west-1': 'https://webservices.amazon.co.uk',
      'eu-central-1': 'https://webservices.amazon.de',
      'ap-northeast-1': 'https://webservices.amazon.co.jp'
    }
    return endpoints[region] || endpoints['us-east-1']
  }

  private generateSignature(params: Record<string, string>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&')

    const stringToSign = `GET\n${this.config.endpoint.replace('https://', '')}\n/onca/xml\n${sortedParams}`
    
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(stringToSign)
      .digest('base64')
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const windowMs = 1000 // 1 seconde
    const lastRequest = this.rateLimiter.get('amazon') || 0

    if (now - lastRequest < windowMs) {
      const waitTime = windowMs - (now - lastRequest)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.rateLimiter.set('amazon', Date.now())
  }

  private async makeRequest(params: AmazonSearchParams): Promise<AmazonResponse> {
    await this.checkRateLimit()

    const timestamp = new Date().toISOString()
    const requestParams = {
      'AWSAccessKeyId': this.config.accessKey,
      'AssociateTag': this.config.associateTag,
      'Operation': 'ItemSearch',
      'Service': 'AWSECommerceService',
      'Version': '2013-08-01',
      'Timestamp': timestamp,
      'Keywords': params.Keywords,
      'SearchIndex': params.SearchIndex,
      'ResponseGroup': params.ResponseGroup || 'ItemAttributes,Offers,SalesRank',
      'ItemPage': params.ItemPage?.toString() || '1',
      'Sort': params.Sort || 'relevancerank'
    }

    const signature = this.generateSignature(requestParams)
    requestParams['Signature'] = signature

    const response = await this.client.get('/onca/xml', { params: requestParams })
    return response.data
  }

  async searchKeywords(query: string, maxResults: number = 50): Promise<Keyword[]> {
    try {
      // Vérifier le cache d'abord
      const cacheKey = `amazon:${query}:${maxResults}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        logger.info(`Cache hit for Amazon query: ${query}`)
        return cached
      }

      logger.info(`Searching Amazon for: ${query}`)
      
      const keywords: Keyword[] = []
      const searchIndexes = [
        'Books',
        'KindleStore',
        'Software',
        'DigitalMusic',
        'VideoGames',
        'Electronics'
      ]

      for (const searchIndex of searchIndexes) {
        try {
          const response = await this.makeRequest({
            Keywords: query,
            SearchIndex: searchIndex,
            ResponseGroup: 'ItemAttributes,Offers,SalesRank',
            ItemPage: 1
          })

          if (response.ItemSearchResponse?.Items?.Item) {
            const items = Array.isArray(response.ItemSearchResponse.Items.Item)
              ? response.ItemSearchResponse.Items.Item
              : [response.ItemSearchResponse.Items.Item]

            for (const item of items.slice(0, Math.ceil(maxResults / searchIndexes.length))) {
              const keyword = this.transformItemToKeyword(item, query)
              if (keyword) {
                keywords.push(keyword)
              }
            }
          }

          // Pause entre les requêtes pour respecter les limites
          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (error) {
          logger.error(`Error searching ${searchIndex}:`, error)
          continue
        }
      }

      // Trier par volume de recherche estimé
      keywords.sort((a, b) => b.searchVolume - a.searchVolume)

      // Mettre en cache les résultats
      await cacheService.set(cacheKey, keywords, 3600) // 1 heure

      logger.info(`Found ${keywords.length} keywords for Amazon query: ${query}`)
      return keywords.slice(0, maxResults)

    } catch (error) {
      logger.error('Amazon search error:', error)
      throw new Error(`Failed to search Amazon: ${error.message}`)
    }
  }

  private transformItemToKeyword(item: AmazonItem, originalQuery: string): Keyword | null {
    try {
      if (!item.ASIN || !item.Title) {
        return null
      }

      // Extraire des mots-clés du titre
      const title = item.Title.toLowerCase()
      const query = originalQuery.toLowerCase()
      
      // Calculer le volume de recherche estimé basé sur le rang de vente
      const salesRank = parseInt(item.SalesRank) || 1000000
      const estimatedVolume = this.estimateSearchVolume(salesRank)

      // Calculer le niveau de concurrence basé sur le prix et le rang
      const competition = this.calculateCompetition(item)

      // Calculer le CPC estimé basé sur la catégorie
      const cpc = this.estimateCPC(item.ItemAttributes?.ProductGroup || 'Other')

      // Calculer le potentiel de revenus
      const price = this.extractPrice(item)
      const potentialRevenue = this.calculatePotentialRevenue(estimatedVolume, price, competition)

      return {
        id: `amazon-${item.ASIN}`,
        term: this.extractKeywordFromTitle(title, query),
        platform: 'amazon',
        searchVolume: estimatedVolume,
        trend: this.determineTrend(estimatedVolume),
        competition: competition,
        potentialRevenue: potentialRevenue,
        cpc: cpc,
        difficulty: this.calculateDifficulty(competition, estimatedVolume),
        lastUpdated: new Date()
      }

    } catch (error) {
      logger.error('Error transforming Amazon item:', error)
      return null
    }
  }

  private estimateSearchVolume(salesRank: number): number {
    // Estimation basée sur le rang de vente Amazon
    if (salesRank <= 100) return Math.floor(Math.random() * 5000) + 10000
    if (salesRank <= 1000) return Math.floor(Math.random() * 3000) + 5000
    if (salesRank <= 10000) return Math.floor(Math.random() * 2000) + 1000
    if (salesRank <= 100000) return Math.floor(Math.random() * 1000) + 100
    return Math.floor(Math.random() * 100) + 10
  }

  private calculateCompetition(item: AmazonItem): 'low' | 'medium' | 'high' {
    const salesRank = parseInt(item.SalesRank) || 1000000
    const hasPrice = !!(item.ListPrice || item.OfferSummary?.LowestNewPrice)
    
    if (salesRank <= 1000 && hasPrice) return 'high'
    if (salesRank <= 10000 && hasPrice) return 'medium'
    return 'low'
  }

  private estimateCPC(productGroup: string): number {
    const cpcRates: Record<string, number> = {
      'Books': 0.5,
      'KindleStore': 0.3,
      'Software': 1.5,
      'DigitalMusic': 0.8,
      'VideoGames': 2.0,
      'Electronics': 2.5,
      'Other': 1.0
    }
    return cpcRates[productGroup] || 1.0
  }

  private extractPrice(item: AmazonItem): number {
    const listPrice = item.ListPrice?.Amount
    const offerPrice = item.OfferSummary?.LowestNewPrice?.Amount
    
    if (offerPrice) return parseFloat(offerPrice)
    if (listPrice) return parseFloat(listPrice)
    return 0
  }

  private calculatePotentialRevenue(volume: number, price: number, competition: string): number {
    const conversionRate = competition === 'low' ? 0.05 : competition === 'medium' ? 0.03 : 0.01
    return volume * conversionRate * price
  }

  private determineTrend(volume: number): 'up' | 'down' | 'stable' {
    // Simulation de tendance basée sur le volume
    const random = Math.random()
    if (random < 0.3) return 'up'
    if (random < 0.6) return 'stable'
    return 'down'
  }

  private calculateDifficulty(competition: string, volume: number): number {
    let difficulty = 50 // Base difficulty
    
    if (competition === 'high') difficulty += 30
    else if (competition === 'medium') difficulty += 15
    
    if (volume > 5000) difficulty += 20
    else if (volume > 1000) difficulty += 10
    
    return Math.min(100, Math.max(0, difficulty))
  }

  private extractKeywordFromTitle(title: string, originalQuery: string): string {
    // Extraire les mots-clés pertinents du titre
    const words = title.split(/\s+/)
    const queryWords = originalQuery.split(/\s+/)
    
    // Trouver les mots communs
    const commonWords = words.filter(word => 
      queryWords.some(qWord => word.includes(qWord))
    )
    
    if (commonWords.length > 0) {
      return commonWords.join(' ')
    }
    
    // Fallback: utiliser les premiers mots du titre
    return words.slice(0, 3).join(' ')
  }

  async getProductDetails(asin: string): Promise<any> {
    try {
      const cacheKey = `amazon:product:${asin}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      const response = await this.makeRequest({
        Keywords: asin,
        SearchIndex: 'All',
        ResponseGroup: 'ItemAttributes,Offers,Reviews,Images'
      })

      const product = response.ItemSearchResponse?.Items?.Item?.[0]
      if (product) {
        await cacheService.set(cacheKey, product, 1800) // 30 minutes
      }

      return product

    } catch (error) {
      logger.error('Error getting product details:', error)
      throw error
    }
  }

  async getRelatedKeywords(query: string): Promise<string[]> {
    try {
      const cacheKey = `amazon:related:${query}`
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
}

export const amazonAPI = new AmazonAPI()
