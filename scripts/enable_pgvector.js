// Enable pgvector extension on Neon PostgreSQL
const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;')
    console.log('✅ pgvector extension enabled successfully')
  } catch (e) {
    console.error('❌ Failed to enable pgvector:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

