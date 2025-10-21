import { PrismaClient } from '@prisma/client'
import { externalApiService } from './externalApiService'
import { cacheService } from './cacheService'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export const keywordService = {
  async searchKeywords(keyword: string, platforms: string[], limit: number) {
    try {
      // Vérifier le cache d'abord
      const cacheKey = `search:${keyword}:${platforms.join(',')}:${limit}`
      const cached = await cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      // Rechercher dans la base de données
      let results = await prisma.keywordData.findMany({
        where: {
          keyword: {
            contains: keyword,
            mode: 'insensitive'
          },
          platform: {
            in: platforms
          }
        },
        take: limit,
        orderBy: {
          opportunityScore: 'desc'
        }
      })

      // Si pas de résultats en base, faire appel aux APIs externes
      if (results.length === 0) {
        results = await externalApiService.searchKeywords(keyword, platforms)
        
        // Sauvegarder les nouveaux résultats
        if (results.length > 0) {
          await prisma.keywordData.createMany({
            data: results.map(result => ({
              keyword: result.keyword,
              platform: result.platform,
              searchVolume: result.searchVolume,
              competition: result.competition,
              cpc: result.cpc,
              trendScore: result.trendScore,
              difficultyScore: result.difficultyScore,
              opportunityScore: result.opportunityScore,
              relatedKeywords: JSON.stringify(result.relatedKeywords),
              trendData: JSON.stringify(result.trendData),
              categoryData: JSON.stringify(result.categoryData)
            }))
          })
        }
      }

      // Mettre en cache pour 1 heure
      await cacheService.set(cacheKey, results, 3600)

      return results
    } catch (error) {
      logger.error('Erreur lors de la recherche de mots-clés:', error)
      throw error
    }
  },

  async getTrends(platform?: string, period: string = '30d') {
    try {
      const cacheKey = `trends:${platform || 'all'}:${period}`
      const cached = await cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const whereClause = platform ? { platform } : {}
      
      const trends = await prisma.keywordData.findMany({
        where: whereClause,
        orderBy: {
          trendScore: 'desc'
        },
        take: 50
      })

      // Analyser les tendances
      const analysis = this.analyzeTrends(trends)

      // Mettre en cache pour 30 minutes
      await cacheService.set(cacheKey, analysis, 1800)

      return analysis
    } catch (error) {
      logger.error('Erreur lors de la récupération des tendances:', error)
      throw error
    }
  },

  async getAvailablePlatforms() {
    try {
      const platforms = await prisma.keywordData.findMany({
        select: {
          platform: true
        },
        distinct: ['platform']
      })

      return platforms.map(p => p.platform)
    } catch (error) {
      logger.error('Erreur lors de la récupération des plateformes:', error)
      throw error
    }
  },

  async getSearchHistory(userId: string, limit: number, offset: number) {
    try {
      const history = await prisma.keywordSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return history
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'historique:', error)
      throw error
    }
  },

  async addToFavorites(userId: string, keyword: string, platform: string) {
    try {
      // Vérifier si le mot-clé existe
      const keywordData = await prisma.keywordData.findFirst({
        where: { keyword, platform }
      })

      if (!keywordData) {
        throw new Error('Mot-clé non trouvé')
      }

      // Ajouter aux favoris (implémentation simplifiée)
      const favorite = await prisma.keywordSearch.create({
        data: {
          userId,
          keyword,
          platform,
          results: JSON.stringify(keywordData)
        }
      })

      return favorite
    } catch (error) {
      logger.error('Erreur lors de l\'ajout aux favoris:', error)
      throw error
    }
  },

  async removeFromFavorites(userId: string, id: string) {
    try {
      await prisma.keywordSearch.delete({
        where: { id, userId }
      })
    } catch (error) {
      logger.error('Erreur lors de la suppression des favoris:', error)
      throw error
    }
  },

  async getFavorites(userId: string, limit: number, offset: number) {
    try {
      const favorites = await prisma.keywordSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return favorites
    } catch (error) {
      logger.error('Erreur lors de la récupération des favoris:', error)
      throw error
    }
  },

  async exportKeywords(userId: string, keywords: any[], format: string) {
    try {
      // Implémentation simplifiée de l'export
      const exportData = {
        userId,
        keywords,
        format,
        exportedAt: new Date().toISOString()
      }

      return exportData
    } catch (error) {
      logger.error('Erreur lors de l\'export des mots-clés:', error)
      throw error
    }
  },

  async getAnalytics(userId: string, period: string) {
    try {
      const startDate = this.getStartDate(period)
      
      const analytics = await prisma.analytics.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      })

      return this.processAnalytics(analytics)
    } catch (error) {
      logger.error('Erreur lors de la récupération des analytics:', error)
      throw error
    }
  },

  // Méthodes pour le data processor
  async getRawKeywordData(limit: number) {
    try {
      const data = await prisma.keywordData.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' }
      })

      return data
    } catch (error) {
      logger.error('Erreur lors de la récupération des données brutes:', error)
      throw error
    }
  },

  async getProcessedKeywordData(platform?: string) {
    try {
      const whereClause = platform ? { platform } : {}
      
      const data = await prisma.keywordData.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      })

      return data
    } catch (error) {
      logger.error('Erreur lors de la récupération des données traitées:', error)
      throw error
    }
  },

  async saveProcessedData(data: any[]) {
    try {
      await prisma.keywordData.createMany({
        data: data.map(item => ({
          keyword: item.keyword,
          platform: item.platform,
          searchVolume: item.search_volume,
          competition: item.competition,
          cpc: item.cpc,
          trendScore: item.trend_score,
          difficultyScore: item.difficulty_score,
          opportunityScore: item.opportunity_score,
          relatedKeywords: JSON.stringify(item.related_keywords),
          trendData: JSON.stringify(item.trend_data),
          categoryData: JSON.stringify(item.category_data)
        }))
      })
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde des données traitées:', error)
      throw error
    }
  },

  // Méthodes utilitaires
  analyzeTrends(data: any[]) {
    const total = data.length
    const avgTrendScore = data.reduce((sum, item) => sum + item.trendScore, 0) / total
    const topTrending = data.slice(0, 10)
    
    return {
      total,
      avgTrendScore,
      topTrending,
      period: '30d'
    }
  },

  getStartDate(period: string): Date {
    const now = new Date()
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  },

  processAnalytics(data: any[]) {
    const total = data.length
    const events = data.reduce((acc, item) => {
      acc[item.event] = (acc[item.event] || 0) + 1
      return acc
    }, {})

    return {
      total,
      events,
      period: '30d'
    }
  }
}