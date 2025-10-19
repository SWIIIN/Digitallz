import { PrismaClient } from '@prisma/client'
import { KeywordData, RecentSearch } from '../models/Keyword'
import { logger } from '../utils/logger'

export class KeywordRepository {
  private prisma = new PrismaClient()

  async findByKeyword(keyword: string, platform: string): Promise<KeywordData | null> {
    try {
      const result = await this.prisma.keywordData.findFirst({
        where: {
          keyword: keyword.toLowerCase(),
          platform,
        },
      })

      if (!result) return null

      return {
        id: result.id,
        keyword: result.keyword,
        platform: result.platform,
        searchVolume: result.searchVolume,
        competition: result.competition,
        cpc: result.cpc,
        trendScore: result.trendScore,
        difficultyScore: result.difficultyScore,
        opportunityScore: result.opportunityScore,
        relatedKeywords: result.relatedKeywords ? JSON.parse(result.relatedKeywords) : [],
        trendData: result.trendData ? JSON.parse(result.trendData) : [],
        categoryData: result.categoryData ? JSON.parse(result.categoryData) : undefined,
        lastUpdated: result.lastUpdated,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }
    } catch (error) {
      logger.error(`Error finding keyword ${keyword} on ${platform}:`, error)
      throw error
    }
  }

  async create(keywordData: KeywordData): Promise<KeywordData> {
    try {
      const result = await this.prisma.keywordData.create({
        data: {
          keyword: keywordData.keyword.toLowerCase(),
          platform: keywordData.platform,
          searchVolume: keywordData.searchVolume,
          competition: keywordData.competition,
          cpc: keywordData.cpc,
          trendScore: keywordData.trendScore,
          difficultyScore: keywordData.difficultyScore,
          opportunityScore: keywordData.opportunityScore,
          relatedKeywords: keywordData.relatedKeywords ? JSON.stringify(keywordData.relatedKeywords) : null,
          trendData: keywordData.trendData ? JSON.stringify(keywordData.trendData) : null,
          categoryData: keywordData.categoryData ? JSON.stringify(keywordData.categoryData) : null,
          lastUpdated: keywordData.lastUpdated,
        },
      })

      return {
        id: result.id,
        keyword: result.keyword,
        platform: result.platform,
        searchVolume: result.searchVolume,
        competition: result.competition,
        cpc: result.cpc,
        trendScore: result.trendScore,
        difficultyScore: result.difficultyScore,
        opportunityScore: result.opportunityScore,
        relatedKeywords: result.relatedKeywords ? JSON.parse(result.relatedKeywords) : [],
        trendData: result.trendData ? JSON.parse(result.trendData) : [],
        categoryData: result.categoryData ? JSON.parse(result.categoryData) : undefined,
        lastUpdated: result.lastUpdated,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }
    } catch (error) {
      logger.error(`Error creating keyword data:`, error)
      throw error
    }
  }

  async update(keywordData: KeywordData): Promise<KeywordData> {
    try {
      const result = await this.prisma.keywordData.update({
        where: {
          id: keywordData.id!,
        },
        data: {
          searchVolume: keywordData.searchVolume,
          competition: keywordData.competition,
          cpc: keywordData.cpc,
          trendScore: keywordData.trendScore,
          difficultyScore: keywordData.difficultyScore,
          opportunityScore: keywordData.opportunityScore,
          relatedKeywords: keywordData.relatedKeywords ? JSON.stringify(keywordData.relatedKeywords) : null,
          trendData: keywordData.trendData ? JSON.stringify(keywordData.trendData) : null,
          categoryData: keywordData.categoryData ? JSON.stringify(keywordData.categoryData) : null,
          lastUpdated: keywordData.lastUpdated,
        },
      })

      return {
        id: result.id,
        keyword: result.keyword,
        platform: result.platform,
        searchVolume: result.searchVolume,
        competition: result.competition,
        cpc: result.cpc,
        trendScore: result.trendScore,
        difficultyScore: result.difficultyScore,
        opportunityScore: result.opportunityScore,
        relatedKeywords: result.relatedKeywords ? JSON.parse(result.relatedKeywords) : [],
        trendData: result.trendData ? JSON.parse(result.trendData) : [],
        categoryData: result.categoryData ? JSON.parse(result.categoryData) : undefined,
        lastUpdated: result.lastUpdated,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }
    } catch (error) {
      logger.error(`Error updating keyword data:`, error)
      throw error
    }
  }

  async logSearch(params: {
    userId: string
    keyword: string
    platform: string
    results: string
  }): Promise<RecentSearch> {
    try {
      const result = await this.prisma.keywordSearch.create({
        data: {
          userId: params.userId,
          keyword: params.keyword.toLowerCase(),
          platform: params.platform,
          results: params.results,
        },
      })

      return {
        id: result.id,
        userId: result.userId,
        keyword: result.keyword,
        platform: result.platform,
        results: JSON.parse(result.results),
        createdAt: result.createdAt,
      }
    } catch (error) {
      logger.error(`Error logging search:`, error)
      throw error
    }
  }

  async getRecentSearches(userId: string, limit: number = 10): Promise<RecentSearch[]> {
    try {
      const results = await this.prisma.keywordSearch.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })

      return results.map(result => ({
        id: result.id,
        userId: result.userId,
        keyword: result.keyword,
        platform: result.platform,
        results: JSON.parse(result.results),
        createdAt: result.createdAt,
      }))
    } catch (error) {
      logger.error(`Error getting recent searches for user ${userId}:`, error)
      throw error
    }
  }

  async getPopularKeywords(platform?: string, limit: number = 20): Promise<KeywordData[]> {
    try {
      const whereClause = platform ? { platform } : {}
      
      const results = await this.prisma.keywordData.findMany({
        where: whereClause,
        orderBy: {
          searchVolume: 'desc',
        },
        take: limit,
      })

      return results.map(result => ({
        id: result.id,
        keyword: result.keyword,
        platform: result.platform,
        searchVolume: result.searchVolume,
        competition: result.competition,
        cpc: result.cpc,
        trendScore: result.trendScore,
        difficultyScore: result.difficultyScore,
        opportunityScore: result.opportunityScore,
        relatedKeywords: result.relatedKeywords ? JSON.parse(result.relatedKeywords) : [],
        trendData: result.trendData ? JSON.parse(result.trendData) : [],
        categoryData: result.categoryData ? JSON.parse(result.categoryData) : undefined,
        lastUpdated: result.lastUpdated,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }))
    } catch (error) {
      logger.error(`Error getting popular keywords:`, error)
      throw error
    }
  }

  async getTrendingKeywords(platform?: string, limit: number = 20): Promise<KeywordData[]> {
    try {
      const whereClause = platform ? { platform } : {}
      
      const results = await this.prisma.keywordData.findMany({
        where: {
          ...whereClause,
          trendScore: {
            gt: 0.7,
          },
        },
        orderBy: {
          trendScore: 'desc',
        },
        take: limit,
      })

      return results.map(result => ({
        id: result.id,
        keyword: result.keyword,
        platform: result.platform,
        searchVolume: result.searchVolume,
        competition: result.competition,
        cpc: result.cpc,
        trendScore: result.trendScore,
        difficultyScore: result.difficultyScore,
        opportunityScore: result.opportunityScore,
        relatedKeywords: result.relatedKeywords ? JSON.parse(result.relatedKeywords) : [],
        trendData: result.trendData ? JSON.parse(result.trendData) : [],
        categoryData: result.categoryData ? JSON.parse(result.categoryData) : undefined,
        lastUpdated: result.lastUpdated,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }))
    } catch (error) {
      logger.error(`Error getting trending keywords:`, error)
      throw error
    }
  }

  async getTopOpportunities(platform?: string, limit: number = 20): Promise<KeywordData[]> {
    try {
      const whereClause = platform ? { platform } : {}
      
      const results = await this.prisma.keywordData.findMany({
        where: {
          ...whereClause,
          opportunityScore: {
            gt: 0.7,
          },
        },
        orderBy: {
          opportunityScore: 'desc',
        },
        take: limit,
      })

      return results.map(result => ({
        id: result.id,
        keyword: result.keyword,
        platform: result.platform,
        searchVolume: result.searchVolume,
        competition: result.competition,
        cpc: result.cpc,
        trendScore: result.trendScore,
        difficultyScore: result.difficultyScore,
        opportunityScore: result.opportunityScore,
        relatedKeywords: result.relatedKeywords ? JSON.parse(result.relatedKeywords) : [],
        trendData: result.trendData ? JSON.parse(result.trendData) : [],
        categoryData: result.categoryData ? JSON.parse(result.categoryData) : undefined,
        lastUpdated: result.lastUpdated,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }))
    } catch (error) {
      logger.error(`Error getting top opportunities:`, error)
      throw error
    }
  }

  async getKeywordStats(platform?: string): Promise<any> {
    try {
      const whereClause = platform ? { platform } : {}
      
      const stats = await this.prisma.keywordData.aggregate({
        where: whereClause,
        _count: {
          id: true,
        },
        _avg: {
          searchVolume: true,
          competition: true,
          cpc: true,
          trendScore: true,
          difficultyScore: true,
          opportunityScore: true,
        },
        _min: {
          searchVolume: true,
          competition: true,
          cpc: true,
        },
        _max: {
          searchVolume: true,
          competition: true,
          cpc: true,
        },
      })

      return {
        totalKeywords: stats._count.id,
        avgSearchVolume: Math.round(stats._avg.searchVolume || 0),
        avgCompetition: Math.round((stats._avg.competition || 0) * 100) / 100,
        avgCpc: Math.round((stats._avg.cpc || 0) * 100) / 100,
        avgTrendScore: Math.round((stats._avg.trendScore || 0) * 100) / 100,
        avgDifficultyScore: Math.round((stats._avg.difficultyScore || 0) * 100) / 100,
        avgOpportunityScore: Math.round((stats._avg.opportunityScore || 0) * 100) / 100,
        minSearchVolume: stats._min.searchVolume || 0,
        maxSearchVolume: stats._max.searchVolume || 0,
        minCompetition: stats._min.competition || 0,
        maxCompetition: stats._max.competition || 0,
        minCpc: stats._min.cpc || 0,
        maxCpc: stats._max.cpc || 0,
      }
    } catch (error) {
      logger.error(`Error getting keyword stats:`, error)
      throw error
    }
  }

  async searchKeywords(query: string, platform?: string, limit: number = 20): Promise<KeywordData[]> {
    try {
      const whereClause = platform ? { platform } : {}
      
      const results = await this.prisma.keywordData.findMany({
        where: {
          ...whereClause,
          keyword: {
            contains: query.toLowerCase(),
          },
        },
        orderBy: {
          searchVolume: 'desc',
        },
        take: limit,
      })

      return results.map(result => ({
        id: result.id,
        keyword: result.keyword,
        platform: result.platform,
        searchVolume: result.searchVolume,
        competition: result.competition,
        cpc: result.cpc,
        trendScore: result.trendScore,
        difficultyScore: result.difficultyScore,
        opportunityScore: result.opportunityScore,
        relatedKeywords: result.relatedKeywords ? JSON.parse(result.relatedKeywords) : [],
        trendData: result.trendData ? JSON.parse(result.trendData) : [],
        categoryData: result.categoryData ? JSON.parse(result.categoryData) : undefined,
        lastUpdated: result.lastUpdated,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }))
    } catch (error) {
      logger.error(`Error searching keywords:`, error)
      throw error
    }
  }

  async cleanupOldData(days: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      await this.prisma.keywordData.deleteMany({
        where: {
          lastUpdated: {
            lt: cutoffDate,
          },
        },
      })

      await this.prisma.keywordSearch.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      })

      logger.info(`Cleaned up data older than ${days} days`)
    } catch (error) {
      logger.error(`Error cleaning up old data:`, error)
      throw error
    }
  }
}

export const keywordRepository = new KeywordRepository()
