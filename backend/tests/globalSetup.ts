import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function globalSetup() {
  // Create test database if it doesn't exist
  try {
    await prisma.$connect()
    console.log('✅ Test database connected')
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error)
    throw error
  }
}
