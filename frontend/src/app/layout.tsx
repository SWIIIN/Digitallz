import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Digitallz - Plateforme de Recherche de Mots-clés',
    template: '%s | Digitallz'
  },
  description: 'La plateforme la plus avancée pour analyser et optimiser vos mots-clés sur Amazon, Etsy, eBay, Shopify et Gumroad. Maximisez vos ventes avec des insights en temps réel.',
  keywords: [
    'mots-clés',
    'recherche',
    'amazon',
    'etsy', 
    'ebay',
    'shopify',
    'gumroad',
    'produits digitaux',
    'seo',
    'marketing digital',
    'e-commerce',
    'analyse',
    'optimisation',
    'ventes'
  ],
  authors: [{ name: 'Digitallz Team', url: 'https://digitallz.com' }],
  creator: 'Digitallz Team',
  publisher: 'Digitallz',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://digitallz.com'),
  alternates: {
    canonical: '/',
    languages: {
      'fr-FR': '/fr',
      'en-US': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://digitallz.com',
    title: 'Digitallz - Plateforme de Recherche de Mots-clés',
    description: 'Analysez et optimisez vos mots-clés sur toutes les plateformes de vente en ligne',
    siteName: 'Digitallz',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Digitallz - Plateforme de Recherche de Mots-clés',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digitallz - Plateforme de Recherche de Mots-clés',
    description: 'Analysez et optimisez vos mots-clés sur toutes les plateformes de vente en ligne',
    images: ['/twitter-image.jpg'],
    creator: '@digitallz',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'technology',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Digitallz" />
        <meta name="application-name" content="Digitallz" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(0, 0, 0, 0.9)',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
                style: {
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                style: {
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                },
              },
              loading: {
                duration: Infinity,
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#fff',
                },
                style: {
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}