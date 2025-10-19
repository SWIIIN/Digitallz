export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatScore(score: number, max: number = 1): string {
  const percentage = (score / max) * 100
  return `${percentage.toFixed(1)}%`
}

export function formatTrend(trend: number): string {
  if (trend > 0.1) return '📈 En hausse'
  if (trend < -0.1) return '📉 En baisse'
  return '➡️ Stable'
}

export function formatDifficulty(difficulty: number): string {
  if (difficulty >= 0.8) return '🔴 Très difficile'
  if (difficulty >= 0.6) return '🟠 Difficile'
  if (difficulty >= 0.4) return '🟡 Modéré'
  if (difficulty >= 0.2) return '🟢 Facile'
  return '🟢 Très facile'
}

export function formatOpportunity(opportunity: number): string {
  if (opportunity >= 0.8) return '🟢 Excellente'
  if (opportunity >= 0.6) return '🟢 Bonne'
  if (opportunity >= 0.4) return '🟡 Modérée'
  if (opportunity >= 0.2) return '🟠 Faible'
  return '🔴 Très faible'
}

export function formatCompetition(competition: number): string {
  if (competition >= 0.8) return '🔴 Très élevée'
  if (competition >= 0.6) return '🟠 Élevée'
  if (competition >= 0.4) return '🟡 Modérée'
  if (competition >= 0.2) return '🟢 Faible'
  return '🟢 Très faible'
}

export function formatCpc(cpc: number): string {
  if (cpc >= 5) return '🔴 Très élevé'
  if (cpc >= 2) return '🟠 Élevé'
  if (cpc >= 1) return '🟡 Modéré'
  if (cpc >= 0.5) return '🟢 Faible'
  return '🟢 Très faible'
}

export function formatSearchVolume(volume: number): string {
  if (volume >= 10000) return '🔴 Très élevé'
  if (volume >= 1000) return '🟠 Élevé'
  if (volume >= 100) return '🟡 Modéré'
  if (volume >= 10) return '🟢 Faible'
  return '🔴 Très faible'
}

export function formatPlatform(platform: string): string {
  const platforms: Record<string, string> = {
    amazon: '🛒 Amazon',
    etsy: '🎨 Etsy',
    ebay: '🏪 eBay',
    shopify: '🛍️ Shopify',
  }
  return platforms[platform] || platform
}

export function formatCategory(category: string): string {
  const categories: Record<string, string> = {
    books: '📚 Livres',
    digital: '💻 Digital',
    software: '⚙️ Logiciels',
    courses: '🎓 Cours',
    templates: '📄 Modèles',
    graphics: '🎨 Graphiques',
    music: '🎵 Musique',
    videos: '🎬 Vidéos',
    handmade: '✋ Artisanat',
    vintage: '🏺 Vintage',
    art: '🎨 Art',
    crafts: '🛠️ Bricolage',
    electronics: '📱 Électronique',
    collectibles: '🏆 Collection',
    apps: '📱 Applications',
    themes: '🎨 Thèmes',
    tools: '🔧 Outils',
    services: '🛠️ Services',
  }
  return categories[category] || category
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'À l\'instant'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} min`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `Il y a ${diffInHours}h`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `Il y a ${diffInDays}j`
  }

  return formatDate(d)
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}j ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export function formatRank(rank: number): string {
  if (rank === 1) return '🥇 1er'
  if (rank === 2) return '🥈 2ème'
  if (rank === 3) return '🥉 3ème'
  return `#${rank}`
}

export function formatStatus(status: string): string {
  const statuses: Record<string, string> = {
    active: '🟢 Actif',
    inactive: '🔴 Inactif',
    pending: '🟡 En attente',
    completed: '✅ Terminé',
    failed: '❌ Échec',
    cancelled: '🚫 Annulé',
  }
  return statuses[status] || status
}

export function formatBoolean(value: boolean): string {
  return value ? '✅ Oui' : '❌ Non'
}

export function formatArray(items: string[], maxItems: number = 3): string {
  if (items.length === 0) return 'Aucun'
  if (items.length <= maxItems) return items.join(', ')
  return `${items.slice(0, maxItems).join(', ')} et ${items.length - maxItems} autres`
}

export function formatKeywords(keywords: string[], maxItems: number = 5): string {
  if (keywords.length === 0) return 'Aucun mot-clé'
  if (keywords.length <= maxItems) return keywords.join(', ')
  return `${keywords.slice(0, maxItems).join(', ')} +${keywords.length - maxItems}`
}

export function formatTrendData(trends: any[]): string {
  if (!trends || trends.length === 0) return 'Aucune donnée'
  
  const latest = trends[trends.length - 1]
  const previous = trends[trends.length - 2]
  
  if (!previous) return formatNumber(latest.volume)
  
  const change = ((latest.volume - previous.volume) / previous.volume) * 100
  const changeStr = change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`
  
  return `${formatNumber(latest.volume)} (${changeStr})`
}
