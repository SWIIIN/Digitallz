import { Request, Response } from 'express'
import { keywordService } from '../services/keywordService'
import { logger } from '../utils/logger'

export const keywordController = {
  async searchKeywords(req: Request, res: Response) {
    try {
      const { keyword, platforms, limit } = req.query
      
      const results = await keywordService.searchKeywords(
        keyword as string,
        platforms as string[],
        parseInt(limit as string) || 10
      )
      
      res.json({
        success: true,
        data: results,
        meta: {
          keyword,
          platforms,
          count: results.length
        }
      })
    } catch (error) {
      logger.error('Erreur lors de la recherche de mots-clés:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche de mots-clés'
      })
    }
  },

  async getTrends(req: Request, res: Response) {
    try {
      const { platform, period } = req.query
      
      const trends = await keywordService.getTrends(
        platform as string,
        period as string || '30d'
      )
      
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

  async getPlatforms(req: Request, res: Response) {
    try {
      const platforms = await keywordService.getAvailablePlatforms()
      
      res.json({
        success: true,
        data: platforms
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération des plateformes:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des plateformes'
      })
    }
  },

  async getSearchHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { limit, offset } = req.query
      
      const history = await keywordService.getSearchHistory(
        userId,
        parseInt(limit as string) || 20,
        parseInt(offset as string) || 0
      )
      
      res.json({
        success: true,
        data: history
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'historique:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'historique'
      })
    }
  },

  async addToFavorites(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { keyword, platform } = req.body
      
      const favorite = await keywordService.addToFavorites(userId, keyword, platform)
      
      res.json({
        success: true,
        data: favorite
      })
    } catch (error) {
      logger.error('Erreur lors de l\'ajout aux favoris:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'ajout aux favoris'
      })
    }
  },

  async removeFromFavorites(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { id } = req.params
      
      await keywordService.removeFromFavorites(userId, id)
      
      res.json({
        success: true,
        message: 'Favori supprimé avec succès'
      })
    } catch (error) {
      logger.error('Erreur lors de la suppression des favoris:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression des favoris'
      })
    }
  },

  async getFavorites(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { limit, offset } = req.query
      
      const favorites = await keywordService.getFavorites(
        userId,
        parseInt(limit as string) || 20,
        parseInt(offset as string) || 0
      )
      
      res.json({
        success: true,
        data: favorites
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération des favoris:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des favoris'
      })
    }
  },

  async exportKeywords(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { keywords, format } = req.body
      
      const exportData = await keywordService.exportKeywords(
        userId,
        keywords,
        format || 'csv'
      )
      
      res.json({
        success: true,
        data: exportData
      })
    } catch (error) {
      logger.error('Erreur lors de l\'export des mots-clés:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'export des mots-clés'
      })
    }
  },

  async getAnalytics(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { period } = req.query
      
      const analytics = await keywordService.getAnalytics(
        userId,
        period as string || '30d'
      )
      
      res.json({
        success: true,
        data: analytics
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération des analytics:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des analytics'
      })
    }
  },

  // Routes pour le data processor
  async getRawData(req: Request, res: Response) {
    try {
      const { limit } = req.query
      
      const data = await keywordService.getRawKeywordData(
        parseInt(limit as string) || 100
      )
      
      res.json({
        success: true,
        data
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération des données brutes:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données brutes'
      })
    }
  },

  async getProcessedData(req: Request, res: Response) {
    try {
      const { platform } = req.query
      
      const data = await keywordService.getProcessedKeywordData(
        platform as string
      )
      
      res.json({
        success: true,
        data
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération des données traitées:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données traitées'
      })
    }
  },

  async saveProcessedData(req: Request, res: Response) {
    try {
      const { data } = req.body
      
      await keywordService.saveProcessedData(data)
      
      res.json({
        success: true,
        message: 'Données traitées sauvegardées avec succès'
      })
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde des données traitées:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la sauvegarde des données traitées'
      })
    }
  }
}