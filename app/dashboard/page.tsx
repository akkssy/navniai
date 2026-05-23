'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { PlusIcon, PlayIcon, ClockIcon, ArrowRightOnRectangleIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { PIPELINE_TEMPLATES, getAgentForStep } from '@/lib/pipelineTemplates'
import ThemeToggle from '@/components/ThemeToggle'
import { listRuns as listLocalRuns, getRunStats as getLocalStats, deleteRun as deleteLocalRun, clearAllRuns as clearLocalRuns, type StoredRun, type RunStats } from '@/lib/runStorage'

// Normalize API run to StoredRun shape
function apiRunToStored(run: any): StoredRun {
  return {
    id: run.id,
    pipelineType: run.pipelineType || 'custom',
    name: run.name || 'Untitled',
    status: run.status || 'completed',
    briefJson: run.briefJson ? (typeof run.briefJson === 'string' ? JSON.parse(run.briefJson) : run.briefJson) : undefined,
    executionTime: run.executionTime || 0,
    stepsTotal: run.stepsTotal || 0,
    stepsCompleted: run.stepsCompleted || 0,
    startedAt: run.startedAt || new Date().toISOString(),
    completedAt: run.completedAt || undefined,
    steps: (run.stepResults || run.steps || []).map((s: any, i: number) => ({
      stepId: s.stepId || `step-${i}`,
      agentId: s.agentId || 'unknown',
      agentName: s.agentName || '',
      action: s.action || 'execute',
      status: s.status || 'completed',
      output: s.output || '',
      provider: s.provider || 'simulated',
      structured: s.structuredJson ? (typeof s.structuredJson === 'string' ? JSON.parse(s.structuredJson) : s.structuredJson) : (s.structured ?? null),
      orderIndex: s.orderIndex ?? i,
    })),
  }
}

export default function Dashboard() {
  const { data: session } = useSession()
  const workflows = PIPELINE_TEMPLATES
  const [recentRuns, setRecentRuns] = useState<StoredRun[]>([])
  const [stats, setStats] = useState<RunStats>({ totalRuns: 0, completedRuns: 0, failedRuns: 0, avgExecutionTime: 0 })
  const [loadingRuns, setLoadingRuns] = useState(true)
  const [usingApi, setUsingApi] = useState(false)
  const [savedWorkflows, setSavedWorkflows] = useState<{ id: string; name: string; updatedAt: string }[]>([])
  const [loadingWorkflows, setLoadingWorkflows] = useState(true)

  useEffect(() => {
    fetch('/api/workflows').then(r => r.json()).then(data => {
      if (data.ok && Array.isArray(data.workflows)) setSavedWorkflows(data.workflows)
    }).catch(() => {}).finally(() => setLoadingWorkflows(false))
  }, [])

  const refreshRuns = useCallback(async () => {
    // Try API first (PostgreSQL = source of truth)
    try {
      const res = await fetch('/api/runs?limit=10')
      const data = await res.json()
      if (data.ok && data.runs) {
        setRecentRuns(data.runs.map(apiRunToStored))
        setStats(data.stats || { totalRuns: 0, completedRuns: 0, failedRuns: 0, avgExecutionTime: 0 })
        setUsingApi(true)
        setLoadingRuns(false)
        return
      }
    } catch {
      // API unavailable — fall back to localStorage
    }
    // Fallback: localStorage
    setRecentRuns(listLocalRuns(10))
    setStats(getLocalStats())
    setUsingApi(false)
    setLoadingRuns(false)
  }, [])

  useEffect(() => {
    refreshRuns()
  }, [refreshRuns])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-surface-300 bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-3.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <SparklesIcon className="h-6 w-6 text-accent-500" />
                <span className="text-lg font-bold text-ink-700">NavniAI</span>
              </Link>
              <h1 className="text-sm font-medium text-ink-400">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2.5">
              {session?.user && (
                <span className="text-xs text-ink-400 mr-1">
                  {session.user.name || session.user.email}
                </span>
              )}
              <ThemeToggle />
              <Link href="/knowledge" className="btn-secondary text-xs px-3.5 py-2">
                🧠 Knowledge
              </Link>
              <Link href="/settings" className="btn-secondary text-xs px-3.5 py-2">
                ⚙️ LLM Settings
              </Link>
              <Link href="/workflow/new" className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5">
                <PlusIcon className="h-4 w-4" />
                New Workflow
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 text-red-500 hover:text-red-600"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Pipelines" value={String(workflows.length)} accent="text-accent-500" />
          <StatCard label="Completed Runs" value={String(stats.completedRuns)} accent="text-emerald-600" />
          <StatCard label="Total Runs" value={String(stats.totalRuns)} accent="text-amber-600" />
          <StatCard label="Avg Time" value={stats.avgExecutionTime > 0 ? `${stats.avgExecutionTime.toFixed(1)}s` : '—'} accent="text-violet-600" />
        </div>

        {/* Recent Runs */}
        {recentRuns.length > 0 && (
          <div className="glass-card overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-surface-300 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-700">Recent Runs</h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-ink-400">{stats.totalRuns} total</span>
                <button
                  onClick={async () => {
                    if (!confirm('Clear all run history?')) return
                    clearLocalRuns()
                    // Also clear from API if available
                    for (const run of recentRuns) {
                      fetch(`/api/runs/${run.id}`, { method: 'DELETE' }).catch(() => {})
                    }
                    refreshRuns()
                  }}
                  className="text-[10px] text-red-400 hover:text-red-600 transition"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="divide-y divide-surface-300">
              {recentRuns.map((run) => (
                <RecentRunRow key={run.id} run={run} onDelete={async () => {
                  deleteLocalRun(run.id)
                  fetch(`/api/runs/${run.id}`, { method: 'DELETE' }).catch(() => {})
                  refreshRuns()
                }} />
              ))}
            </div>
          </div>
        )}

        {loadingRuns && recentRuns.length === 0 && (
          <div className="glass-card p-8 text-center mb-8">
            <p className="text-sm text-ink-400 animate-pulse">Loading run history...</p>
          </div>
        )}

        {!loadingRuns && recentRuns.length === 0 && (
          <div className="glass-card p-8 text-center mb-8">
            <p className="text-3xl mb-2 opacity-30">🚀</p>
            <p className="text-sm text-ink-400">No runs yet. Create a content pipeline or workflow to get started.</p>
          </div>
        )}

        {/* Saved Workflows */}
        {(loadingWorkflows || savedWorkflows.length > 0) && (
          <div className="glass-card overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-surface-300 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-700">My Workflows</h2>
              <Link href="/workflow/builder" className="text-[11px] text-accent-500 hover:text-accent-600 transition flex items-center gap-1">
                <PlusIcon className="h-3.5 w-3.5" /> New
              </Link>
            </div>
            {loadingWorkflows ? (
              <div className="px-6 py-4 text-xs text-ink-400 animate-pulse">Loading…</div>
            ) : (
              <div className="divide-y divide-surface-300">
                {savedWorkflows.map(wf => (
                  <div key={wf.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-surface-50 transition group">
                    <div className="flex items-center gap-3">
                      <span className="text-base">💾</span>
                      <div>
                        <p className="text-sm font-medium text-ink-700">{wf.name}</p>
                        <p className="text-[11px] text-ink-300">
                          Updated {new Date(wf.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/workflow/builder?workflowId=${wf.id}`}
                      className="text-[11px] btn-secondary px-3 py-1.5 opacity-0 group-hover:opacity-100 transition"
                    >
                      Open →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Workflows List */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-300">
            <h2 className="text-sm font-semibold text-ink-700">Pipeline Templates</h2>
          </div>
          <div className="divide-y divide-surface-300">
            {workflows.map((workflow) => (
              <WorkflowRow key={workflow.id} workflow={workflow} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction title="Content Pipeline" description="Generate content packages" href="/workflow/builder" icon="✨" />
          <QuickAction title="Browse Templates" description="Pre-built workflow templates" href="/templates" icon="📚" />
          <QuickAction title="Knowledge Base" description="Upload docs for RAG context" href="/knowledge" icon="🧠" />
          <QuickAction title="Documentation" description="Learn about agent orchestration" href="/docs" icon="📖" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string, value: string, accent: string }) {
  return (
    <div className="glass-card p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-300 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}

function WorkflowRow({ workflow }: { workflow: any }) {
  const stepAgents = workflow.steps.map((s: any) => ({ ...s, agent: getAgentForStep(s) }))
  return (
    <div className="px-6 py-5 hover:bg-surface-50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{workflow.icon}</span>
            <h3 className="text-sm font-semibold text-ink-700">{workflow.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              workflow.status === 'active'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : workflow.status === 'popular'
                ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                : 'bg-surface-100 text-ink-400 border border-surface-300'
            }`}>
              {workflow.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-ink-400">
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              Last run: {workflow.lastRun}
            </span>
            <span>{workflow.runs} total runs</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/workflow/${workflow.id}`} className="btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5">
            ✏️ Edit
          </Link>
          <Link href={`/workflow/builder?template=${workflow.id}`} className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5">
            <PlayIcon className="h-3.5 w-3.5" />
            Run Now
          </Link>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {stepAgents.map((step: any, i: number) => (
          <div key={step.agentId + i} className="flex items-center gap-2 shrink-0">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
              style={{
                backgroundColor: (step.agent?.color || '#6366f1') + '12',
                borderColor: (step.agent?.color || '#6366f1') + '25',
                color: step.agent?.color || '#a5b4fc',
              }}
            >
              <span>{step.agent?.icon || '⚙️'}</span>
              {step.label}
            </div>
            {i < stepAgents.length - 1 && (
              <span className="text-ink-200 text-xs">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentRunRow({ run, onDelete }: { run: StoredRun; onDelete: () => void }) {
  const typeIcon = run.pipelineType === 'content' ? '✨' : '🔧'
  const timeAgo = getTimeAgo(run.startedAt)
  const uniqueAgents = [...new Set(run.steps.map(s => s.agentName || s.agentId))]

  return (
    <div className="px-6 py-4 hover:bg-surface-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span>{typeIcon}</span>
            <h3 className="text-sm font-medium text-ink-700">{run.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              run.status === 'completed'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {run.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-ink-400">
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              {timeAgo}
            </span>
            <span>{run.stepsCompleted}/{run.stepsTotal} steps</span>
            {run.executionTime > 0 && <span>{run.executionTime.toFixed(1)}s</span>}
            <span className="text-ink-300">{uniqueAgents.slice(0, 3).join(' → ')}{uniqueAgents.length > 3 ? ` +${uniqueAgents.length - 3}` : ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/workflow/builder?run=${run.id}`} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
            <EyeIcon className="h-3.5 w-3.5" />
            View
          </Link>
          <Link href={`/workflow/builder`} className="btn-secondary text-xs px-3 py-1.5">
            🔄 Re-run
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-ink-300 hover:text-red-500 transition p-1.5 rounded-md hover:bg-surface-100"
            title="Delete run"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function QuickAction({ title, description, href, icon }: { title: string, description: string, href: string, icon: string }) {
  return (
    <Link href={href} className="glass-card-hover p-5 block group">
      <div className="text-2xl mb-2.5">{icon}</div>
      <h3 className="text-sm font-semibold text-ink-700 mb-1">{title}</h3>
      <p className="text-xs text-ink-400">{description}</p>
    </Link>
  )
}

