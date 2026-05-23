import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workflows/[id] — load a specific workflow (includes config JSON)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id },
    })

    if (!workflow) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    }

    if (workflow.userId !== userId) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ ok: true, workflow })
  } catch (error: any) {
    console.error('GET /api/workflows/[id] failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// PUT /api/workflows/[id] — overwrite an existing workflow's name and/or config
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.workflow.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    if (existing.userId !== userId) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { name, config } = body

    const updated = await prisma.workflow.update({
      where: { id: params.id },
      data: {
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(config !== undefined ? { config: typeof config === 'string' ? config : JSON.stringify(config) } : {}),
      },
    })

    return NextResponse.json({ ok: true, workflow: updated })
  } catch (error: any) {
    console.error('PUT /api/workflows/[id] failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// DELETE /api/workflows/[id] — delete a saved workflow
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.workflow.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    if (existing.userId !== userId) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

    await prisma.workflow.delete({ where: { id: params.id } })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DELETE /api/workflows/[id] failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
