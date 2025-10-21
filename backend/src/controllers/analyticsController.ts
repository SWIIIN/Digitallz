import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export const analyticsController = {
  async getDashboard(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { period = '30d' } = req.query

      const startDate = getStartDate(period as string)

      // Récupérer les statistiques générales
      const [
        totalSearches,
        totalKeywords,
        platformStats,
        recentSearches
      ] = await Promise.all([
        prisma.keywordSearch.count({
          where: {
            userId,
            createdAt: { gte: startDate }
          }
        }),
        prisma.keywordData.count({
          where: {
            keywordSearches: {
              some: { userId }
            }
          }
        }),
        getPlatformStats(userId, startDate),
        prisma.keywordSearch.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ])

      res.json({
        success: true,
        data: {
          totalSearches,
          totalKeywords,
          platformStats,
          recentSearches,
          period
        }
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération du dashboard:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du dashboard'
      })
    }
  },

  async getTrends(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { period = '30d', platform } = req.query

      const startDate = getStartDate(period as string)

      const trends = await prisma.keywordData.findMany({
        where: {
          platform: platform as string || undefined,
          keywordSearches: {
            some: { userId }
          },
          createdAt: { gte: startDate }
        },
        orderBy: { trendScore: 'desc' },
        take: 50
      })

      res.json({
        success: true,
        data: trends
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération des tendances:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des tendances'
      })
    }
  },

  async getPlatformStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { period = '30d' } = req.query

      const startDate = getStartDate(period as string)

      const stats = await getPlatformStats(userId, startDate)

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques de plateforme:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques de plateforme'
      })
    }
  },

  async getKeywordStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { period = '30d' } = req.query

      const startDate = getStartDate(period as string)

      const stats = await prisma.keywordData.groupBy({
        by: ['keyword'],
        where: {
          keywordSearches: {
            some: { userId }
          },
          createdAt: { gte: startDate }
        },
        _count: { keyword: true },
        _avg: {
          searchVolume: true,
          competition: true,
          cpc: true,
          trendScore: true,
          opportunityScore: true
        },
        orderBy: { _count: { keyword: 'desc' } },
        take: 20
      })

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques de mots-clés:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques de mots-clés'
      })
    }
  },

  async getPerformance(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { period = '30d' } = req.query

      const startDate = getStartDate(period as string)

      // Récupérer les performances par jour
      const dailyStats = await prisma.keywordSearch.groupBy({
        by: ['createdAt'],
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      })

      res.json({
        success: true,
        data: {
          dailyStats,
          period
        }
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération des performances:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des performances'
      })
    }
  },

  async trackEvent(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { event, data } = req.body

      await prisma.analytics.create({
        data: {
          userId,
          event,
          data: JSON.stringify(data)
        }
      })

      res.json({
        success: true,
        message: 'Événement enregistré avec succès'
      })
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de l\'événement:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'enregistrement de l\'événement'
      })
    }
  }
}

// Fonctions utilitaires
function getStartDate(period: string): Date {
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
}

async function getPlatformStats(userId: string, startDate: Date) {
  const stats = await prisma.keywordData.groupBy({
    by: ['platform'],
    where: {
      keywordSearches: {
        some: { userId }
      },
      createdAt: { gte: startDate }
    },
    _count: { platform: true },
    _avg: {
      searchVolume: true,
      competition: true,
      cpc: true,
      trendScore: true,
      opportunityScore: true
    }
  })

  return stats
}
