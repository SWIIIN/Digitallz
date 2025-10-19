#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
config()

const prisma = new PrismaClient()

interface RestoreConfig {
  databaseUrl: string
  backupDir: string
  backupFile: string
  createDatabase: boolean
}

async function main() {
  console.log('🔄 Starting database restore...')
  
  try {
    const args = process.argv.slice(2)
    const backupFile = args[0]
    
    if (!backupFile) {
      console.error('❌ Please provide a backup file name')
      console.log('Usage: npm run restore <backup-file>')
      process.exit(1)
    }

    const config: RestoreConfig = {
      databaseUrl: process.env.DATABASE_URL || '',
      backupDir: process.env.BACKUP_DIR || './backups',
      backupFile: backupFile,
      createDatabase: process.env.CREATE_DATABASE === 'true'
    }

    const backupPath = path.join(config.backupDir, config.backupFile)
    
    // Check if backup file exists
    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Backup file not found: ${backupPath}`)
      process.exit(1)
    }

    console.log(`📁 Restoring from: ${config.backupFile}`)

    // Extract database connection details
    const url = new URL(config.databaseUrl)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.slice(1)
    const username = url.username
    const password = url.password

    // Set PGPASSWORD environment variable
    process.env.PGPASSWORD = password

    // Check if backup is compressed
    const isCompressed = config.backupFile.endsWith('.gz')
    
    if (isCompressed) {
      console.log('🗜️ Decompressing backup...')
      const tempFile = backupPath.replace('.gz', '.sql')
      execSync(`gunzip -c "${backupPath}" > "${tempFile}"`)
      config.backupFile = path.basename(tempFile)
    }

    // Verify backup file
    console.log('✅ Verifying backup file...')
    try {
      execSync(`pg_restore --list "${backupPath}" > /dev/null`, { stdio: 'pipe' })
      console.log('✅ Backup file verified')
    } catch (error) {
      console.error('❌ Backup file verification failed:', error)
      process.exit(1)
    }

    // Drop existing database if requested
    if (config.createDatabase) {
      console.log('🗑️ Dropping existing database...')
      try {
        execSync(`dropdb --host=${host} --port=${port} --username=${username} ${database}`, { stdio: 'pipe' })
        console.log('✅ Existing database dropped')
      } catch (error) {
        console.log('ℹ️ Database does not exist or already dropped')
      }
    }

    // Create database if requested
    if (config.createDatabase) {
      console.log('🏗️ Creating new database...')
      execSync(`createdb --host=${host} --port=${port} --username=${username} ${database}`, { stdio: 'inherit' })
      console.log('✅ Database created')
    }

    // Restore database
    console.log('🔄 Restoring database...')
    const restoreCmd = [
      'psql',
      `--host=${host}`,
      `--port=${port}`,
      `--username=${username}`,
      `--dbname=${database}`,
      '--file=' + (isCompressed ? backupPath.replace('.gz', '.sql') : backupPath)
    ].join(' ')

    execSync(restoreCmd, { stdio: 'inherit' })
    console.log('✅ Database restored')

    // Clean up temporary file if compressed
    if (isCompressed) {
      const tempFile = backupPath.replace('.gz', '.sql')
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile)
        console.log('🧹 Temporary file cleaned up')
      }
    }

    // Verify restore
    console.log('✅ Verifying restore...')
    await prisma.$connect()
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('📋 Restored tables:', tables)

    // Check record counts
    const userCount = await prisma.user.count()
    const keywordCount = await prisma.keyword.count()
    const searchCount = await prisma.searchHistory.count()
    
    console.log('📊 Restored data:')
    console.log(`   Users: ${userCount}`)
    console.log(`   Keywords: ${keywordCount}`)
    console.log(`   Search History: ${searchCount}`)

    // Log restore completion
    const logEntry = {
      timestamp: new Date().toISOString(),
      backupFile: config.backupFile,
      status: 'success',
      userCount,
      keywordCount,
      searchCount
    }

    const logFile = path.join(config.backupDir, 'restore.log')
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n')

    console.log('🎉 Database restore completed successfully!')
    
  } catch (error) {
    console.error('❌ Restore failed:', error)
    
    // Log restore failure
    const logEntry = {
      timestamp: new Date().toISOString(),
      backupFile: process.argv[2] || 'unknown',
      status: 'failed',
      error: error.message
    }

    const logFile = path.join(process.env.BACKUP_DIR || './backups', 'restore.log')
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n')
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
