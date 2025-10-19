# 🎨 Frontend Architecture - Next.js 14

## 📁 Structure du projet

```
frontend/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── (auth)/            # Route group pour auth
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/          # Dashboard principal
│   │   │   ├── keywords/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── api/               # API routes
│   │   │   ├── auth/
│   │   │   ├── keywords/
│   │   │   └── webhooks/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # Composants réutilisables
│   │   ├── ui/               # Composants de base
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── index.ts
│   │   ├── forms/            # Formulaires
│   │   │   ├── SearchForm.tsx
│   │   │   ├── AuthForm.tsx
│   │   │   └── SettingsForm.tsx
│   │   ├── charts/           # Graphiques
│   │   │   ├── KeywordChart.tsx
│   │   │   ├── TrendChart.tsx
│   │   │   └── VolumeChart.tsx
│   │   └── layout/           # Layout components
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   ├── lib/                  # Utilitaires et configs
│   │   ├── auth.ts
│   │   ├── api.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── hooks/                # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useKeywords.ts
│   │   └── useAnalytics.ts
│   ├── store/                # State management
│   │   ├── authStore.ts
│   │   ├── keywordStore.ts
│   │   └── uiStore.ts
│   ├── types/                # TypeScript types
│   │   ├── auth.ts
│   │   ├── keyword.ts
│   │   └── api.ts
│   └── styles/               # Styles globaux
│       ├── globals.css
│       └── components.css
├── public/                   # Assets statiques
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── .env.local
```

## 🎯 Composants principaux

### 1. Dashboard Principal
```typescript
// src/app/dashboard/page.tsx
import { KeywordSearch } from '@/components/forms/KeywordSearch'
import { KeywordResults } from '@/components/charts/KeywordResults'
import { RecentSearches } from '@/components/ui/RecentSearches'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Keyword Research Dashboard
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <KeywordSearch />
            <KeywordResults />
          </div>
          <div className="lg:col-span-1">
            <RecentSearches />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2. Formulaire de recherche
```typescript
// src/components/forms/KeywordSearch.tsx
'use client'

import { useState } from 'react'
import { useKeywordStore } from '@/store/keywordStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export function KeywordSearch() {
  const [keyword, setKeyword] = useState('')
  const [platform, setPlatform] = useState('amazon')
  const { searchKeywords, isLoading } = useKeywordStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return
    
    await searchKeywords({
      keyword: keyword.trim(),
      platform,
      includeRelated: true,
      includeTrends: true
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Rechercher des mots-clés</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Entrez un mot-clé..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="md:col-span-2"
        />
        
        <Select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          options={[
            { value: 'amazon', label: 'Amazon' },
            { value: 'etsy', label: 'Etsy' },
            { value: 'ebay', label: 'eBay' },
            { value: 'shopify', label: 'Shopify' }
          ]}
        />
      </div>
      
      <Button
        type="submit"
        disabled={isLoading || !keyword.trim()}
        className="mt-4 w-full md:w-auto"
      >
        {isLoading ? 'Recherche...' : 'Rechercher'}
      </Button>
    </form>
  )
}
```

### 3. Résultats de recherche
```typescript
// src/components/charts/KeywordResults.tsx
'use client'

import { useKeywordStore } from '@/store/keywordStore'
import { KeywordChart } from './KeywordChart'
import { TrendChart } from './TrendChart'
import { VolumeChart } from './VolumeChart'

export function KeywordResults() {
  const { currentResults, isLoading } = useKeywordStore()

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!currentResults) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <p className="text-gray-500">Aucune recherche effectuée</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Résultats de recherche</h3>
        <KeywordChart data={currentResults.keywords} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Tendances</h3>
          <TrendChart data={currentResults.trends} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Volume de recherche</h3>
          <VolumeChart data={currentResults.volumes} />
        </div>
      </div>
    </div>
  )
}
```

## 🔧 Configuration

### Next.js Config
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
```

### Tailwind Config
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

## 📱 Responsive Design

### Breakpoints
- **Mobile** : < 640px
- **Tablet** : 640px - 1024px
- **Desktop** : > 1024px

### Composants adaptatifs
```typescript
// Exemple de composant responsive
export function ResponsiveGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {children}
    </div>
  )
}
```

## 🚀 Performance

### Optimisations
- **Code splitting** automatique avec Next.js
- **Image optimization** avec next/image
- **Lazy loading** des composants
- **Memoization** avec React.memo
- **Virtual scrolling** pour les grandes listes

### Bundle analysis
```bash
# Analyser la taille du bundle
npm run build
npm run analyze
```

## 🔒 Sécurité

### Authentification
```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Logique d'authentification
        const user = await authenticateUser(credentials)
        return user
      }
    })
  ],
  pages: {
    signIn: '/login',
    signUp: '/register'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.subscription = user.subscription
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.subscription = token.subscription
      return session
    }
  }
}
```

## 📊 Analytics

### Tracking des événements
```typescript
// src/lib/analytics.ts
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    // Google Analytics, Mixpanel, etc.
    gtag('event', event, properties)
  }
}

// Utilisation
trackEvent('keyword_search', {
  keyword: 'digital products',
  platform: 'amazon',
  user_tier: 'pro'
})
```
