# ⚙️ Backend Architecture - Node.js + Express

## 📁 Structure du projet

```
backend/
├── src/
│   ├── controllers/           # Contrôleurs API
│   │   ├── authController.ts
│   │   ├── keywordController.ts
│   │   ├── analyticsController.ts
│   │   └── webhookController.ts
│   ├── services/             # Logique métier
│   │   ├── authService.ts
│   │   ├── keywordService.ts
│   │   ├── analyticsService.ts
│   │   ├── paymentService.ts
│   │   └── emailService.ts
│   ├── repositories/         # Accès aux données
│   │   ├── userRepository.ts
│   │   ├── keywordRepository.ts
│   │   └── analyticsRepository.ts
│   ├── models/              # Modèles de données
│   │   ├── User.ts
│   │   ├── Keyword.ts
│   │   ├── Search.ts
│   │   └── Subscription.ts
│   ├── middleware/          # Middleware Express
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── rateLimiting.ts
│   │   └── errorHandler.ts
│   ├── routes/              # Routes API
│   │   ├── auth.ts
│   │   ├── keywords.ts
│   │   ├── analytics.ts
│   │   └── webhooks.ts
│   ├── utils/               # Utilitaires
│   │   ├── logger.ts
│   │   ├── encryption.ts
│   │   ├── validation.ts
│   │   └── helpers.ts
│   ├── config/              # Configuration
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── jwt.ts
│   │   └── external-apis.ts
│   ├── jobs/                # Tâches en arrière-plan
│   │   ├── keywordCollector.ts
│   │   ├── analyticsProcessor.ts
│   │   └── emailSender.ts
│   └── app.ts               # Configuration Express
├── tests/                   # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
├── .env
└── Dockerfile
```

## 🎯 API Endpoints

### Authentification
```typescript
// POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}

// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securePassword123"
}

// POST /api/auth/refresh
{
  "refreshToken": "jwt_refresh_token"
}
```

### Recherche de mots-clés
```typescript
// POST /api/keywords/search
{
  "keyword": "digital products",
  "platform": "amazon",
  "includeRelated": true,
  "includeTrends": true,
  "dateRange": "30d"
}

// GET /api/keywords/trends/:keyword
// GET /api/keywords/competitors/:keyword
// GET /api/keywords/suggestions/:keyword
```

### Analytics
```typescript
// GET /api/analytics/dashboard
// GET /api/analytics/keywords/popular
// GET /api/analytics/trends/emerging
// GET /api/analytics/competitors/analysis
```

## 🔧 Configuration Express

### App principal
```typescript
// src/app.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middleware/errorHandler'
import { authRoutes } from './routes/auth'
import { keywordRoutes } from './routes/keywords'
import { analyticsRoutes } from './routes/analytics'

const app = express()

// Middleware de sécurité
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: 'Trop de requêtes, réessayez plus tard'
})
app.use('/api/', limiter)

// Parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/keywords', keywordRoutes)
app.use('/api/analytics', analyticsRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Error handling
app.use(errorHandler)

export default app
```

### Contrôleur de mots-clés
```typescript
// src/controllers/keywordController.ts
import { Request, Response } from 'express'
import { keywordService } from '../services/keywordService'
import { validateSearchRequest } from '../middleware/validation'

export class KeywordController {
  async searchKeywords(req: Request, res: Response) {
    try {
      const { keyword, platform, includeRelated, includeTrends } = req.body
      const userId = req.user?.id

      const results = await keywordService.searchKeywords({
        keyword,
        platform,
        includeRelated,
        includeTrends,
        userId
      })

      res.json({
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche de mots-clés'
      })
    }
  }

  async getKeywordTrends(req: Request, res: Response) {
    try {
      const { keyword } = req.params
      const { platform, dateRange } = req.query

      const trends = await keywordService.getKeywordTrends({
        keyword,
        platform: platform as string,
        dateRange: dateRange as string
      })

      res.json({
        success: true,
        data: trends
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des tendances'
      })
    }
  }

  async getRelatedKeywords(req: Request, res: Response) {
    try {
      const { keyword } = req.params
      const { platform, limit } = req.query

      const related = await keywordService.getRelatedKeywords({
        keyword,
        platform: platform as string,
        limit: parseInt(limit as string) || 10
      })

      res.json({
        success: true,
        data: related
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des mots-clés liés'
      })
    }
  }
}

export const keywordController = new KeywordController()
```

### Service de mots-clés
```typescript
// src/services/keywordService.ts
import { keywordRepository } from '../repositories/keywordRepository'
import { externalApiService } from './externalApiService'
import { analyticsService } from './analyticsService'
import { cacheService } from './cacheService'

export class KeywordService {
  async searchKeywords(params: {
    keyword: string
    platform: string
    includeRelated: boolean
    includeTrends: boolean
    userId?: string
  }) {
    const { keyword, platform, includeRelated, includeTrends, userId } = params

    // Vérifier le cache d'abord
    const cacheKey = `keyword:${keyword}:${platform}`
    const cached = await cacheService.get(cacheKey)
    
    if (cached) {
      return cached
    }

    // Recherche dans la base de données
    let keywordData = await keywordRepository.findByKeyword(keyword, platform)

    // Si pas trouvé, chercher via API externe
    if (!keywordData) {
      keywordData = await externalApiService.searchKeyword(keyword, platform)
      
      // Sauvegarder en base
      await keywordRepository.create(keywordData)
    }

    // Enrichir avec des données supplémentaires
    const results: any = {
      keyword: keywordData.keyword,
      platform: keywordData.platform,
      searchVolume: keywordData.searchVolume,
      competition: keywordData.competition,
      cpc: keywordData.cpc,
      lastUpdated: keywordData.lastUpdated
    }

    // Mots-clés liés
    if (includeRelated) {
      results.relatedKeywords = await this.getRelatedKeywords(keyword, platform)
    }

    // Tendances
    if (includeTrends) {
      results.trends = await this.getKeywordTrends(keyword, platform)
    }

    // Mettre en cache
    await cacheService.set(cacheKey, results, 3600) // 1 heure

    // Enregistrer la recherche
    if (userId) {
      await keywordRepository.logSearch({
        userId,
        keyword,
        platform,
        results: JSON.stringify(results)
      })
    }

    // Analytics
    await analyticsService.trackKeywordSearch({
      keyword,
      platform,
      userId,
      timestamp: new Date()
    })

    return results
  }

  async getRelatedKeywords(keyword: string, platform: string) {
    const cacheKey = `related:${keyword}:${platform}`
    const cached = await cacheService.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const related = await externalApiService.getRelatedKeywords(keyword, platform)
    await cacheService.set(cacheKey, related, 7200) // 2 heures
    
    return related
  }

  async getKeywordTrends(keyword: string, platform: string, dateRange = '30d') {
    return await externalApiService.getKeywordTrends(keyword, platform, dateRange)
  }
}

export const keywordService = new KeywordService()
```

## 🔌 Intégrations externes

### Service d'APIs externes
```typescript
// src/services/externalApiService.ts
import axios from 'axios'
import { config } from '../config/external-apis'

export class ExternalApiService {
  private amazonApi = axios.create({
    baseURL: config.amazon.apiUrl,
    headers: {
      'Authorization': `Bearer ${config.amazon.apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  private etsyApi = axios.create({
    baseURL: config.etsy.apiUrl,
    headers: {
      'Authorization': `Bearer ${config.etsy.apiKey}`
    }
  })

  async searchKeyword(keyword: string, platform: string) {
    switch (platform) {
      case 'amazon':
        return await this.searchAmazonKeyword(keyword)
      case 'etsy':
        return await this.searchEtsyKeyword(keyword)
      case 'ebay':
        return await this.searchEbayKeyword(keyword)
      default:
        throw new Error(`Platform ${platform} not supported`)
    }
  }

  private async searchAmazonKeyword(keyword: string) {
    try {
      const response = await this.amazonApi.post('/keywords/search', {
        keyword,
        includeMetrics: true,
        includeTrends: true
      })

      return {
        keyword: response.data.keyword,
        platform: 'amazon',
        searchVolume: response.data.searchVolume,
        competition: response.data.competition,
        cpc: response.data.cpc,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Amazon API error:', error)
      throw new Error('Erreur lors de la recherche Amazon')
    }
  }

  private async searchEtsyKeyword(keyword: string) {
    try {
      const response = await this.etsyApi.get('/keywords/search', {
        params: { keyword }
      })

      return {
        keyword: response.data.keyword,
        platform: 'etsy',
        searchVolume: response.data.searchVolume,
        competition: response.data.competition,
        cpc: response.data.cpc,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Etsy API error:', error)
      throw new Error('Erreur lors de la recherche Etsy')
    }
  }

  async getRelatedKeywords(keyword: string, platform: string) {
    // Implémentation pour récupérer les mots-clés liés
    // Utilise les APIs de suggestion des plateformes
  }

  async getKeywordTrends(keyword: string, platform: string, dateRange: string) {
    // Implémentation pour récupérer les tendances
    // Utilise les APIs de tendances des plateformes
  }
}

export const externalApiService = new ExternalApiService()
```

## 🗄️ Base de données

### Repository pattern
```typescript
// src/repositories/keywordRepository.ts
import { PrismaClient } from '@prisma/client'
import { Keyword } from '../models/Keyword'

export class KeywordRepository {
  private prisma = new PrismaClient()

  async findByKeyword(keyword: string, platform: string): Promise<Keyword | null> {
    return await this.prisma.keywordData.findFirst({
      where: {
        keyword: keyword.toLowerCase(),
        platform
      }
    })
  }

  async create(keywordData: Partial<Keyword>): Promise<Keyword> {
    return await this.prisma.keywordData.create({
      data: {
        keyword: keywordData.keyword!.toLowerCase(),
        platform: keywordData.platform!,
        searchVolume: keywordData.searchVolume,
        competitionScore: keywordData.competition,
        cpc: keywordData.cpc,
        trendData: keywordData.trends ? JSON.stringify(keywordData.trends) : null
      }
    })
  }

  async logSearch(params: {
    userId: string
    keyword: string
    platform: string
    results: string
  }) {
    return await this.prisma.keywordSearches.create({
      data: {
        userId: params.userId,
        keyword: params.keyword.toLowerCase(),
        platform: params.platform,
        results: params.results
      }
    })
  }

  async getPopularKeywords(platform: string, limit = 10) {
    return await this.prisma.keywordData.findMany({
      where: { platform },
      orderBy: { searchVolume: 'desc' },
      take: limit
    })
  }
}

export const keywordRepository = new KeywordRepository()
```

## 🔄 Tâches en arrière-plan

### Collecteur de mots-clés
```typescript
// src/jobs/keywordCollector.ts
import { Queue } from 'bull'
import { externalApiService } from '../services/externalApiService'
import { keywordRepository } from '../repositories/keywordRepository'

const keywordQueue = new Queue('keyword collection')

keywordQueue.process('collect-keywords', async (job) => {
  const { keywords, platform } = job.data

  for (const keyword of keywords) {
    try {
      // Récupérer les données via API externe
      const data = await externalApiService.searchKeyword(keyword, platform)
      
      // Sauvegarder en base
      await keywordRepository.create(data)
      
      console.log(`Collected data for keyword: ${keyword}`)
    } catch (error) {
      console.error(`Error collecting keyword ${keyword}:`, error)
    }
  }
})

// Programmer la collecte quotidienne
export const scheduleKeywordCollection = () => {
  // Collecter les mots-clés populaires chaque jour à 2h du matin
  keywordQueue.add('collect-keywords', {
    keywords: ['digital products', 'online courses', 'ebooks', 'templates'],
    platform: 'amazon'
  }, {
    repeat: { cron: '0 2 * * *' }
  })
}
```

## 🚀 Déploiement

### Dockerfile
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci --only=production

# Copier le code source
COPY . .

# Compiler TypeScript
RUN npm run build

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/digitallz
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=digitallz
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## 📊 Monitoring

### Logging
```typescript
// src/utils/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'digitallz-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})
```

### Health checks
```typescript
// src/routes/health.ts
import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { redis } from '../config/redis'

export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Vérifier la base de données
    await prisma.$queryRaw`SELECT 1`
    
    // Vérifier Redis
    await redis.ping()
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        redis: 'up'
      }
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
}
```
