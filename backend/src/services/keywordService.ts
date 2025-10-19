import { externalApiService } from './externalApiService'
import { keywordRepository } from '../repositories/keywordRepository'
import { cacheService } from './cacheService'
import { analyticsService } from './analyticsService'
import { integrationService } from '../integrations/IntegrationService'
import { logger } from '../utils/logger'
import { 
  KeywordData, 
  SearchParams, 
  SearchResult, 
  TrendData, 
  KeywordSuggestion, 
  CompetitorAnalysis,
  BulkAnalysisResult,
  KeywordDifficulty,
  PopularKeyword
} from '../models/Keyword'

export class KeywordService {
  async searchKeywords(params: SearchParams): Promise<SearchResult> {
    const { keyword, platform, includeRelated, includeTrends, userId } = params

    try {
      logger.info(`Searching keywords: ${keyword} on ${platform}`, { userId })

      // Vérifier le cache d'abord
      const cacheKey = `keyword:${keyword}:${platform}`
      const cached = await cacheService.get(cacheKey)
      
      if (cached) {
        logger.info(`Cache hit for keyword: ${keyword}`)
        return cached
      }

      // Recherche dans la base de données
      let keywordData = await keywordRepository.findByKeyword(keyword, platform)

      // Si pas trouvé, chercher via API externe
      if (!keywordData) {
        logger.info(`Keyword not found in DB, fetching from external API: ${keyword}`)
        keywordData = await externalApiService.searchKeyword(keyword, platform)
        
        // Sauvegarder en base
        await keywordRepository.create(keywordData)
      }

      // Enrichir avec des données supplémentaires
      const result: SearchResult = {
        keyword: keywordData.keyword,
        platform: keywordData.platform,
        data: keywordData,
        relatedKeywords: [],
        trends: [],
        analysis: {
          totalKeywords: 1,
          avgSearchVolume: keywordData.searchVolume,
          avgCompetition: keywordData.competition,
          topOpportunities: [keywordData],
          trendingKeywords: keywordData.trendScore > 0.7 ? [keywordData] : [],
        }
      }

      // Mots-clés liés
      if (includeRelated) {
        result.relatedKeywords = await this.getRelatedKeywords(keyword, platform)
      }

      // Tendances
      if (includeTrends) {
        result.trends = await this.getKeywordTrends(keyword, platform)
      }

      // Mettre en cache
      await cacheService.set(cacheKey, result, 3600) // 1 heure

      // Enregistrer la recherche
      if (userId) {
        await keywordRepository.logSearch({
          userId,
          keyword,
          platform,
          results: JSON.stringify(result)
        })
      }

      // Analytics
      await analyticsService.trackKeywordSearch({
        keyword,
        platform,
        userId,
        timestamp: new Date()
      })

      return result
    } catch (error) {
      logger.error(`Error searching keywords: ${keyword}`, error)
      throw error
    }
  }

  async getKeywordTrends(keyword: string, platform: string, dateRange: string = '30d'): Promise<TrendData[]> {
    try {
      const cacheKey = `trends:${keyword}:${platform}:${dateRange}`
      const cached = await cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const trends = await externalApiService.getKeywordTrends(keyword, platform, dateRange)
      
      // Mettre en cache
      await cacheService.set(cacheKey, trends, 1800) // 30 minutes
      
      return trends
    } catch (error) {
      logger.error(`Error getting trends for ${keyword}:`, error)
      throw error
    }
  }

  async getRelatedKeywords(keyword: string, platform: string): Promise<KeywordData[]> {
    try {
      const cacheKey = `related:${keyword}:${platform}`
      const cached = await cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const relatedKeywords = await externalApiService.getRelatedKeywords(keyword, platform, 10)
      
      // Récupérer les données complètes pour chaque mot-clé lié
      const relatedData: KeywordData[] = []
      for (const relatedKeyword of relatedKeywords) {
        try {
          const data = await this.searchKeywords({
            keyword: relatedKeyword,
            platform,
            includeRelated: false,
            includeTrends: false,
          })
          relatedData.push(data.data)
        } catch (error) {
          logger.warn(`Error fetching related keyword ${relatedKeyword}:`, error)
        }
      }

      // Mettre en cache
      await cacheService.set(cacheKey, relatedData, 7200) // 2 heures
      
      return relatedData
    } catch (error) {
      logger.error(`Error getting related keywords for ${keyword}:`, error)
      throw error
    }
  }

  async getPopularKeywords(platform?: string, limit: number = 20): Promise<PopularKeyword[]> {
    try {
      const cacheKey = `popular:${platform || 'all'}:${limit}`
      const cached = await cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const keywords = await keywordRepository.getPopularKeywords(platform, limit)
      
      const popularKeywords: PopularKeyword[] = keywords.map((kw, index) => ({
        keyword: kw.keyword,
        platform: kw.platform,
        searchVolume: kw.searchVolume,
        competition: kw.competition,
        trend: this.determineTrend(kw.trendData),
        category: kw.categoryData?.category || 'general',
        rank: index + 1,
      }))

      // Mettre en cache
      await cacheService.set(cacheKey, popularKeywords, 600) // 10 minutes
      
      return popularKeywords
    } catch (error) {
      logger.error(`Error getting popular keywords:`, error)
      throw error
    }
  }

  async getKeywordSuggestions(keyword: string, platform: string, limit: number = 10): Promise<KeywordSuggestion[]> {
    try {
      const cacheKey = `suggestions:${keyword}:${platform}:${limit}`
      const cached = await cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const suggestions = await externalApiService.getKeywordSuggestions(keyword, platform, limit)
      
      // Mettre en cache
      await cacheService.set(cacheKey, suggestions, 300) // 5 minutes
      
      return suggestions
    } catch (error) {
      logger.error(`Error getting suggestions for ${keyword}:`, error)
      throw error
    }
  }

  async getRecentSearches(userId: string): Promise<any[]> {
    try {
      return await keywordRepository.getRecentSearches(userId, 10)
    } catch (error) {
      logger.error(`Error getting recent searches for user ${userId}:`, error)
      throw error
    }
  }

  async getCompetitorAnalysis(keyword: string, platform: string): Promise<CompetitorAnalysis> {
    try {
      const cacheKey = `competitors:${keyword}:${platform}`
      const cached = await cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const competitors = await externalApiService.getCompetitorAnalysis(keyword, platform)
      
      // Analyser la part de marché
      const marketShare = this.calculateMarketShare(competitors)
      
      // Analyser les prix
      const pricing = this.calculatePricing(competitors)
      
      // Générer des recommandations
      const recommendations = this.generateRecommendations(competitors, marketShare, pricing)

      const analysis: CompetitorAnalysis = {
        keyword,
        platform,
        competitors,
        marketShare,
        pricing,
        recommendations,
      }

      // Mettre en cache
      await cacheService.set(cacheKey, analysis, 3600) // 1 heure
      
      return analysis
    } catch (error) {
      logger.error(`Error getting competitor analysis for ${keyword}:`, error)
      throw error
    }
  }

  async getKeywordDifficulty(keyword: string, platform: string): Promise<KeywordDifficulty> {
    try {
      const cacheKey = `difficulty:${keyword}:${platform}`
      const cached = await cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const keywordData = await this.searchKeywords({
        keyword,
        platform,
        includeRelated: false,
        includeTrends: true,
      })

      const difficulty = this.calculateKeywordDifficulty(keywordData.data)
      
      // Mettre en cache
      await cacheService.set(cacheKey, difficulty, 1800) // 30 minutes
      
      return difficulty
    } catch (error) {
      logger.error(`Error getting keyword difficulty for ${keyword}:`, error)
      throw error
    }
  }

  async bulkAnalyzeKeywords(keywords: string[], platform: string, userId?: string): Promise<BulkAnalysisResult> {
    try {
      logger.info(`Bulk analyzing ${keywords.length} keywords on ${platform}`, { userId })

      const results: KeywordData[] = []
      const errors: string[] = []

      // Analyser chaque mot-clé
      for (const keyword of keywords) {
        try {
          const result = await this.searchKeywords({
            keyword,
            platform,
            includeRelated: false,
            includeTrends: false,
            userId,
          })
          results.push(result.data)
        } catch (error) {
          logger.warn(`Error analyzing keyword ${keyword}:`, error)
          errors.push(keyword)
        }
      }

      // Calculer les statistiques
      const summary = this.calculateBulkSummary(results)

      const bulkResult: BulkAnalysisResult = {
        keywords: results,
        summary: {
          ...summary,
          recommendations: this.generateBulkRecommendations(results, errors),
        },
      }

      // Analytics
      await analyticsService.trackBulkAnalysis({
        keywords,
        platform,
        userId,
        resultsCount: results.length,
        errorsCount: errors.length,
        timestamp: new Date()
      })

      return bulkResult
    } catch (error) {
      logger.error(`Error in bulk analysis:`, error)
      throw error
    }
  }

  private determineTrend(trendData: any[]): 'up' | 'down' | 'stable' {
    if (!trendData || trendData.length < 2) return 'stable'
    
    const recent = trendData.slice(-7) // Dernière semaine
    const older = trendData.slice(-14, -7) // Semaine précédente
    
    const recentAvg = recent.reduce((sum, d) => sum + d.score, 0) / recent.length
    const olderAvg = older.reduce((sum, d) => sum + d.score, 0) / older.length
    
    const change = (recentAvg - olderAvg) / olderAvg
    
    if (change > 0.1) return 'up'
    if (change < -0.1) return 'down'
    return 'stable'
  }

  private calculateMarketShare(competitors: any[]): any[] {
    const totalVolume = competitors.reduce((sum, c) => sum + (c.volume || 0), 0)
    
    return competitors.map(competitor => ({
      competitor: competitor.name,
      share: totalVolume > 0 ? (competitor.volume || 0) / totalVolume : 0,
      trend: this.determineTrend(competitor.trendData),
    }))
  }

  private calculatePricing(competitors: any[]): any {
    const prices = competitors
      .map(c => c.price)
      .filter(p => p && p > 0)
      .sort((a, b) => a - b)

    if (prices.length === 0) {
      return {
        min: 0,
        max: 0,
        average: 0,
        median: 0,
        distribution: [],
      }
    }

    const min = prices[0]
    const max = prices[prices.length - 1]
    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const median = prices[Math.floor(prices.length / 2)]

    // Distribution des prix
    const distribution = this.calculatePriceDistribution(prices)

    return {
      min,
      max,
      average: Math.round(average * 100) / 100,
      median,
      distribution,
    }
  }

  private calculatePriceDistribution(prices: number[]): any[] {
    const ranges = [
      { min: 0, max: 10, label: '0-10€' },
      { min: 10, max: 25, label: '10-25€' },
      { min: 25, max: 50, label: '25-50€' },
      { min: 50, max: 100, label: '50-100€' },
      { min: 100, max: Infinity, label: '100€+' },
    ]

    return ranges.map(range => {
      const count = prices.filter(p => p >= range.min && p < range.max).length
      return {
        range: range.label,
        count,
        percentage: Math.round((count / prices.length) * 100),
      }
    })
  }

  private generateRecommendations(competitors: any[], marketShare: any[], pricing: any): string[] {
    const recommendations: string[] = []

    // Recommandations basées sur la concurrence
    if (competitors.length < 5) {
      recommendations.push('Faible concurrence - excellente opportunité')
    } else if (competitors.length > 20) {
      recommendations.push('Concurrence élevée - considérez des niches plus spécifiques')
    }

    // Recommandations basées sur les prix
    if (pricing.average < 20) {
      recommendations.push('Marché à prix bas - visez le volume')
    } else if (pricing.average > 100) {
      recommendations.push('Marché premium - mettez l\'accent sur la qualité')
    }

    // Recommandations basées sur la part de marché
    const topCompetitor = marketShare[0]
    if (topCompetitor && topCompetitor.share > 0.5) {
      recommendations.push('Un concurrent domine le marché - différenciez-vous')
    }

    return recommendations
  }

  private calculateKeywordDifficulty(keywordData: KeywordData): KeywordDifficulty {
    const { searchVolume, competition, cpc, trendScore } = keywordData

    const factors = {
      searchVolume,
      competition,
      cpc,
      trendScore,
    }

    const score = {
      overall: keywordData.difficultyScore,
      searchVolume: Math.min(searchVolume / 10000, 1),
      competition: competition,
      cpc: Math.min(cpc / 10, 1),
      trend: trendScore,
    }

    const recommendations = this.generateDifficultyRecommendations(score, factors)

    return {
      keyword: keywordData.keyword,
      platform: keywordData.platform,
      difficulty: keywordData.difficultyScore,
      factors,
      recommendations,
      score,
    }
  }

  private generateDifficultyRecommendations(score: any, factors: any): string[] {
    const recommendations: string[] = []

    if (score.overall > 0.8) {
      recommendations.push('Difficulté très élevée - considérez des mots-clés plus spécifiques')
    } else if (score.overall < 0.3) {
      recommendations.push('Faible difficulté - excellente opportunité')
    }

    if (score.competition > 0.8) {
      recommendations.push('Concurrence intense - différenciez votre offre')
    }

    if (score.cpc > 0.7) {
      recommendations.push('CPC élevé - budget publicitaire important nécessaire')
    }

    if (factors.searchVolume < 100) {
      recommendations.push('Volume de recherche faible - vérifiez la pertinence')
    }

    return recommendations
  }

  private calculateBulkSummary(results: KeywordData[]): any {
    if (results.length === 0) {
      return {
        totalKeywords: 0,
        analyzedKeywords: 0,
        avgSearchVolume: 0,
        avgCompetition: 0,
        topOpportunities: [],
      }
    }

    const avgSearchVolume = results.reduce((sum, r) => sum + r.searchVolume, 0) / results.length
    const avgCompetition = results.reduce((sum, r) => sum + r.competition, 0) / results.length

    const topOpportunities = results
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 5)

    return {
      totalKeywords: results.length,
      analyzedKeywords: results.length,
      avgSearchVolume: Math.round(avgSearchVolume),
      avgCompetition: Math.round(avgCompetition * 100) / 100,
      topOpportunities,
    }
  }

  private generateBulkRecommendations(results: KeywordData[], errors: string[]): string[] {
    const recommendations: string[] = []

    if (errors.length > 0) {
      recommendations.push(`${errors.length} mots-clés n'ont pas pu être analysés`)
    }

    const highOpportunity = results.filter(r => r.opportunityScore > 0.7)
    if (highOpportunity.length > 0) {
      recommendations.push(`${highOpportunity.length} mots-clés présentent de fortes opportunités`)
    }

    const lowCompetition = results.filter(r => r.competition < 0.3)
    if (lowCompetition.length > 0) {
      recommendations.push(`${lowCompetition.length} mots-clés ont une faible concurrence`)
    }

    const trending = results.filter(r => r.trendScore > 0.7)
    if (trending.length > 0) {
      recommendations.push(`${trending.length} mots-clés sont en tendance`)
    }

    return recommendations
  }
}

export const keywordService = new KeywordService()
