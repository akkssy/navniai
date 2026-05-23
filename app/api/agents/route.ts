import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agents = await prisma.customAgent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    ok: true,
    agents: agents.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      icon: a.icon,
      systemPrompt: a.systemPrompt,
      ...JSON.parse(a.config || '{}'),
    })),
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, name, type, icon, systemPrompt, ...rest } = await request.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  // Upsert by id if provided (client-side UUID may already exist)
  const config = JSON.stringify(rest)

  let agent
  if (id) {
    // Check ownership first
    const existing = await prisma.customAgent.findFirst({ where: { id, userId: session.user.id } })
    if (existing) {
      agent = await prisma.customAgent.update({
        where: { id },
        data: { name, type: type || 'custom', icon: icon || '🤖', systemPrompt: systemPrompt || '', config },
      })
    } else {
      agent = await prisma.customAgent.create({
        data: { id, userId: session.user.id, name, type: type || 'custom', icon: icon || '🤖', systemPrompt: systemPrompt || '', config },
      })
    }
  } else {
    agent = await prisma.customAgent.create({
      data: { userId: session.user.id, name, type: type || 'custom', icon: icon || '🤖', systemPrompt: systemPrompt || '', config },
    })
  }

  return NextResponse.json({ ok: true, agent: { id: agent.id, name: agent.name, type: agent.type, icon: agent.icon, systemPrompt: agent.systemPrompt } })
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const agent = await prisma.customAgent.findFirst({ where: { id, userId: session.user.id } })
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.customAgent.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
