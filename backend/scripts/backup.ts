#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
config()

const prisma = new PrismaClient()

interface BackupConfig {
  databaseUrl: string
  backupDir: string
  retentionDays: number
  compression: boolean
}

async function main() {
  console.log('💾 Starting database backup...')
  
  try {
    const config: BackupConfig = {
      databaseUrl: process.env.DATABASE_URL || '',
      backupDir: process.env.BACKUP_DIR || './backups',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      compression: process.env.BACKUP_COMPRESSION === 'true'
    }

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(config.backupDir)) {
      fs.mkdirSync(config.backupDir, { recursive: true })
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = `digitallz-backup-${timestamp}.sql`
    const backupPath = path.join(config.backupDir, backupFile)

    console.log(`📁 Creating backup: ${backupFile}`)

    // Extract database connection details
    const url = new URL(config.databaseUrl)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.slice(1)
    const username = url.username
    const password = url.password

    // Set PGPASSWORD environment variable
    process.env.PGPASSWORD = password

    // Create pg_dump command
    const pgDumpCmd = [
      'pg_dump',
      `--host=${host}`,
      `--port=${port}`,
      `--username=${username}`,
      `--dbname=${database}`,
      '--verbose',
      '--clean',
      '--if-exists',
      '--create',
      '--format=plain',
      `--file=${backupPath}`
    ].join(' ')

    console.log('🔄 Running pg_dump...')
    execSync(pgDumpCmd, { stdio: 'inherit' })

    // Compress backup if enabled
    if (config.compression) {
      console.log('🗜️ Compressing backup...')
      const compressedFile = `${backupFile}.gz`
      const compressedPath = path.join(config.backupDir, compressedFile)
      
      execSync(`gzip -c "${backupPath}" > "${compressedPath}"`)
      
      // Remove uncompressed file
      fs.unlinkSync(backupPath)
      
      console.log(`✅ Compressed backup created: ${compressedFile}`)
    } else {
      console.log(`✅ Backup created: ${backupFile}`)
    }

    // Clean up old backups
    console.log('🧹 Cleaning up old backups...')
    const files = fs.readdirSync(config.backupDir)
    const backupFiles = files.filter(file => file.startsWith('digitallz-backup-'))
    
    const cutoffDate = new Date(Date.now() - config.retentionDays * 24 * 60 * 60 * 1000)
    
    for (const file of backupFiles) {
      const filePath = path.join(config.backupDir, file)
      const stats = fs.statSync(filePath)
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath)
        console.log(`🗑️ Deleted old backup: ${file}`)
      }
    }

    // Verify backup integrity
    console.log('✅ Verifying backup integrity...')
    const verifyCmd = config.compression 
      ? `gunzip -t "${path.join(config.backupDir, `${backupFile}.gz`)}"`
      : `pg_restore --list "${backupPath}" > /dev/null`
    
    try {
      execSync(verifyCmd, { stdio: 'pipe' })
      console.log('✅ Backup integrity verified')
    } catch (error) {
      console.error('❌ Backup integrity check failed:', error)
      process.exit(1)
    }

    // Get backup statistics
    const backupStats = fs.statSync(path.join(config.backupDir, config.compression ? `${backupFile}.gz` : backupFile))
    const sizeInMB = (backupStats.size / (1024 * 1024)).toFixed(2)
    
    console.log(`📊 Backup statistics:`)
    console.log(`   File: ${config.compression ? `${backupFile}.gz` : backupFile}`)
    console.log(`   Size: ${sizeInMB} MB`)
    console.log(`   Created: ${backupStats.mtime.toISOString()}`)

    // Log backup completion
    const logEntry = {
      timestamp: new Date().toISOString(),
      backupFile: config.compression ? `${backupFile}.gz` : backupFile,
      size: backupStats.size,
      status: 'success'
    }

    const logFile = path.join(config.backupDir, 'backup.log')
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n')

    console.log('🎉 Database backup completed successfully!')
    
  } catch (error) {
    console.error('❌ Backup failed:', error)
    
    // Log backup failure
    const logEntry = {
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: error.message
    }

    const logFile = path.join(process.env.BACKUP_DIR || './backups', 'backup.log')
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n')
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
