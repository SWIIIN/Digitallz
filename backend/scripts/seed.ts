#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import bcrypt from 'bcryptjs'

// Load environment variables
config()

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')
  
  try {
    // Create admin user
    console.log('👤 Creating admin user...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@digitallz.com' },
      update: {},
      create: {
        email: 'admin@digitallz.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Digitallz',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        subscription: {
          create: {
            plan: 'ENTERPRISE',
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            features: ['UNLIMITED_SEARCHES', 'ALL_PLATFORMS', 'API_ACCESS', 'PRIORITY_SUPPORT']
          }
        }
      }
    })
    console.log('✅ Admin user created:', adminUser.email)

    // Create test users
    console.log('👥 Creating test users...')
    const testUsers = [
      {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER' as const,
        plan: 'PRO' as const
      },
      {
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'USER' as const,
        plan: 'BUSINESS' as const
      },
      {
        email: 'bob.wilson@example.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        role: 'USER' as const,
        plan: 'FREE' as const
      }
    ]

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash('password123', 10)
      
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          isActive: true,
          emailVerified: true,
          subscription: {
            create: {
              plan: userData.plan,
              status: 'ACTIVE',
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              features: userData.plan === 'FREE' 
                ? ['BASIC_SEARCHES', 'ONE_PLATFORM']
                : userData.plan === 'PRO'
                ? ['ENHANCED_SEARCHES', 'MULTIPLE_PLATFORMS', 'ANALYTICS']
                : ['UNLIMITED_SEARCHES', 'ALL_PLATFORMS', 'API_ACCESS', 'PRIORITY_SUPPORT']
            }
          }
        }
      })
      console.log('✅ Test user created:', user.email)
    }

    // Create sample keywords
    console.log('🔍 Creating sample keywords...')
    const sampleKeywords = [
      {
        term: 'digital marketing course',
        platform: 'amazon' as const,
        searchVolume: 1500,
        trend: 'up' as const,
        competition: 'medium' as const,
        potentialRevenue: 5000,
        cpc: 2.50,
        difficulty: 65
      },
      {
        term: 'online business course',
        platform: 'amazon' as const,
        searchVolume: 2100,
        trend: 'stable' as const,
        competition: 'high' as const,
        potentialRevenue: 3000,
        cpc: 3.20,
        difficulty: 80
      },
      {
        term: 'digital planner template',
        platform: 'etsy' as const,
        searchVolume: 3200,
        trend: 'up' as const,
        competition: 'low' as const,
        potentialRevenue: 2500,
        cpc: 1.80,
        difficulty: 45
      },
      {
        term: 'social media template',
        platform: 'etsy' as const,
        searchVolume: 2800,
        trend: 'up' as const,
        competition: 'low' as const,
        potentialRevenue: 1800,
        cpc: 1.50,
        difficulty: 40
      },
      {
        term: 'email marketing course',
        platform: 'gumroad' as const,
        searchVolume: 1200,
        trend: 'stable' as const,
        competition: 'medium' as const,
        potentialRevenue: 4000,
        cpc: 2.00,
        difficulty: 55
      }
    ]

    for (const keywordData of sampleKeywords) {
      const keyword = await prisma.keyword.upsert({
        where: { 
          term_platform: {
            term: keywordData.term,
            platform: keywordData.platform
          }
        },
        update: {
          searchVolume: keywordData.searchVolume,
          trend: keywordData.trend,
          competition: keywordData.competition,
          potentialRevenue: keywordData.potentialRevenue,
          cpc: keywordData.cpc,
          difficulty: keywordData.difficulty,
          lastUpdated: new Date()
        },
        create: {
          term: keywordData.term,
          platform: keywordData.platform,
          searchVolume: keywordData.searchVolume,
          trend: keywordData.trend,
          competition: keywordData.competition,
          potentialRevenue: keywordData.potentialRevenue,
          cpc: keywordData.cpc,
          difficulty: keywordData.difficulty,
          lastUpdated: new Date()
        }
      })
      console.log('✅ Sample keyword created:', keyword.term)
    }

    // Create sample search history
    console.log('📊 Creating sample search history...')
    const users = await prisma.user.findMany()
    const keywords = await prisma.keyword.findMany()

    for (let i = 0; i < 50; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)]
      
      await prisma.searchHistory.create({
        data: {
          userId: randomUser.id,
          keyword: randomKeyword.term,
          platform: randomKeyword.platform,
          resultsCount: Math.floor(Math.random() * 20) + 1,
          searchDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      })
    }
    console.log('✅ Sample search history created')

    // Create sample trends
    console.log('📈 Creating sample trends...')
    for (const keyword of keywords) {
      for (let i = 0; i < 30; i++) {
        const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
        const baseVolume = keyword.searchVolume
        const variation = (Math.random() - 0.5) * 0.3 // ±15% variation
        const volume = Math.floor(baseVolume * (1 + variation))
        
        await prisma.trend.create({
          data: {
            keywordId: keyword.id,
            date: date,
            searchVolume: volume,
            trendScore: Math.random() * 100,
            competitionScore: Math.random() * 100,
            opportunityScore: Math.random() * 100
          }
        })
      }
    }
    console.log('✅ Sample trends created')

    // Create sample platform data
    console.log('🌐 Creating sample platform data...')
    const platforms = ['amazon', 'etsy', 'ebay', 'shopify', 'gumroad']
    
    for (const platform of platforms) {
      await prisma.platformData.upsert({
        where: { platform },
        update: {
          totalKeywords: Math.floor(Math.random() * 10000) + 5000,
          avgSearchVolume: Math.floor(Math.random() * 2000) + 500,
          avgCompetition: Math.random() * 100,
          avgCpc: Math.random() * 5 + 1,
          lastUpdated: new Date()
        },
        create: {
          platform: platform as any,
          totalKeywords: Math.floor(Math.random() * 10000) + 5000,
          avgSearchVolume: Math.floor(Math.random() * 2000) + 500,
          avgCompetition: Math.random() * 100,
          avgCpc: Math.random() * 5 + 1,
          lastUpdated: new Date()
        }
      })
    }
    console.log('✅ Sample platform data created')

    console.log('🎉 Database seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
