export interface KeywordData {
  id?: string
  keyword: string
  platform: string
  searchVolume: number
  competition: number
  cpc: number
  trendScore: number
  difficultyScore: number
  opportunityScore: number
  relatedKeywords?: string[]
  trendData?: TrendData[]
  categoryData?: CategoryData
  lastUpdated: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface TrendData {
  date: string
  volume: number
  score: number
  change?: number
}

export interface CategoryData {
  category: string
  subcategory?: string
  categoryId?: string
  categoryPath?: string[]
}

export interface SearchParams {
  keyword: string
  platform: string
  includeRelated?: boolean
  includeTrends?: boolean
  userId?: string
}

export interface SearchResult {
  keyword: string
  platform: string
  data: KeywordData
  relatedKeywords: KeywordData[]
  trends: TrendData[]
  analysis: {
    totalKeywords: number
    avgSearchVolume: number
    avgCompetition: number
    topOpportunities: KeywordData[]
    trendingKeywords: KeywordData[]
  }
}

export interface CompetitorAnalysis {
  keyword: string
  platform: string
  competitors: CompetitorData[]
  marketShare: MarketShareData[]
  pricing: PricingData
  recommendations: string[]
}

export interface CompetitorData {
  name: string
  url: string
  title: string
  description: string
  price?: number
  rating?: number
  reviews?: number
  rank: number
  features: string[]
}

export interface MarketShareData {
  competitor: string
  share: number
  trend: 'up' | 'down' | 'stable'
}

export interface PricingData {
  min: number
  max: number
  average: number
  median: number
  distribution: PriceDistribution[]
}

export interface PriceDistribution {
  range: string
  count: number
  percentage: number
}

export interface BulkAnalysisResult {
  keywords: KeywordData[]
  summary: {
    totalKeywords: number
    analyzedKeywords: number
    avgSearchVolume: number
    avgCompetition: number
    topOpportunities: KeywordData[]
    recommendations: string[]
  }
}

export interface KeywordDifficulty {
  keyword: string
  platform: string
  difficulty: number
  factors: {
    searchVolume: number
    competition: number
    cpc: number
    trendScore: number
  }
  recommendations: string[]
  score: {
    overall: number
    searchVolume: number
    competition: number
    cpc: number
    trend: number
  }
}

export interface PopularKeyword {
  keyword: string
  platform: string
  searchVolume: number
  competition: number
  trend: 'up' | 'down' | 'stable'
  category: string
  rank: number
}

export interface KeywordSuggestion {
  keyword: string
  searchVolume: number
  competition: number
  relevance: number
  type: 'exact' | 'broad' | 'phrase' | 'related'
}

export interface RecentSearch {
  id: string
  userId: string
  keyword: string
  platform: string
  results: any
  createdAt: Date
}

export interface PlatformConfig {
  name: string
  displayName: string
  icon: string
  color: string
  apiUrl: string
  rateLimit: {
    requests: number
    window: number
  }
  features: string[]
  categories: string[]
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  amazon: {
    name: 'amazon',
    displayName: 'Amazon',
    icon: '🛒',
    color: '#FF9900',
    apiUrl: 'https://api.amazon.com',
    rateLimit: {
      requests: 100,
      window: 60,
    },
    features: ['search_volume', 'competition', 'cpc', 'trends', 'related'],
    categories: ['books', 'digital', 'software', 'courses', 'templates'],
  },
  etsy: {
    name: 'etsy',
    displayName: 'Etsy',
    icon: '🎨',
    color: '#F16521',
    apiUrl: 'https://api.etsy.com',
    rateLimit: {
      requests: 50,
      window: 60,
    },
    features: ['search_volume', 'competition', 'trends', 'related', 'categories'],
    categories: ['handmade', 'vintage', 'digital', 'art', 'crafts'],
  },
  ebay: {
    name: 'ebay',
    displayName: 'eBay',
    icon: '🏪',
    color: '#0064D2',
    apiUrl: 'https://api.ebay.com',
    rateLimit: {
      requests: 75,
      window: 60,
    },
    features: ['search_volume', 'competition', 'cpc', 'trends'],
    categories: ['electronics', 'collectibles', 'digital', 'software'],
  },
  shopify: {
    name: 'shopify',
    displayName: 'Shopify',
    icon: '🛍️',
    color: '#96BF48',
    apiUrl: 'https://api.shopify.com',
    rateLimit: {
      requests: 40,
      window: 60,
    },
    features: ['search_volume', 'competition', 'trends', 'related'],
    categories: ['apps', 'themes', 'tools', 'services'],
  },
}
