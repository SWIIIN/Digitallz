export interface Keyword {
  id: string
  term: string
  platform: string
  searchVolume: number
  trend: 'up' | 'down' | 'stable'
  competition: 'low' | 'medium' | 'high'
  potentialRevenue: number
  cpc: number
  difficulty: number
  lastUpdated: Date
}

export interface SearchParams {
  keyword: string
  platform: string
  includeRelated?: boolean
  includeTrends?: boolean
  userId?: string
}

export interface SearchResult {
  keywords: Keyword[]
  totalResults: number
  platforms: string[]
  searchTime: number
  cached: boolean
}

export interface BulkAnalysisResult {
  results: Keyword[]
  totalKeywords: number
  averageVolume: number
  topPlatforms: string[]
}

export interface TrendData {
  date: string
  volume: number
  cpc: number
  competition: number
}