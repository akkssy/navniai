import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/runs — Save a completed run
export async function POST(request: NextRequest) {
  try {
    // Extract user from session (optional — guests can still save runs)
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id || null

    const body = await request.json()
    const {
      pipelineType = 'custom',
      name = 'Untitled Run',
      status = 'completed',
      briefJson,
      executionTime,
      stepsTotal = 0,
      stepsCompleted = 0,
      steps = [],
    } = body

    // Create the run first (without nested stepResults to avoid relation issues)
    const run = await prisma.workflowRun.create({
      data: {
        pipelineType,
        name,
        status,
        userId,
        briefJson: typeof briefJson === 'string' ? briefJson : briefJson ? JSON.stringify(briefJson) : null,
        executionTime,
        stepsTotal,
        stepsCompleted,
        completedAt: status === 'completed' ? new Date() : null,
      },
    })

    // Create step results separately (with structured JSON support)
    if (steps.length > 0) {
      await prisma.stepResult.createMany({
        data: steps.map((step: any, i: number) => ({
          workflowRunId: run.id,
          stepId: step.stepId || `step-${i}`,
          agentId: step.agentId || 'unknown',
          agentName: step.agentName || '',
          action: step.action || 'execute',
          status: step.status || 'completed',
          output: step.output || '',
          provider: step.provider || 'simulated',
          structuredJson: step.structured ? (typeof step.structured === 'string' ? step.structured : JSON.stringify(step.structured)) : null,
          orderIndex: step.orderIndex ?? i,
        })),
      })
    }

    // Fetch back with step results
    const fullRun = await prisma.workflowRun.findUnique({
      where: { id: run.id },
      include: { stepResults: { orderBy: { orderIndex: 'asc' } } },
    })

    return NextResponse.json({ ok: true, run: fullRun })
  } catch (error: any) {
    console.error('Failed to save run:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to save run' },
      { status: 500 }
    )
  }
}

// GET /api/runs — List recent runs (filtered by user when authenticated)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id || null

    const { searchParams } = new URL(request.url)

    // ?counts=true → return per-template run counts (used by dashboard template cards)
    if (searchParams.get('counts') === 'true') {
      const where = userId ? { userId } : {}
      const rows = await prisma.workflowRun.groupBy({
        by: ['pipelineType'],
        where,
        _count: { id: true },
        _max: { startedAt: true },
      })
      const counts: Record<string, { count: number; lastRunAt: string | null }> = {}
      for (const row of rows) {
        counts[row.pipelineType] = {
          count: row._count.id,
          lastRunAt: row._max.startedAt ? row._max.startedAt.toISOString() : null,
        }
      }
      return NextResponse.json({ ok: true, counts })
    }
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const pipelineType = searchParams.get('type') || undefined

    // Build where clause: filter by user if authenticated, show all guest runs if not
    const where: any = {}
    if (userId) where.userId = userId
    if (pipelineType) where.pipelineType = pipelineType

    const runs = await prisma.workflowRun.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        stepResults: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    // Compute aggregate stats (scoped to user)
    const statsWhere = userId ? { userId } : {}
    const totalRuns = await prisma.workflowRun.count({ where: statsWhere })
    const completedRuns = await prisma.workflowRun.count({ where: { ...statsWhere, status: 'completed' } })
    const avgTime = await prisma.workflowRun.aggregate({
      _avg: { executionTime: true },
      where: { ...statsWhere, status: 'completed', executionTime: { not: null } },
    })

    return NextResponse.json({
      ok: true,
      runs,
      stats: {
        totalRuns,
        completedRuns,
        failedRuns: totalRuns - completedRuns,
        avgExecutionTime: avgTime._avg.executionTime || 0,
      },
    })
  } catch (error: any) {
    console.error('Failed to list runs:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to list runs' },
      { status: 500 }
    )
  }
}

