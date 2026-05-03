import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/memory — Persist scratchpad entries from a workflow run
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id || null

    const { workflowName, entries } = await request.json()
    if (!workflowName || !entries || typeof entries !== 'object') {
      return NextResponse.json({ ok: false, error: 'workflowName and entries required' }, { status: 400 })
    }

    // Upsert each scratchpad entry
    const upserts = Object.entries(entries).map(([key, value]) =>
      prisma.agentMemory.upsert({
        where: {
          userId_workflowName_key: {
            userId: userId || '__guest__',
            workflowName,
            key,
          },
        },
        update: { value: String(value) },
        create: {
          userId: userId || '__guest__',
          workflowName,
          key,
          value: String(value),
        },
      })
    )

    await Promise.all(upserts)
    return NextResponse.json({ ok: true, saved: Object.keys(entries).length })
  } catch (error: any) {
    console.error('Memory save failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// GET /api/memory?workflow=<name> — Retrieve persisted memory for a workflow
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id || '__guest__'

    const { searchParams } = new URL(request.url)
    const workflowName = searchParams.get('workflow')
    if (!workflowName) {
      return NextResponse.json({ ok: false, error: 'workflow query param required' }, { status: 400 })
    }

    const memories = await prisma.agentMemory.findMany({
      where: { userId, workflowName },
      orderBy: { updatedAt: 'desc' },
    })

    const entries: Record<string, string> = {}
    for (const m of memories) {
      entries[m.key] = m.value
    }

    return NextResponse.json({ ok: true, entries, count: memories.length })
  } catch (error: any) {
    console.error('Memory read failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
