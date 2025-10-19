import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function globalTeardown() {
  // Clean up test database
  try {
    // Delete all test data
    await prisma.keywordSearch.deleteMany()
    await prisma.keywordData.deleteMany()
    await prisma.analytics.deleteMany()
    await prisma.subscription.deleteMany()
    await prisma.user.deleteMany()
    
    await prisma.$disconnect()
    console.log('✅ Test database cleaned up')
  } catch (error) {
    console.error('❌ Failed to clean up test database:', error)
    throw error
  }
}
