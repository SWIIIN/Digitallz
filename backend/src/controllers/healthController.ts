import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { cacheService } from '../services/cacheService'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export const healthController = {
  async healthCheck(req: Request, res: Response) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'unknown',
          cache: 'unknown',
          api: 'healthy'
        },
        version: '1.0.0'
      }

      // Vérifier la base de données
      try {
        await prisma.$queryRaw`SELECT 1`
        health.services.database = 'healthy'
      } catch (error) {
        health.services.database = 'unhealthy'
        health.status = 'unhealthy'
        logger.error('Database health check failed:', error)
      }

      // Vérifier le cache Redis
      try {
        await cacheService.get('health_check')
        health.services.cache = 'healthy'
      } catch (error) {
        health.services.cache = 'unhealthy'
        health.status = 'unhealthy'
        logger.error('Cache health check failed:', error)
      }

      const statusCode = health.status === 'healthy' ? 200 : 503

      res.status(statusCode).json(health)
    } catch (error) {
      logger.error('Health check failed:', error)
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      })
    }
  },

  async readinessCheck(req: Request, res: Response) {
    try {
      const readiness = {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: false,
          cache: false
        }
      }

      // Vérifier la base de données
      try {
        await prisma.$queryRaw`SELECT 1`
        readiness.checks.database = true
      } catch (error) {
        readiness.checks.database = false
        readiness.status = 'not_ready'
        logger.error('Database readiness check failed:', error)
      }

      // Vérifier le cache Redis
      try {
        await cacheService.get('readiness_check')
        readiness.checks.cache = true
      } catch (error) {
        readiness.checks.cache = false
        readiness.status = 'not_ready'
        logger.error('Cache readiness check failed:', error)
      }

      const statusCode = readiness.status === 'ready' ? 200 : 503

      res.status(statusCode).json(readiness)
    } catch (error) {
      logger.error('Readiness check failed:', error)
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed'
      })
    }
  },

  async livenessCheck(req: Request, res: Response) {
    try {
      res.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0'
      })
    } catch (error) {
      logger.error('Liveness check failed:', error)
      res.status(503).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
        error: 'Liveness check failed'
      })
    }
  }
}
