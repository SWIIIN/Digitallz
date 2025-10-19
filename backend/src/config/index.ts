import dotenv from 'dotenv'

dotenv.config()

export const config = {
  // Server
  port: parseInt(process.env['PORT'] || '3001', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  
  // Database
  database: {
    url: process.env['DATABASE_URL'] || 'postgresql://localhost:5432/digitallz',
    host: process.env['POSTGRES_HOST'] || 'localhost',
    port: parseInt(process.env['POSTGRES_PORT'] || '5432', 10),
    name: process.env['POSTGRES_DB'] || 'digitallz',
    user: process.env['POSTGRES_USER'] || 'postgres',
    password: process.env['POSTGRES_PASSWORD'] || 'password'
  },
  
  // Redis
  redis: {
    url: process.env['REDIS_URL'] || 'redis://localhost:6379',
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
    password: process.env['REDIS_PASSWORD'] || undefined
  },
  
  // JWT
  jwt: {
    secret: process.env['JWT_SECRET'] || 'your-secret-key',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] || 'your-refresh-secret',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d'
  },
  
  // CORS
  cors: {
    origins: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10)
  },
  
  // External APIs
  amazon: {
    apiKey: process.env['AMAZON_API_KEY'] || '',
    secretKey: process.env['AMAZON_SECRET_KEY'] || '',
    associateTag: process.env['AMAZON_ASSOCIATE_TAG'] || '',
    region: process.env['AMAZON_REGION'] || 'us-east-1'
  },
  
  etsy: {
    apiKey: process.env['ETSY_API_KEY'] || '',
    secretKey: process.env['ETSY_SECRET_KEY'] || '',
    apiUrl: process.env['ETSY_API_URL'] || 'https://openapi.etsy.com/v2'
  },
  
  ebay: {
    apiKey: process.env['EBAY_API_KEY'] || '',
    secretKey: process.env['EBAY_SECRET_KEY'] || '',
    apiUrl: process.env['EBAY_API_URL'] || 'https://api.ebay.com'
  },
  
  // Stripe
  stripe: {
    secretKey: process.env['STRIPE_SECRET_KEY'] || '',
    publishableKey: process.env['STRIPE_PUBLISHABLE_KEY'] || '',
    webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'] || ''
  },
  
  // Email
  email: {
    host: process.env['SMTP_HOST'] || '',
    port: parseInt(process.env['SMTP_PORT'] || '587', 10),
    user: process.env['SMTP_USER'] || '',
    pass: process.env['SMTP_PASS'] || '',
    from: process.env['SMTP_FROM'] || 'noreply@digitallz.com'
  },
  
  // Monitoring
  sentry: {
    dsn: process.env['SENTRY_DSN'] || ''
  }
}