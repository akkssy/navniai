'use client'

import Link from 'next/link'
import { SparklesIcon, PlayIcon, PencilSquareIcon, ClockIcon } from '@heroicons/react/24/outline'
import { getTemplateById, getAgentForStep } from '@/lib/pipelineTemplates'

export default function WorkflowDetailClient({ params }: { params: { id: string } }) {
  const { id } = params
  const workflow = getTemplateById(id)

  if (!workflow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-ink-200 mb-4">404</h1>
          <p className="text-ink-400 mb-6">Workflow not found</p>
          <Link href="/dashboard" className="btn-primary px-6 py-3">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const stepAgents = workflow.steps.map(s => ({ ...s, agent: getAgentForStep(s) }))

  return (
    <div className="min-h-screen">
      {/* Header */}
      <nav className="border-b border-surface-300 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center gap-2">
              <SparklesIcon className="h-6 w-6 text-accent-500" />
              <span className="text-lg font-bold text-ink-700">NavniAI</span>
            </Link>
            <Link href="/dashboard" className="text-sm text-ink-400 hover:text-ink-700 transition">← Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10">
        {/* Workflow Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{workflow.icon}</span>
              <h1 className="text-2xl font-bold">{workflow.name}</h1>
            </div>
            <p className="text-sm text-ink-400 mb-3 max-w-xl">{workflow.description}</p>
            <div className="flex items-center gap-4 text-xs text-ink-400">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                workflow.status === 'active'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : workflow.status === 'popular'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-surface-100 text-ink-400 border border-surface-300'
              }`}>
                {workflow.status}
              </span>
              <span className="flex items-center gap-1"><ClockIcon className="h-3.5 w-3.5" /> Last run: {workflow.lastRun}</span>
              <span>{workflow.runs} total runs</span>
              <span className="bg-surface-100 border border-surface-300 px-2 py-0.5 rounded-md">{workflow.category}</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Link href={`/workflow/builder?template=${workflow.id}`}
              className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5">
              <PencilSquareIcon className="h-4 w-4" /> Edit in Builder
            </Link>
            <Link href={`/workflow/builder?template=${workflow.id}`}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
              <PlayIcon className="h-4 w-4" /> Run Now
            </Link>
          </div>
        </div>

        {/* Pipeline Steps */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-sm font-semibold mb-4">Pipeline Steps</h2>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {stepAgents.map((step, i) => (
              <div key={step.agentId + i} className="flex items-center gap-3 shrink-0">
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium border"
                  style={{
                    backgroundColor: (step.agent?.color || '#6366f1') + '10',
                    borderColor: (step.agent?.color || '#6366f1') + '20',
                  }}
                >
                  <span className="text-base">{step.agent?.icon || '⚙️'}</span>
                  <div>
                    <div className="text-ink-700 text-xs font-medium">{step.label}</div>
                    <div className="text-ink-400 text-[10px]">{step.agent?.name}</div>
                  </div>
                </div>
                {i < stepAgents.length - 1 && (
                  <span className="text-ink-200 text-lg">→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Agent Details */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-sm font-semibold mb-4">Agent Configuration</h2>
          <div className="space-y-3">
            {stepAgents.map((step, i) => (
              <div key={step.agentId + i} className="p-4 rounded-md border border-surface-300 bg-surface-50">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center text-base"
                    style={{ background: (step.agent?.color || '#6366f1') + '15' }}>
                    {step.agent?.icon || '⚙️'}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-ink-700">Step {i + 1}: {step.label}</span>
                    <span className="text-[10px] text-ink-400 ml-2">{step.agent?.name}</span>
                  </div>
                </div>
                <p className="text-xs text-ink-400 leading-relaxed pl-[42px]">{step.inputs.task}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Runs */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4">Recent Runs</h2>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-md border border-surface-300 bg-surface-50">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-ink-500">Run #{workflow.runs - i}</span>
                  <span className="text-[10px] text-ink-300">• {stepAgents.length} steps completed</span>
                </div>
                <span className="text-[10px] text-ink-300">{i === 0 ? workflow.lastRun : `${i + 1} days ago`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

