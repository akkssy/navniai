'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { PlusIcon, PlayIcon, ClockIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { PIPELINE_TEMPLATES, getAgentForStep } from '@/lib/pipelineTemplates'
import ThemeToggle from '@/components/ThemeToggle'

export default function Dashboard() {
  const { data: session } = useSession()
  const workflows = PIPELINE_TEMPLATES

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
          <StatCard label="Active" value={String(workflows.filter(w => w.status === 'active').length)} accent="text-emerald-600" />
          <StatCard label="Total Runs" value={String(workflows.reduce((s, w) => s + w.runs, 0).toLocaleString())} accent="text-amber-600" />
          <StatCard label="Agents Used" value={String(new Set(workflows.flatMap(w => w.steps.map(s => s.agentId))).size)} accent="text-violet-600" />
        </div>

        {/* Workflows List */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-300">
            <h2 className="text-sm font-semibold text-ink-700">Your Workflows</h2>
          </div>
          <div className="divide-y divide-surface-300">
            {workflows.map((workflow) => (
              <WorkflowRow key={workflow.id} workflow={workflow} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction title="Browse Templates" description="Pre-built workflow templates" href="/templates" icon="📚" />
          <QuickAction title="Workflow Builder" description="Create custom workflows visually" href="/workflow/builder" icon="🎨" />
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

function QuickAction({ title, description, href, icon }: { title: string, description: string, href: string, icon: string }) {
  return (
    <Link href={href} className="glass-card-hover p-5 block group">
      <div className="text-2xl mb-2.5">{icon}</div>
      <h3 className="text-sm font-semibold text-ink-700 mb-1">{title}</h3>
      <p className="text-xs text-ink-400">{description}</p>
    </Link>
  )
}

