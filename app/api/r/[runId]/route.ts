import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** Public endpoint — no auth required. Returns run + step results for shareable pages. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const run = await prisma.workflowRun.findUnique({
      where: { id: params.runId },
      include: {
        stepResults: { orderBy: { orderIndex: 'asc' } },
      },
    })
    if (!run) {
      return NextResponse.json({ ok: false, error: 'Run not found' }, { status: 404 })
    }
    // Strip userId from the public response
    const { userId: _userId, ...publicRun } = run as any
    return NextResponse.json({ ok: true, run: publicRun })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to load run' },
      { status: 500 }
    )
  }
}
