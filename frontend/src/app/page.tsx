'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon, ChartBarIcon, BoltIcon, GlobeAltIcon, ShieldCheckIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState(['Amazon', 'Etsy', 'eBay', 'Shopify', 'Gumroad'])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    // Simulation de recherche
    setTimeout(() => {
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
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Fonctionnalités
                </a>
                <a href="#pricing" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Tarifs
                </a>
                <a href="#contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Contact
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Se connecter
              </button>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                Commencer
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Trouvez les{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Meilleurs Mots-clés
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              La plateforme la plus avancée pour analyser et optimiser vos mots-clés sur Amazon, Etsy, eBay, Shopify et Gumroad
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                Commencer Gratuitement
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-200">
                Voir la Démo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section id="search" className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Recherche Intelligente de Mots-clés
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Analysez en temps réel les opportunités de mots-clés sur toutes les plateformes
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-100">
            <form onSubmit={handleSearch} className="space-y-8">
              <div>
                <label htmlFor="keyword" className="block text-lg font-semibold text-gray-900 mb-3">
                  Mot-clé à analyser
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <input
                    type="text"
                    id="keyword"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ex: digital marketing course, online fitness program..."
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Plateformes à analyser
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {['Amazon', 'Etsy', 'eBay', 'Shopify', 'Gumroad'].map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedPlatforms.includes(platform)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">
                          {platform === 'Amazon' && '🛒'}
                          {platform === 'Etsy' && '🎨'}
                          {platform === 'eBay' && '🏪'}
                          {platform === 'Shopify' && '🛍️'}
                          {platform === 'Gumroad' && '💻'}
                        </div>
                        <span className="font-medium">{platform}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSearching || !searchTerm.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSearching ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Analyse en cours...
                  </div>
                ) : (
                  'Analyser les Mots-clés'
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir Digitallz ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète avec des outils avancés pour maximiser vos ventes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <MagnifyingGlassIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Recherche Multi-Plateformes
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Analysez simultanément les mots-clés sur Amazon, Etsy, eBay, Shopify et Gumroad avec une interface unifiée.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="bg-gradient-to-r from-green-500 to-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Analytics Avancées
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Obtenez des insights détaillés sur le volume de recherche, la concurrence et le potentiel de revenus.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <BoltIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Temps Réel
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Données mises à jour en temps réel pour des décisions éclairées et une réactivité maximale.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <GlobeAltIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Couverture Mondiale
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Analysez les tendances et opportunités dans plus de 50 pays et régions différentes.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="bg-gradient-to-r from-red-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Sécurité & Confidentialité
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Vos données sont protégées avec un chiffrement de niveau bancaire et une conformité RGPD.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                ROI Garanti
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Nos utilisateurs voient en moyenne une augmentation de 300% de leurs ventes en 3 mois.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Des Résultats qui Parlent
            </h2>
            <p className="text-xl text-blue-100">
              Rejoignez des milliers d'entrepreneurs qui font confiance à Digitallz
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Utilisateurs Actifs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">1M+</div>
              <div className="text-blue-100">Mots-clés Analysés</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">300%</div>
              <div className="text-blue-100">Augmentation Moyenne des Ventes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Temps de Disponibilité</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Prêt à Révolutionner vos Ventes ?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Rejoignez la communauté Digitallz et découvrez les mots-clés qui vont transformer votre business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
              Commencer Gratuitement
            </button>
            <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-200">
              Planifier une Démo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Digitallz
              </h3>
              <p className="text-gray-400 mb-4">
                La plateforme de référence pour l'analyse de mots-clés et l'optimisation des ventes.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Produit</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Intégrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Statut</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Légal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mentions légales</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Politique de confidentialité</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">CGU</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">RGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Digitallz. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}