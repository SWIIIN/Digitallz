import Redis from 'redis'
import { config } from '../config'
import { logger } from '../utils/logger'

export class CacheService {
  private redis: Redis.RedisClientType

  constructor() {
    this.redis = Redis.createClient({
      url: config.redis.url,
    })

    this.redis.on('error', (err) => {
      logger.error('Redis Client Error:', err)
    })

    this.redis.on('connect', () => {
      logger.info('Redis Client Connected')
    })

    this.redis.connect()
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error)
      return null
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.setEx(key, ttl, JSON.stringify(value))
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      logger.error(`Error checking cache key ${key}:`, error)
      return false
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl)
    } catch (error) {
      logger.error(`Error setting expiry for cache key ${key}:`, error)
    }
  }

  async flush(): Promise<void> {
    try {
      await this.redis.flushAll()
      logger.info('Cache flushed')
    } catch (error) {
      logger.error('Error flushing cache:', error)
    }
  }

  async getStats(): Promise<any> {
    try {
      const info = await this.redis.info('memory')
      const keyspace = await this.redis.info('keyspace')
      
      return {
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace),
      }
    } catch (error) {
      logger.error('Error getting cache stats:', error)
      return null
    }
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n')
    const result: any = {}
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':')
        result[key] = value
      }
    }
    
    return result
  }

  // Méthodes spécialisées pour les mots-clés
  async getKeywordData(keyword: string, platform: string): Promise<any> {
    const key = `keyword:${keyword}:${platform}`
    return await this.get(key)
  }

  async setKeywordData(keyword: string, platform: string, data: any, ttl: number = 3600): Promise<void> {
    const key = `keyword:${keyword}:${platform}`
    await this.set(key, data, ttl)
  }

  async getTrends(keyword: string, platform: string, dateRange: string): Promise<any> {
    const key = `trends:${keyword}:${platform}:${dateRange}`
    return await this.get(key)
  }

  async setTrends(keyword: string, platform: string, dateRange: string, data: any, ttl: number = 1800): Promise<void> {
    const key = `trends:${keyword}:${platform}:${dateRange}`
    await this.set(key, data, ttl)
  }

  async getPopularKeywords(platform?: string): Promise<any> {
    const key = `popular:${platform || 'all'}`
    return await this.get(key)
  }

  async setPopularKeywords(platform: string | undefined, data: any, ttl: number = 600): Promise<void> {
    const key = `popular:${platform || 'all'}`
    await this.set(key, data, ttl)
  }

  async getSuggestions(keyword: string, platform: string): Promise<any> {
    const key = `suggestions:${keyword}:${platform}`
    return await this.get(key)
  }

  async setSuggestions(keyword: string, platform: string, data: any, ttl: number = 300): Promise<void> {
    const key = `suggestions:${keyword}:${platform}`
    await this.set(key, data, ttl)
  }

  async getCompetitors(keyword: string, platform: string): Promise<any> {
    const key = `competitors:${keyword}:${platform}`
    return await this.get(key)
  }

  async setCompetitors(keyword: string, platform: string, data: any, ttl: number = 3600): Promise<void> {
    const key = `competitors:${keyword}:${platform}`
    await this.set(key, data, ttl)
  }

  async getDifficulty(keyword: string, platform: string): Promise<any> {
    const key = `difficulty:${keyword}:${platform}`
    return await this.get(key)
  }

  async setDifficulty(keyword: string, platform: string, data: any, ttl: number = 1800): Promise<void> {
    const key = `difficulty:${keyword}:${platform}`
    await this.set(key, data, ttl)
  }

  // Méthodes pour les patterns
  async getKeysByPattern(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern)
    } catch (error) {
      logger.error(`Error getting keys by pattern ${pattern}:`, error)
      return []
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length === 0) return 0
      
      return await this.redis.del(keys)
    } catch (error) {
      logger.error(`Error deleting keys by pattern ${pattern}:`, error)
      return 0
    }
  }

  // Nettoyage automatique
  async cleanupExpiredKeys(): Promise<void> {
    try {
      // Supprimer les clés expirées (Redis le fait automatiquement, mais on peut forcer)
      const expiredKeys = await this.redis.keys('*')
      for (const key of expiredKeys) {
        const ttl = await this.redis.ttl(key)
        if (ttl === -2) { // Clé expirée
          await this.redis.del(key)
        }
      }
    } catch (error) {
      logger.error('Error cleaning up expired keys:', error)
    }
  }
}

export const cacheService = new CacheService()
