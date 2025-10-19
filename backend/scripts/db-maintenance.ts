#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Load environment variables
config()

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Starting database maintenance...')
  
  try {
    // Analyze tables for query optimization
    console.log('📊 Analyzing tables for optimization...')
    await prisma.$executeRaw`ANALYZE;`
    console.log('✅ Table analysis completed')

    // Vacuum tables to reclaim space
    console.log('🧹 Vacuuming tables...')
    await prisma.$executeRaw`VACUUM;`
    console.log('✅ Table vacuuming completed')

    // Update table statistics
    console.log('📈 Updating table statistics...')
    await prisma.$executeRaw`ANALYZE;`
    console.log('✅ Table statistics updated')

    // Check database size
    console.log('📏 Checking database size...')
    const dbSize = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `
    console.log('📊 Database size:', dbSize)

    // Check table sizes
    console.log('📋 Checking table sizes...')
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `
    console.log('📊 Table sizes:', tableSizes)

    // Check index usage
    console.log('🔍 Checking index usage...')
    const indexUsage = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
    `
    console.log('📊 Index usage:', indexUsage)

    // Check slow queries
    console.log('🐌 Checking slow queries...')
    const slowQueries = await prisma.$queryRaw`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements 
      WHERE mean_time > 1000
      ORDER BY mean_time DESC
      LIMIT 10
    `
    console.log('📊 Slow queries:', slowQueries)

    // Check connection count
    console.log('🔗 Checking connection count...')
    const connections = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
    `
    console.log('📊 Connection status:', connections)

    // Clean up old data
    console.log('🧹 Cleaning up old data...')
    
    // Delete old search history (older than 1 year)
    const deletedSearches = await prisma.searchHistory.deleteMany({
      where: {
        searchDate: {
          lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        }
      }
    })
    console.log(`✅ Deleted ${deletedSearches.count} old search records`)

    // Delete old trends (older than 2 years)
    const deletedTrends = await prisma.trend.deleteMany({
      where: {
        date: {
          lt: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
        }
      }
    })
    console.log(`✅ Deleted ${deletedTrends.count} old trend records`)

    // Update platform data
    console.log('🔄 Updating platform data...')
    const platforms = await prisma.platformData.findMany()
    
    for (const platform of platforms) {
      const stats = await prisma.keyword.aggregate({
        where: { platform: platform.platform },
        _count: { id: true },
        _avg: { 
          searchVolume: true,
          competition: true,
          cpc: true
        }
      })

      await prisma.platformData.update({
        where: { id: platform.id },
        data: {
          totalKeywords: stats._count.id,
          avgSearchVolume: Math.floor(stats._avg.searchVolume || 0),
          avgCompetition: Math.floor(stats._avg.competition || 0),
          avgCpc: Math.floor((stats._avg.cpc || 0) * 100) / 100,
          lastUpdated: new Date()
        }
      })
    }
    console.log('✅ Platform data updated')

    console.log('🎉 Database maintenance completed successfully!')
    
  } catch (error) {
    console.error('❌ Maintenance failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
