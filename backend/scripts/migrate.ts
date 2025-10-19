#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { config } from 'dotenv'

// Load environment variables
config()

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting database migration...')
  
  try {
    // Run Prisma migrations
    console.log('📦 Running Prisma migrations...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    
    // Generate Prisma client
    console.log('🔧 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    
    // Run database seeds
    console.log('🌱 Running database seeds...')
    execSync('npx ts-node scripts/seed.ts', { stdio: 'inherit' })
    
    // Verify database connection
    console.log('✅ Verifying database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Check tables
    console.log('📊 Checking database tables...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('📋 Available tables:', tables)
    
    console.log('🎉 Database migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
