#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
config()

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Setting up database...')
  
  try {
    // Check if database exists
    console.log('🔍 Checking database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Run migrations
    console.log('📦 Running database migrations...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('✅ Migrations completed')

    // Generate Prisma client
    console.log('🔧 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Prisma client generated')

    // Check if we should seed the database
    const shouldSeed = process.argv.includes('--seed') || process.env.SEED_DATABASE === 'true'
    
    if (shouldSeed) {
      console.log('🌱 Seeding database...')
      execSync('npx ts-node scripts/seed.ts', { stdio: 'inherit' })
      console.log('✅ Database seeded')
    }

    // Verify setup
    console.log('✅ Verifying database setup...')
    
    // Check tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log('📋 Available tables:', tables)

    // Check indexes
    const indexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `
    console.log('🔍 Available indexes:', indexes)

    // Check constraints
    const constraints = await prisma.$queryRaw`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_type
    `
    console.log('🔒 Available constraints:', constraints)

    // Get database statistics
    const stats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    console.log('📊 Database statistics:', stats)

    // Check database size
    const dbSize = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `
    console.log('📏 Database size:', dbSize)

    // Create backup directory
    const backupDir = process.env.BACKUP_DIR || './backups'
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
      console.log(`📁 Created backup directory: ${backupDir}`)
    }

    // Create logs directory
    const logsDir = process.env.LOGS_DIR || './logs'
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
      console.log(`📁 Created logs directory: ${logsDir}`)
    }

    // Set up cron jobs for maintenance
    console.log('⏰ Setting up maintenance tasks...')
    
    const cronJobs = [
      {
        name: 'Database Backup',
        schedule: '0 2 * * *', // Daily at 2 AM
        command: `cd ${process.cwd()} && npm run db:backup`
      },
      {
        name: 'Database Maintenance',
        schedule: '0 3 * * 0', // Weekly on Sunday at 3 AM
        command: `cd ${process.cwd()} && npm run db:maintenance`
      }
    ]

    // Create cron jobs file
    const cronFile = path.join(process.cwd(), 'crontab.txt')
    const cronContent = cronJobs.map(job => 
      `${job.schedule} ${job.command} # ${job.name}`
    ).join('\n')
    
    fs.writeFileSync(cronFile, cronContent)
    console.log(`📝 Created cron jobs file: ${cronFile}`)
    console.log('ℹ️ To install cron jobs, run: crontab crontab.txt')

    // Create environment validation
    console.log('🔍 Validating environment...')
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'REDIS_URL',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY'
    ]

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.warn('⚠️ Missing environment variables:', missingVars)
      console.warn('ℹ️ Please check your .env file')
    } else {
      console.log('✅ All required environment variables are set')
    }

    // Create health check endpoint
    console.log('🏥 Setting up health check...')
    const healthCheck = `
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.\$queryRaw\`SELECT 1\`
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    })
  }
})
`
    
    const healthCheckFile = path.join(process.cwd(), 'health-check.js')
    fs.writeFileSync(healthCheckFile, healthCheck)
    console.log(`📝 Created health check file: ${healthCheckFile}`)

    console.log('🎉 Database setup completed successfully!')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Start the application: npm run dev')
    console.log('2. Check health: curl http://localhost:3001/health')
    console.log('3. Install cron jobs: crontab crontab.txt')
    console.log('4. Monitor logs: tail -f logs/app.log')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
