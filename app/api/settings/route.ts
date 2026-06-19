import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await prisma.lLMSettings.findUnique({ where: { userId } })
  if (!row) return NextResponse.json({ ok: true, settings: null })

  return NextResponse.json({
    ok: true,
    settings: {
      activeProvider: row.activeProvider,
      fallbackChain: row.fallbackChain.split(',').filter(Boolean),
      providers: JSON.parse(row.providersJson || '{}'),
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { activeProvider, fallbackChain, providers } = await request.json()

  await prisma.lLMSettings.upsert({
    where: { userId },
    create: {
      userId,
      activeProvider: activeProvider || 'ollama',
      fallbackChain: Array.isArray(fallbackChain) ? fallbackChain.join(',') : fallbackChain || '',
      providersJson: JSON.stringify(providers || {}),
    },
    update: {
      activeProvider: activeProvider || 'ollama',
      fallbackChain: Array.isArray(fallbackChain) ? fallbackChain.join(',') : fallbackChain || '',
      providersJson: JSON.stringify(providers || {}),
    },
  })

  return NextResponse.json({ ok: true })
}
