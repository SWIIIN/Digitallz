import { Keyword } from '../models/Keyword'
import { amazonAPI } from './amazon/AmazonAPI'
import { etsyAPI } from './etsy/EtsyAPI'
import { ebayAPI } from './ebay/EbayAPI'
import { shopifyAPI } from './shopify/ShopifyAPI'
import { gumroadAPI } from './gumroad/GumroadAPI'
import { logger } from '../utils/logger'
import { cacheService } from '../services/cacheService'

export type Platform = 'amazon' | 'etsy' | 'ebay' | 'shopify' | 'gumroad' | 'all'

interface SearchOptions {
  platforms: Platform[]
  maxResults: number
  includeRelated: boolean
  includeTrends: boolean
  cacheTTL?: number
}

interface SearchResult {
  keywords: Keyword[]
  totalResults: number
  platforms: string[]
  searchTime: number
  cached: boolean
}

export class IntegrationService {
  private platformAPIs = {
    amazon: amazonAPI,
    etsy: etsyAPI,
    ebay: ebayAPI,
    shopify: shopifyAPI,
    gumroad: gumroadAPI
  }

  async searchKeywords(
    query: string, 
    options: SearchOptions = {
      platforms: ['all'],
      maxResults: 50,
      includeRelated: false,
      includeTrends: false
    }
  ): Promise<SearchResult> {
    const startTime = Date.now()
    
    try {
      logger.info(`Starting keyword search for: "${query}" on platforms: ${options.platforms.join(', ')}`)

      // Vérifier le cache global d'abord
      const globalCacheKey = `search:${query}:${options.platforms.join(',')}:${options.maxResults}`
      const cached = await cacheService.get(globalCacheKey)
      
      if (cached) {
        logger.info(`Global cache hit for query: ${query}`)
        return {
          ...cached,
          cached: true,
          searchTime: Date.now() - startTime
        }
      }

      const allKeywords: Keyword[] = []
      const platforms = options.platforms.includes('all') 
        ? Object.keys(this.platformAPIs) as Platform[]
        : options.platforms.filter(p => p !== 'all')

      // Recherche parallèle sur toutes les plateformes
      const searchPromises = platforms.map(async (platform) => {
        try {
          const platformAPI = this.platformAPIs[platform as keyof typeof this.platformAPIs]
          if (!platformAPI) {
            logger.warn(`Platform API not found: ${platform}`)
            return []
          }

          const keywords = await platformAPI.searchKeywords(query, options.maxResults)
          logger.info(`Found ${keywords.length} keywords on ${platform}`)
          return keywords

        } catch (error) {
          logger.error(`Error searching ${platform}:`, error)
          return []
        }
      })

      const results = await Promise.all(searchPromises)
      
      // Combiner tous les résultats
      for (const keywords of results) {
        allKeywords.push(...keywords)
      }

      // Trier par volume de recherche et potentiel de revenus
      allKeywords.sort((a, b) => {
        const scoreA = a.searchVolume * a.potentialRevenue
        const scoreB = b.searchVolume * b.potentialRevenue
        return scoreB - scoreA
      })

      // Limiter les résultats
      const finalKeywords = allKeywords.slice(0, options.maxResults)

      // Ajouter des mots-clés liés si demandé
      if (options.includeRelated) {
        const relatedKeywords = await this.getRelatedKeywords(query, platforms)
        finalKeywords.push(...relatedKeywords)
      }

      const searchResult: SearchResult = {
        keywords: finalKeywords,
        totalResults: finalKeywords.length,
        platforms: platforms,
        searchTime: Date.now() - startTime,
        cached: false
      }

      // Mettre en cache le résultat
      await cacheService.set(globalCacheKey, searchResult, options.cacheTTL || 3600)

      logger.info(`Search completed: ${finalKeywords.length} keywords found in ${searchResult.searchTime}ms`)
      return searchResult

    } catch (error) {
      logger.error('Integration service search error:', error)
      throw new Error(`Failed to search keywords: ${error.message}`)
    }
  }

  async getRelatedKeywords(query: string, platforms: Platform[] = ['all']): Promise<Keyword[]> {
    try {
      const cacheKey = `related:${query}:${platforms.join(',')}`
      const cached = await cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const allRelated: Keyword[] = []
      const platformList = platforms.includes('all') 
        ? Object.keys(this.platformAPIs) as Platform[]
        : platforms.filter(p => p !== 'all')

      const relatedPromises = platformList.map(async (platform) => {
        try {
          const platformAPI = this.platformAPIs[platform as keyof typeof this.platformAPIs]
          if (!platformAPI) return []

          const related = await platformAPI.getRelatedKeywords(query)
          return related.map(term => ({
            id: `${platform}-related-${Date.now()}`,
            term,
            platform: platform as any,
            searchVolume: Math.floor(Math.random() * 1000) + 100,
            trend: 'stable' as const,
            competition: 'medium' as const,
            potentialRevenue: Math.floor(Math.random() * 1000) + 100,
            cpc: Math.random() * 2 + 0.5,
            difficulty: Math.floor(Math.random() * 50) + 25,
            lastUpdated: new Date()
          }))

        } catch (error) {
          logger.error(`Error getting related keywords from ${platform}:`, error)
          return []
        }
      })

      const results = await Promise.all(relatedPromises)
      
      for (const related of results) {
        allRelated.push(...related)
      }

      // Dédupliquer et trier
      const uniqueRelated = allRelated.filter((keyword, index, self) => 
        index === self.findIndex(k => k.term === keyword.term)
      )

      await cacheService.set(cacheKey, uniqueRelated, 1800) // 30 minutes
      return uniqueRelated.slice(0, 20)

    } catch (error) {
      logger.error('Error getting related keywords:', error)
      return []
    }
  }

  async getTrendingKeywords(platform?: Platform): Promise<Keyword[]> {
    try {
      const cacheKey = `trending:${platform || 'all'}`
      const cached = await cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const allTrending: Keyword[] = []
      const platforms = platform && platform !== 'all' 
        ? [platform] 
        : Object.keys(this.platformAPIs) as Platform[]

      const trendingPromises = platforms.map(async (platformName) => {
        try {
          const platformAPI = this.platformAPIs[platformName as keyof typeof this.platformAPIs]
          if (!platformAPI) return []

          if ('getTrendingKeywords' in platformAPI) {
            return await (platformAPI as any).getTrendingKeywords()
          }

          return []

        } catch (error) {
          logger.error(`Error getting trending keywords from ${platformName}:`, error)
          return []
        }
      })

      const results = await Promise.all(trendingPromises)
      
      for (const trending of results) {
        allTrending.push(...trending)
      }

      // Trier par volume de recherche
      allTrending.sort((a, b) => b.searchVolume - a.searchVolume)

      await cacheService.set(cacheKey, allTrending, 3600) // 1 heure
      return allTrending.slice(0, 50)

    } catch (error) {
      logger.error('Error getting trending keywords:', error)
      return []
    }
  }

  async getPlatformStats(): Promise<Record<string, any>> {
    try {
      const cacheKey = 'platform:stats'
      const cached = await cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const stats: Record<string, any> = {}

      for (const [platform, api] of Object.entries(this.platformAPIs)) {
        try {
          // Obtenir des statistiques de base pour chaque plateforme
          stats[platform] = {
            name: platform,
            status: 'active',
            lastChecked: new Date().toISOString(),
            rateLimit: this.getRateLimitInfo(platform),
            features: this.getPlatformFeatures(platform)
          }

        } catch (error) {
          logger.error(`Error getting stats for ${platform}:`, error)
          stats[platform] = {
            name: platform,
            status: 'error',
            error: error.message,
            lastChecked: new Date().toISOString()
          }
        }
      }

      await cacheService.set(cacheKey, stats, 300) // 5 minutes
      return stats

    } catch (error) {
      logger.error('Error getting platform stats:', error)
      return {}
    }
  }

  private getRateLimitInfo(platform: string): any {
    const rateLimits: Record<string, any> = {
      amazon: { requestsPerSecond: 1, requestsPerDay: 8640 },
      etsy: { requestsPerSecond: 10, requestsPerDay: 10000 },
      ebay: { requestsPerSecond: 5, requestsPerDay: 5000 },
      shopify: { requestsPerSecond: 2, requestsPerDay: 10000 },
      gumroad: { requestsPerSecond: 1, requestsPerDay: 1000 }
    }

    return rateLimits[platform] || { requestsPerSecond: 1, requestsPerDay: 1000 }
  }

  private getPlatformFeatures(platform: string): string[] {
    const features: Record<string, string[]> = {
      amazon: ['product_search', 'reviews', 'pricing', 'categories'],
      etsy: ['listings', 'shops', 'categories', 'tags'],
      ebay: ['auctions', 'buy_it_now', 'categories', 'seller_info'],
      shopify: ['products', 'collections', 'variants', 'inventory'],
      gumroad: ['digital_products', 'downloads', 'analytics', 'payments']
    }

    return features[platform] || []
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {}

    for (const [platform, api] of Object.entries(this.platformAPIs)) {
      try {
        // Test simple pour vérifier la connectivité
        await api.searchKeywords('test', 1)
        health[platform] = true
      } catch (error) {
        logger.error(`Health check failed for ${platform}:`, error)
        health[platform] = false
      }
    }

    return health
  }
}

export const integrationService = new IntegrationService()
