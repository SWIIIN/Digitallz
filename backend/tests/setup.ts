import { PrismaClient } from '@prisma/client'
import { config } from '../src/config'

// Mock external services
jest.mock('../src/services/externalApiService')
jest.mock('../src/services/cacheService')
jest.mock('../src/utils/logger')

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushAll: jest.fn(),
    on: jest.fn(),
  })),
}))

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  keywordData: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
  keywordSearch: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  subscription: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  analytics: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $disconnect: jest.fn(),
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/digitallz_test'
  process.env.REDIS_URL = 'redis://localhost:6379'
  process.env.JWT_SECRET = 'test-secret'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
})

afterAll(async () => {
  // Cleanup
  await mockPrisma.$disconnect()
})

// Global test utilities
global.testUtils = {
  mockPrisma,
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createMockKeywordData: () => ({
    id: 'test-keyword-id',
    keyword: 'digital products',
    platform: 'amazon',
    searchVolume: 1000,
    competition: 0.5,
    cpc: 1.5,
    trendScore: 0.7,
    difficultyScore: 0.6,
    opportunityScore: 0.8,
    relatedKeywords: JSON.stringify(['online courses', 'ebooks']),
    trendData: JSON.stringify([
      { date: '2024-01-01', volume: 900, score: 0.6 },
      { date: '2024-01-02', volume: 1000, score: 0.7 },
    ]),
    categoryData: JSON.stringify({ category: 'digital', subcategory: 'products' }),
    lastUpdated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createMockSearchResult: () => ({
    keyword: 'digital products',
    platform: 'amazon',
    data: global.testUtils.createMockKeywordData(),
    relatedKeywords: [],
    trends: [],
    analysis: {
      totalKeywords: 1,
      avgSearchVolume: 1000,
      avgCompetition: 0.5,
      topOpportunities: [],
      trendingKeywords: [],
    },
  }),
}

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}
