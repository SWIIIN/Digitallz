import axios from 'axios'
import { config } from '../config'
import { logger } from '../utils/logger'

export const externalApiService = {
  async searchKeywords(keyword: string, platforms: string[]) {
    const results = []
    
    for (const platform of platforms) {
      try {
        let platformResults = []
        
        switch (platform.toLowerCase()) {
          case 'amazon':
            platformResults = await this.searchAmazon(keyword)
            break
          case 'etsy':
            platformResults = await this.searchEtsy(keyword)
            break
          case 'ebay':
            platformResults = await this.searchEbay(keyword)
            break
          default:
            logger.warn(`Plateforme non supportée: ${platform}`)
        }
        
        results.push(...platformResults)
      } catch (error) {
        logger.error(`Erreur lors de la recherche sur ${platform}:`, error)
      }
    }
    
    return results
  },

  async searchAmazon(keyword: string) {
    try {
      // Simulation d'appel API Amazon
      const response = await axios.get('https://api.amazon.com/keywords/search', {
        params: {
          keyword,
          include_metrics: true
        },
        headers: {
          'Authorization': `Bearer ${config.amazon.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      return response.data.results || []
    } catch (error) {
      logger.error('Erreur API Amazon:', error)
      // Retourner des données simulées en cas d'erreur
      return this.getMockAmazonData(keyword)
    }
  },

  async searchEtsy(keyword: string) {
    try {
      // Simulation d'appel API Etsy
      const response = await axios.get('https://openapi.etsy.com/v2/keywords/search', {
        params: {
          keyword,
          include_metrics: true
        },
        headers: {
          'Authorization': `Bearer ${config.etsy.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      return response.data.results || []
    } catch (error) {
      logger.error('Erreur API Etsy:', error)
      // Retourner des données simulées en cas d'erreur
      return this.getMockEtsyData(keyword)
    }
  },

  async searchEbay(keyword: string) {
    try {
      // Simulation d'appel API eBay
      const response = await axios.get('https://api.ebay.com/keywords/search', {
        params: {
          keyword,
          include_metrics: true
        },
        headers: {
          'Authorization': `Bearer ${config.ebay.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      return response.data.results || []
    } catch (error) {
      logger.error('Erreur API eBay:', error)
      // Retourner des données simulées en cas d'erreur
      return this.getMockEbayData(keyword)
    }
  },

  // Données simulées pour les tests
  getMockAmazonData(keyword: string) {
    return [{
      keyword,
      platform: 'amazon',
      searchVolume: Math.floor(Math.random() * 10000) + 1000,
      competition: Math.random(),
      cpc: Math.random() * 5,
      trendScore: Math.random(),
      difficultyScore: Math.random(),
      opportunityScore: Math.random(),
      relatedKeywords: [`${keyword} course`, `${keyword} tutorial`, `${keyword} guide`],
      trendData: { trend: 'up', change: Math.random() * 20 },
      categoryData: { category: 'Digital Products', subcategory: 'Courses' }
    }]
  },

  getMockEtsyData(keyword: string) {
    return [{
      keyword,
      platform: 'etsy',
      searchVolume: Math.floor(Math.random() * 5000) + 500,
      competition: Math.random() * 0.8,
      cpc: Math.random() * 3,
      trendScore: Math.random(),
      difficultyScore: Math.random(),
      opportunityScore: Math.random(),
      relatedKeywords: [`${keyword} template`, `${keyword} design`, `${keyword} printable`],
      trendData: { trend: 'up', change: Math.random() * 15 },
      categoryData: { category: 'Digital Downloads', subcategory: 'Templates' }
    }]
  },

  getMockEbayData(keyword: string) {
    return [{
      keyword,
      platform: 'ebay',
      searchVolume: Math.floor(Math.random() * 8000) + 800,
      competition: Math.random() * 0.9,
      cpc: Math.random() * 4,
      trendScore: Math.random(),
      difficultyScore: Math.random(),
      opportunityScore: Math.random(),
      relatedKeywords: [`${keyword} software`, `${keyword} app`, `${keyword} tool`],
      trendData: { trend: 'up', change: Math.random() * 18 },
      categoryData: { category: 'Software', subcategory: 'Applications' }
    }]
  }
}