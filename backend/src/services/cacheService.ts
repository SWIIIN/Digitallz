import Redis from 'ioredis'
import { config } from '../config'
import { logger } from '../utils/logger'

class CacheService {
  private redis: Redis

  constructor() {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    })

    this.redis.on('error', (error) => {
      logger.error('Erreur Redis:', error)
    })

    this.redis.on('connect', () => {
      logger.info('Connexion Redis établie')
    })
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error(`Erreur lors de la récupération du cache pour la clé ${key}:`, error)
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
      return true
    } catch (error) {
      logger.error(`Erreur lors de la mise en cache pour la clé ${key}:`, error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      logger.error(`Erreur lors de la suppression du cache pour la clé ${key}:`, error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      logger.error(`Erreur lors de la vérification de l'existence de la clé ${key}:`, error)
      return false
    }
  }

  async flush(): Promise<boolean> {
    try {
      await this.redis.flushdb()
      return true
    } catch (error) {
      logger.error('Erreur lors du vidage du cache:', error)
      return false
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern)
    } catch (error) {
      logger.error(`Erreur lors de la récupération des clés avec le pattern ${pattern}:`, error)
      return []
    }
  }

  async getTTL(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key)
    } catch (error) {
      logger.error(`Erreur lors de la récupération du TTL pour la clé ${key}:`, error)
      return -1
    }
  }

  async increment(key: string, value: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, value)
    } catch (error) {
      logger.error(`Erreur lors de l'incrémentation pour la clé ${key}:`, error)
      return 0
    }
  }

  async decrement(key: string, value: number = 1): Promise<number> {
    try {
      return await this.redis.decrby(key, value)
    } catch (error) {
      logger.error(`Erreur lors de la décrémentation pour la clé ${key}:`, error)
      return 0
    }
  }

  async hget(hash: string, field: string): Promise<any> {
    try {
      const value = await this.redis.hget(hash, field)
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error(`Erreur lors de la récupération du hash ${hash} pour le champ ${field}:`, error)
      return null
    }
  }

  async hset(hash: string, field: string, value: any): Promise<boolean> {
    try {
      await this.redis.hset(hash, field, JSON.stringify(value))
      return true
    } catch (error) {
      logger.error(`Erreur lors de la mise en cache du hash ${hash} pour le champ ${field}:`, error)
      return false
    }
  }

  async hdel(hash: string, field: string): Promise<boolean> {
    try {
      await this.redis.hdel(hash, field)
      return true
    } catch (error) {
      logger.error(`Erreur lors de la suppression du hash ${hash} pour le champ ${field}:`, error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect()
    } catch (error) {
      logger.error('Erreur lors de la déconnexion Redis:', error)
    }
  }
}

export const cacheService = new CacheService()