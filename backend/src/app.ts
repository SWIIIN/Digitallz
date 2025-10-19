import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { config } from './config'
import { errorHandler } from './middleware/errorHandler'
import { notFoundHandler } from './middleware/notFoundHandler'
import { authRoutes } from './routes/auth'
import { keywordRoutes } from './routes/keywords'
import { analyticsRoutes } from './routes/analytics'
import { subscriptionRoutes } from './routes/subscriptions'
import { webhookRoutes } from './routes/webhooks'
import { healthRoutes } from './routes/health'
import { logger } from './utils/logger'

const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// CORS configuration
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Trop de requêtes, réessayez plus tard',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compression middleware
app.use(compression())

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}))

// Health check (before auth)
app.use('/health', healthRoutes)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/keywords', keywordRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/webhooks', webhookRoutes)

// 404 handler
app.use(notFoundHandler)

// Error handler (must be last)
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

export default app
