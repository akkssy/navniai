import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workflows — list all saved workflows for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const workflows = await prisma.workflow.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        runs: true,
        lastRunAt: true,
        createdAt: true,
        updatedAt: true,
        // omit config (large JSON) from list — fetch individually when loading
      },
    })

    return NextResponse.json({ ok: true, workflows })
  } catch (error: any) {
    console.error('GET /api/workflows failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// POST /api/workflows — create a new saved workflow
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, config } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 })
    }

    const workflow = await prisma.workflow.create({
      data: {
        userId,
        name: name.trim(),
        status: 'active',
        config: typeof config === 'string' ? config : JSON.stringify(config ?? {}),
      },
    })

    return NextResponse.json({ ok: true, workflow }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/workflows failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
