'use client'

import { useState } from 'react'
import { 
  MagnifyingGlassIcon, 
  ChartBarIcon, 
  BoltIcon, 
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState(['Amazon', 'Etsy', 'eBay'])
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    
    // Simulation de recherche avec des données mock
    setTimeout(() => {
      setSearchResults({
        keyword: searchTerm,
        platforms: selectedPlatforms,
        results: [
          {
            platform: 'Amazon',
            volume: 12500,
            competition: 'High',
            cpc: 2.45,
            trend: 'up',
            opportunity: 'Medium',
            related: ['digital marketing course', 'online marketing training', 'marketing certification']
          },
          {
            platform: 'Etsy',
            volume: 3200,
            competition: 'Medium',
            cpc: 1.20,
            trend: 'up',
            opportunity: 'High',
            related: ['marketing printables', 'digital planner', 'marketing templates']
          },
          {
            platform: 'eBay',
            volume: 8900,
            competition: 'Low',
            cpc: 0.85,
            trend: 'stable',
            opportunity: 'High',
            related: ['marketing course', 'business training', 'digital products']
          }
        ]
      })
      setIsSearching(false)
    }, 2000)
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
      case 'down':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-red-500 rotate-180" />
      default:
        return <div className="h-5 w-5 bg-gray-400 rounded-full" />
    }
  }

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'High':
        return 'text-red-600 bg-red-100'
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'Low':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getOpportunityColor = (opportunity: string) => {
    switch (opportunity) {
      case 'High':
        return 'text-green-600 bg-green-100'
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'Low':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Digitallz
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Tableau de bord
              </button>
              <button className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Historique
              </button>
              <button className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Paramètres
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <button className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de Bord
          </h1>
          <p className="text-gray-600">
            Analysez et optimisez vos mots-clés pour maximiser vos ventes
          </p>
          </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Nouvelle Recherche
          </h2>
          
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
                Mot-clé à analyser
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="keyword"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: digital marketing course..."
                  className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Plateformes à analyser
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {['Amazon', 'Etsy', 'eBay', 'Shopify', 'Gumroad'].map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      selectedPlatforms.includes(platform)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">
                        {platform === 'Amazon' && '🛒'}
                        {platform === 'Etsy' && '🎨'}
                        {platform === 'eBay' && '🏪'}
                        {platform === 'Shopify' && '🛍️'}
                        {platform === 'Gumroad' && '💻'}
                      </div>
                      <span className="text-sm font-medium">{platform}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSearching || !searchTerm.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSearching ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Analyse en cours...
          </div>
              ) : (
                'Analyser les Mots-clés'
              )}
            </button>
          </form>
        </div>
        
        {/* Results Section */}
        {searchResults && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Résultats pour "{searchResults.keyword}"
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4" />
                  <span>Analysé il y a 2 minutes</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {searchResults.results.map((result, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="text-2xl">
                          {result.platform === 'Amazon' && '🛒'}
                          {result.platform === 'Etsy' && '🎨'}
                          {result.platform === 'eBay' && '🏪'}
                          {result.platform === 'Shopify' && '🛍️'}
                          {result.platform === 'Gumroad' && '💻'}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {result.platform}
                        </h3>
                      </div>
                      {getTrendIcon(result.trend)}
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Volume de recherche</span>
                        <span className="font-semibold text-gray-900">
                          {result.volume.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Concurrence</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompetitionColor(result.competition)}`}>
                          {result.competition}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">CPC moyen</span>
                        <span className="font-semibold text-gray-900">
                          ${result.cpc}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Opportunité</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOpportunityColor(result.opportunity)}`}>
                          {result.opportunity}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Mots-clés liés
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.related.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <EyeIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Volume total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {searchResults.results.reduce((sum, r) => sum + r.volume, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">CPC moyen</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${(searchResults.results.reduce((sum, r) => sum + r.cpc, 0) / searchResults.results.length).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Concurrence élevée</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {searchResults.results.filter(r => r.competition === 'High').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BoltIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Opportunités</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {searchResults.results.filter(r => r.opportunity === 'High').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Searches */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Recherches Récentes
          </h2>
          <div className="space-y-4">
            {[
              { keyword: 'digital marketing course', date: 'Il y a 1 heure', platforms: ['Amazon', 'Etsy'] },
              { keyword: 'fitness program', date: 'Il y a 3 heures', platforms: ['eBay', 'Gumroad'] },
              { keyword: 'business templates', date: 'Il y a 1 jour', platforms: ['Shopify', 'Etsy'] },
            ].map((search, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{search.keyword}</p>
                  <p className="text-sm text-gray-500">{search.date}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {search.platforms.map((platform, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {platform}
                    </span>
                  ))}
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Voir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}