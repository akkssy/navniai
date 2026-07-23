import Link from 'next/link'
import { SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

interface StepResult {
  id: string
  agentId: string
  agentName: string
  action: string
  status: string
  output: string
  provider: string
  orderIndex: number
}

interface RunData {
  id: string
  name: string
  pipelineType: string
  status: string
  executionTime: number | null
  stepsTotal: number
  stepsCompleted: number
  startedAt: string
  completedAt: string | null
  stepResults: StepResult[]
}

const AGENT_ICONS: Record<string, string> = {
  trend_scout: '📈', audience_persona: '🎯', hook_generator: '🪝',
  reel_scripter: '🎬', carousel_writer: '🎠', viral_scorer: '⚡',
  angle_rotator: '🔄', platform_adapter: '🔧', researcher: '🔬',
  writer: '✍️', editor: '📝', seo: '🎯', social: '📱',
}

async function getRun(runId: string): Promise<RunData | null> {
  const run = await prisma.workflowRun.findUnique({
    where: { id: runId },
    include: { stepResults: { orderBy: { orderIndex: 'asc' } } },
  })
  if (!run) return null
  return {
    ...run,
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt?.toISOString() ?? null,
  } as unknown as RunData
}

export default async function SharedRunPage({ params }: { params: { runId: string } }) {
  const run = await getRun(params.runId)
  if (!run) notFound()

  const templateLink = run.pipelineType !== 'custom'
    ? `/workflow/builder?template=${run.pipelineType}`
    : '/workflow/builder'

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="border-b border-surface-300/50 bg-card/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-accent-500" />
            <span className="text-base font-bold text-ink-700">NavniAI</span>
          </Link>
          <Link href={templateLink} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
            Run your own <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Run header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              run.status === 'completed'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 text-red-500 border border-red-200'
            }`}>{run.status}</span>
            {run.executionTime && (
              <span className="text-[10px] text-ink-400">{run.executionTime.toFixed(1)}s</span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-700 mb-1 break-words">{run.name}</h1>
          <p className="text-sm text-ink-400">
            {run.stepsCompleted}/{run.stepsTotal} steps completed
            {run.completedAt && ` · ${new Date(run.completedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`}
          </p>
        </div>

        {/* Step results */}
        <div className="space-y-4 mb-10">
          {run.stepResults.map((step) => (
            <div key={step.id} className="glass-card overflow-hidden">
              <div className="px-4 sm:px-5 py-3 border-b border-surface-300 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-lg sm:text-xl">{AGENT_ICONS[step.agentId] || '🤖'}</span>
                <span className="text-sm font-semibold text-ink-700">{step.agentName || step.agentId}</span>
                <span className="text-[10px] text-ink-400 hidden sm:inline">→ {step.action}</span>
                <span className={`sm:ml-auto text-[10px] px-2 py-0.5 rounded ${
                  step.status === 'completed'
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-50 text-red-500'
                }`}>{step.status}</span>
                {step.provider !== 'simulated' && (
                  <span className="text-[10px] text-ink-300 bg-surface-100 px-2 py-0.5 rounded border border-surface-200">{step.provider}</span>
                )}
              </div>
              <pre className="px-4 sm:px-5 py-4 text-xs text-ink-500 whitespace-pre-wrap break-words font-mono leading-relaxed overflow-x-auto max-h-80">
                {step.output}
              </pre>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="glass-card p-6 sm:p-8 text-center">
          <p className="text-2xl mb-3">🔥</p>
          <h2 className="text-xl font-bold text-ink-700 mb-2">Made with NavniAI</h2>
          <p className="text-sm text-ink-400 mb-6 max-w-sm mx-auto">
            Generate your own viral content pack — 16 hooks, Reel script, Carousel, Viral score, and an Angle Rotator if the score is low.
          </p>
          <Link href={templateLink} className="btn-primary text-sm px-8 py-3 inline-flex items-center gap-2">
            Run your own pipeline free <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <p className="text-[11px] text-ink-300 mt-3">No credit card · Works with Ollama, Gemini, OpenAI</p>
        </div>
      </div>
    </div>
  )
}
