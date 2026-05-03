import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/runs/[id] — Get a single run with all step results
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const run = await prisma.workflowRun.findUnique({
      where: { id: params.id },
      include: {
        stepResults: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    if (!run) {
      return NextResponse.json(
        { ok: false, error: 'Run not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true, run })
  } catch (error: any) {
    console.error('Failed to get run:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to get run' },
      { status: 500 }
    )
  }
}

// DELETE /api/runs/[id] — Delete a run
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.workflowRun.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to delete run' },
      { status: 500 }
    )
  }
}

