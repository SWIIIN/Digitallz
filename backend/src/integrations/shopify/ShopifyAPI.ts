import axios, { AxiosInstance } from 'axios'
import { Keyword } from '../../models/Keyword'
import { logger } from '../../utils/logger'
import { cacheService } from '../../services/cacheService'

interface ShopifyConfig {
  shopDomain: string
  accessToken: string
  apiVersion: string
  baseURL: string
}

interface ShopifyProduct {
  id: number
  title: string
  body_html: string
  vendor: string
  product_type: string
  created_at: string
  updated_at: string
  published_at: string
  template_suffix: string
  status: string
  published_scope: string
  tags: string
  admin_graphql_api_id: string
  variants: ShopifyVariant[]
  options: ShopifyOption[]
  images: ShopifyImage[]
  image: ShopifyImage
  handle: string
}

interface ShopifyVariant {
  id: number
  product_id: number
  title: string
  price: string
  sku: string
  position: number
  inventory_policy: string
  compare_at_price: string
  fulfillment_service: string
  inventory_management: string
  option1: string
  option2: string
  option3: string
  created_at: string
  updated_at: string
  taxable: boolean
  barcode: string
  grams: number
  image_id: number
  weight: number
  weight_unit: string
  inventory_item_id: number
  inventory_quantity: number
  old_inventory_quantity: number
  requires_shipping: boolean
  admin_graphql_api_id: string
}

interface ShopifyOption {
  id: number
  product_id: number
  name: string
  position: number
  values: string[]
}

interface ShopifyImage {
  id: number
  product_id: number
  position: number
  created_at: string
  updated_at: string
  alt: string
  width: number
  height: number
  src: string
  variant_ids: number[]
  admin_graphql_api_id: string
}

interface ShopifyCollection {
  id: number
  handle: string
  title: string
  updated_at: string
  body_html: string
  published_at: string
  sort_order: string
  template_suffix: string
  disjunctive: boolean
  rules: ShopifyCollectionRule[]
  published_scope: string
  admin_graphql_api_id: string
}

interface ShopifyCollectionRule {
  column: string
  relation: string
  condition: string
}

interface ShopifySearchResponse {
  products: ShopifyProduct[]
  count: number
}

export class ShopifyAPI {
  private client: AxiosInstance
  private config: ShopifyConfig
  private rateLimiter: Map<string, number> = new Map()

  constructor() {
    this.config = {
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || '',
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
      apiVersion: process.env.SHOPIFY_API_VERSION || '2023-10',
      baseURL: `https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION || '2023-10'}`
    }

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: 10000,
      headers: {
        'X-Shopify-Access-Token': this.config.accessToken,
        'Content-Type': 'application/json',
        'User-Agent': 'Digitallz-Keywords-Platform/1.0'
      }
    })

    // Intercepteur pour la gestion des erreurs
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Shopify API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const windowMs = 500 // 500ms entre les requêtes (2 req/sec)
    const lastRequest = this.rateLimiter.get('shopify') || 0

    if (now - lastRequest < windowMs) {
      const waitTime = windowMs - (now - lastRequest)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.rateLimiter.set('shopify', Date.now())
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    await this.checkRateLimit()

    const response = await this.client.get(endpoint, { params })
    return response.data
  }

  async searchKeywords(query: string, maxResults: number = 50): Promise<Keyword[]> {
    try {
      // Vérifier le cache d'abord
      const cacheKey = `shopify:${query}:${maxResults}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        logger.info(`Cache hit for Shopify query: ${query}`)
        return cached
      }

      logger.info(`Searching Shopify for: ${query}`)
      
      const keywords: Keyword[] = []
      const limit = Math.min(250, maxResults) // Shopify limite à 250 par requête
      let page = 1
      const maxPages = Math.ceil(maxResults / limit)

      while (keywords.length < maxResults && page <= maxPages) {
        try {
          const response = await this.makeRequest<{ products: ShopifyProduct[] }>('/products.json', {
            title: query,
            limit: limit,
            page: page,
            fields: 'id,title,body_html,vendor,product_type,tags,handle,variants,options,images,created_at,updated_at'
          })

          if (response.products && response.products.length > 0) {
            for (const product of response.products) {
              const keyword = this.transformProductToKeyword(product, query)
              if (keyword) {
                keywords.push(keyword)
              }
            }

            // Si on a moins de résultats que demandé, on a atteint la fin
            if (response.products.length < limit) {
              break
            }

            page++
          } else {
            break
          }

        } catch (error) {
          logger.error(`Error searching Shopify page ${page}:`, error)
          break
        }
      }

      // Trier par volume de recherche estimé
      keywords.sort((a, b) => b.searchVolume - a.searchVolume)

      // Mettre en cache les résultats
      await cacheService.set(cacheKey, keywords, 3600) // 1 heure

      logger.info(`Found ${keywords.length} keywords for Shopify query: ${query}`)
      return keywords.slice(0, maxResults)

    } catch (error) {
      logger.error('Shopify search error:', error)
      throw new Error(`Failed to search Shopify: ${error.message}`)
    }
  }

  private transformProductToKeyword(product: ShopifyProduct, originalQuery: string): Keyword | null {
    try {
      if (!product.id || !product.title) {
        return null
      }

      // Extraire des mots-clés du titre et des tags
      const title = product.title.toLowerCase()
      const tags = product.tags ? product.tags.split(',').map(tag => tag.trim().toLowerCase()) : []
      const query = originalQuery.toLowerCase()
      
      // Calculer le volume de recherche estimé basé sur l'âge et les variantes
      const estimatedVolume = this.estimateSearchVolume(product)

      // Calculer le niveau de concurrence basé sur le prix et la catégorie
      const competition = this.calculateCompetition(product)

      // Calculer le CPC estimé pour Shopify
      const cpc = this.estimateCPC(product.product_type)

      // Calculer le potentiel de revenus
      const price = this.extractPrice(product)
      const potentialRevenue = this.calculatePotentialRevenue(estimatedVolume, price, competition)

      // Extraire le mot-clé le plus pertinent
      const keyword = this.extractKeywordFromProduct(product, query)

      return {
        id: `shopify-${product.id}`,
        term: keyword,
        platform: 'shopify',
        searchVolume: estimatedVolume,
        trend: this.determineTrend(estimatedVolume, product),
        competition: competition,
        potentialRevenue: potentialRevenue,
        cpc: cpc,
        difficulty: this.calculateDifficulty(competition, estimatedVolume),
        lastUpdated: new Date()
      }

    } catch (error) {
      logger.error('Error transforming Shopify product:', error)
      return null
    }
  }

  private estimateSearchVolume(product: ShopifyProduct): number {
    // Estimation basée sur l'âge du produit et le nombre de variantes
    const createdAt = new Date(product.created_at)
    const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    const variantCount = product.variants?.length || 1
    const tagCount = product.tags ? product.tags.split(',').length : 0
    
    let baseVolume = 100
    
    // Ajuster selon l'âge (produits plus récents = plus de volume)
    if (ageInDays < 30) baseVolume += 2000
    else if (ageInDays < 90) baseVolume += 1000
    else if (ageInDays < 365) baseVolume += 500
    
    // Ajuster selon le nombre de variantes (plus de variantes = plus populaire)
    if (variantCount > 5) baseVolume += 1000
    else if (variantCount > 2) baseVolume += 500
    
    // Ajuster selon le nombre de tags
    if (tagCount > 10) baseVolume += 500
    else if (tagCount > 5) baseVolume += 200
    
    return Math.floor(Math.random() * baseVolume) + baseVolume
  }

  private calculateCompetition(product: ShopifyProduct): 'low' | 'medium' | 'high' {
    const price = this.extractPrice(product)
    const variantCount = product.variants?.length || 1
    const tagCount = product.tags ? product.tags.split(',').length : 0
    
    if (price > 100 && variantCount > 3 && tagCount > 5) return 'high'
    if (price > 50 && (variantCount > 2 || tagCount > 3)) return 'medium'
    return 'low'
  }

  private estimateCPC(productType: string): number {
    // CPC estimé basé sur le type de produit Shopify
    const type = productType.toLowerCase()
    
    const cpcRates: Record<string, number> = {
      'clothing': 1.5,
      'accessories': 1.2,
      'home & garden': 1.0,
      'electronics': 2.0,
      'beauty': 1.8,
      'health': 1.5,
      'sports': 1.3,
      'toys': 1.0,
      'books': 0.8,
      'other': 1.2
    }
    
    for (const [key, rate] of Object.entries(cpcRates)) {
      if (type.includes(key)) {
        return rate
      }
    }
    
    return 1.2
  }

  private extractPrice(product: ShopifyProduct): number {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => parseFloat(v.price)).filter(p => !isNaN(p))
      if (prices.length > 0) {
        return Math.min(...prices) // Prix minimum
      }
    }
    return 0
  }

  private calculatePotentialRevenue(volume: number, price: number, competition: string): number {
    const conversionRate = competition === 'low' ? 0.05 : competition === 'medium' ? 0.03 : 0.02
    return volume * conversionRate * price
  }

  private determineTrend(product: ShopifyProduct, estimatedVolume: number): 'up' | 'down' | 'stable' {
    const createdAt = new Date(product.created_at)
    const updatedAt = new Date(product.updated_at)
    const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    
    if (ageInDays < 30 && daysSinceUpdate < 7) return 'up'
    if (ageInDays < 90 && daysSinceUpdate < 30) return 'stable'
    return 'down'
  }

  private calculateDifficulty(competition: string, volume: number): number {
    let difficulty = 50 // Base difficulty pour Shopify
    
    if (competition === 'high') difficulty += 30
    else if (competition === 'medium') difficulty += 15
    
    if (volume > 3000) difficulty += 20
    else if (volume > 1000) difficulty += 10
    
    return Math.min(100, Math.max(0, difficulty))
  }

  private extractKeywordFromProduct(product: ShopifyProduct, originalQuery: string): string {
    // Priorité: tags > titre > type de produit
    const tags = product.tags ? product.tags.split(',').map(tag => tag.trim().toLowerCase()) : []
    const title = product.title.toLowerCase()
    const productType = product.product_type.toLowerCase()
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

  async getCollections(): Promise<ShopifyCollection[]> {
    try {
      const cacheKey = 'shopify:collections'
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      const response = await this.makeRequest<{ collections: ShopifyCollection[] }>('/collections.json')
      
      if (response.collections) {
        await cacheService.set(cacheKey, response.collections, 86400) // 24 heures
        return response.collections
      }

      return []

    } catch (error) {
      logger.error('Error getting Shopify collections:', error)
      return []
    }
  }

  async getProductsByCollection(collectionId: number, limit: number = 50): Promise<ShopifyProduct[]> {
    try {
      const cacheKey = `shopify:collection:${collectionId}:${limit}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      const response = await this.makeRequest<{ products: ShopifyProduct[] }>(`/collections/${collectionId}/products.json`, {
        limit: limit,
        fields: 'id,title,body_html,vendor,product_type,tags,handle,variants,options,images,created_at,updated_at'
      })

      const products = response.products || []
      await cacheService.set(cacheKey, products, 1800) // 30 minutes
      return products

    } catch (error) {
      logger.error('Error getting products by collection:', error)
      return []
    }
  }

  async getProductDetails(productId: number): Promise<ShopifyProduct | null> {
    try {
      const cacheKey = `shopify:product:${productId}`
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      const response = await this.makeRequest<{ product: ShopifyProduct }>(`/products/${productId}.json`)
      
      const product = response.product
      if (product) {
        await cacheService.set(cacheKey, product, 1800) // 30 minutes
      }

      return product || null

    } catch (error) {
      logger.error('Error getting product details:', error)
      return null
    }
  }

  async getRelatedKeywords(query: string): Promise<string[]> {
    try {
      const cacheKey = `shopify:related:${query}`
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

  async getTrendingKeywords(): Promise<Keyword[]> {
    try {
      const cacheKey = 'shopify:trending'
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return cached
      }

      // Rechercher des mots-clés populaires sur Shopify
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

export const shopifyAPI = new ShopifyAPI()
