import { Request, Response } from 'express'
import { keywordService } from '../services/keywordService'
import { logger } from '../utils/logger'
import { formatNumber } from '../utils/helpers'

export class KeywordController {
  async searchKeywords(req: Request, res: Response) {
    try {
      const { keyword, platform, includeRelated, includeTrends } = req.body
      const userId = req.user?.id

      logger.info(`Keyword search: ${keyword} on ${platform}`, { userId })

      const result = await keywordService.searchKeywords({
        keyword,
        platform,
        includeRelated: includeRelated ?? true,
        includeTrends: includeTrends ?? true,
        userId,
      })

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      logger.error('Keyword search error:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche de mots-clés',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      })
    }
  }

  async getKeywordTrends(req: Request, res: Response) {
    try {
      const { keyword } = req.params
      const { platform, dateRange } = req.query

      logger.info(`Getting trends for: ${keyword} on ${platform}`)

      const trends = await keywordService.getKeywordTrends({
        keyword,
        platform: platform as string,
        dateRange: dateRange as string || '30d',
      })

      res.json({
        success: true,
        data: trends,
      })
    } catch (error) {
      logger.error('Get trends error:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des tendances',
      })
    }
  }

  async getPopularKeywords(req: Request, res: Response) {
    try {
      const { platform, limit } = req.query

      logger.info(`Getting popular keywords for platform: ${platform}`)

      const keywords = await keywordService.getPopularKeywords({
        platform: platform as string,
        limit: parseInt(limit as string) || 20,
      })

      res.json({
        success: true,
        data: keywords,
      })
    } catch (error) {
      logger.error('Get popular keywords error:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des mots-clés populaires',
      })
    }
  }

  async getKeywordSuggestions(req: Request, res: Response) {
    try {
      const { keyword, platform, limit } = req.query

      logger.info(`Getting suggestions for: ${keyword} on ${platform}`)

      const suggestions = await keywordService.getKeywordSuggestions({
        keyword: keyword as string,
        platform: platform as string,
        limit: parseInt(limit as string) || 10,
      })

      res.json({
        success: true,
        data: suggestions,
      })
    } catch (error) {
      logger.error('Get suggestions error:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des suggestions',
      })
    }
  }

  async getRecentSearches(req: Request, res: Response) {
    try {
      const userId = req.user?.id

      logger.info(`Getting recent searches for user: ${userId}`)

      const searches = await keywordService.getRecentSearches(userId)

      res.json({
        success: true,
        data: searches,
      })
    } catch (error) {
      logger.error('Get recent searches error:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des recherches récentes',
      })
    }
  }

  async getCompetitorAnalysis(req: Request, res: Response) {
    try {
      const { keyword } = req.params
      const { platform } = req.query

      logger.info(`Getting competitor analysis for: ${keyword} on ${platform}`)

      const analysis = await keywordService.getCompetitorAnalysis({
        keyword,
        platform: platform as string,
      })

      res.json({
        success: true,
        data: analysis,
      })
    } catch (error) {
      logger.error('Get competitor analysis error:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'analyse des concurrents',
      })
    }
  }

  async getKeywordDifficulty(req: Request, res: Response) {
    try {
      const { keyword } = req.params
      const { platform } = req.query

      logger.info(`Getting difficulty for: ${keyword} on ${platform}`)

      const difficulty = await keywordService.getKeywordDifficulty({
        keyword,
        platform: platform as string,
      })

      res.json({
        success: true,
        data: difficulty,
      })
    } catch (error) {
      logger.error('Get keyword difficulty error:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors du calcul de la difficulté',
      })
    }
  }

  async bulkAnalyzeKeywords(req: Request, res: Response) {
    try {
      const { keywords, platform } = req.body
      const userId = req.user?.id

      logger.info(`Bulk analysis for ${keywords.length} keywords on ${platform}`, { userId })

      const results = await keywordService.bulkAnalyzeKeywords({
        keywords,
        platform,
        userId,
      })

      res.json({
        success: true,
        data: results,
        summary: {
          totalKeywords: keywords.length,
          analyzedKeywords: results.length,
          avgSearchVolume: results.reduce((sum, r) => sum + r.searchVolume, 0) / results.length,
          topOpportunities: results
            .sort((a, b) => b.opportunityScore - a.opportunityScore)
            .slice(0, 5),
        },
      })
    } catch (error) {
      logger.error('Bulk analysis error:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'analyse en lot',
      })
    }
  }
}

export const keywordController = new KeywordController()
