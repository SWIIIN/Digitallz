import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://digitallz:password@localhost:5432/digitallz',
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    expiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  
  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  
  // Rate limiting
  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  
  // External APIs
  externalApis: {
    amazon: {
      apiKey: process.env.AMAZON_API_KEY || '',
      baseUrl: process.env.AMAZON_API_URL || 'https://api.amazon.com',
    },
    etsy: {
      apiKey: process.env.ETSY_API_KEY || '',
      baseUrl: process.env.ETSY_API_URL || 'https://api.etsy.com',
    },
    ebay: {
      apiKey: process.env.EBAY_API_KEY || '',
      baseUrl: process.env.EBAY_API_URL || 'https://api.ebay.com',
    },
  },
  
  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  
  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@digitallz.com',
  },
  
  // Monitoring
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN || '',
  },
  
  // Cache
  cache: {
    ttl: {
      keywordData: 3600, // 1 hour
      trends: 1800, // 30 minutes
      popular: 600, // 10 minutes
      suggestions: 300, // 5 minutes
    },
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // File upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  },
} as const

export type Config = typeof config
