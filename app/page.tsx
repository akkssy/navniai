'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRightIcon, BoltIcon, UserGroupIcon, PuzzlePieceIcon, CpuChipIcon, EyeIcon, CommandLineIcon, CheckBadgeIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import ThemeToggle from '@/components/ThemeToggle'
import Logo from '@/components/Logo'
import { SYSTEM_AGENTS, MARKETING_AGENTS, VIRAL_SOCIAL_AGENTS } from '@/lib/agents'
import { ALL_PROVIDER_KEYS } from '@/lib/llmProviders'
import { getTemplateById, getTemplateStepAgents } from '@/lib/pipelineTemplates'

// Real counts derived from source so the page never drifts from the codebase
const TOTAL_AGENTS = SYSTEM_AGENTS.length + MARKETING_AGENTS.length + VIRAL_SOCIAL_AGENTS.length
const PROVIDER_COUNT = ALL_PROVIDER_KEYS.length
const VIRAL_TEMPLATE = getTemplateById('viral-social')
const VIRAL_AGENTS = VIRAL_TEMPLATE ? getTemplateStepAgents(VIRAL_TEMPLATE) : []
const VIRAL_STEP_COUNT = VIRAL_AGENTS.length

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-surface-300/50 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <Logo size={32} />
              <span className="text-xl font-bold text-ink-700 tracking-tight">NavniAI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-ink-400 hover:text-ink-700 transition-colors">Features</a>
              <a href="#pipelines" className="text-sm text-ink-400 hover:text-ink-700 transition-colors">Pipelines</a>
              <a href="#domains" className="text-sm text-ink-400 hover:text-ink-700 transition-colors">Use Cases</a>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/login" className="px-4 py-2 text-sm text-ink-400 hover:text-ink-700 transition-colors hidden sm:block">
                Sign in
              </Link>
              <Link href="/workflow/builder?template=viral-social" className="btn-primary text-sm">
                Try Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        {/* Background — single restrained mesh */}
        <div className="absolute inset-0 hero-mesh" />
        <div className="absolute top-24 right-[10%] w-96 h-96 bg-accent-500/8 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 sm:pt-28 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Hero Text */}
            <div className="animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-orange-50/80 dark:bg-orange-50/20 text-orange-600 dark:text-orange-400 text-xs font-semibold rounded-full mb-8 border border-orange-200/50 dark:border-orange-200/20 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                🔥 AI Content Pipeline Studio
              </div>

              <h1 className="heading-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-7 text-ink-700">
                Turn any topic into<br />
                <span className="gradient-text">viral content.</span>
              </h1>

              <p className="text-lg sm:text-xl text-ink-400 mb-6 leading-relaxed max-w-xl animate-slide-up-delay">
                Trend Scout → Audience Persona → 16 Hook Variants → Reel Script → Viral Score → Angle Rotator.
                Our AI scores and rescues your content <em>before</em> you publish.
              </p>

              {/* Pipeline flow badge */}
              <div className="flex flex-wrap gap-2 mb-8 animate-slide-up-delay">
                {['Trend Scout', 'Persona', '16 Hooks', 'Reel Script', 'Viral Score', 'Big Pivot'].map((step, i) => (
                  <span key={step} className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-surface-100 border border-surface-300 text-ink-500 font-medium">
                    {i > 0 && <span className="text-ink-300 -ml-1 mr-0.5">→</span>}
                    {step}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-5 animate-slide-up-delay-2">
                <Link href="/workflow/builder?template=viral-social" className="btn-hero text-base px-8 py-3.5 flex items-center gap-2.5">
                  Try Viral Pipeline Free
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link href="/dashboard" className="text-sm text-ink-400 hover:text-ink-700 transition-colors inline-flex items-center gap-1.5">
                  <EyeIcon className="h-4 w-4" />
                  View dashboard
                </Link>
              </div>

              {/* Micro-stats under CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-10 animate-slide-up-delay-3">
                <div className="flex items-center gap-2 text-sm text-ink-400">
                  <CheckBadgeIcon className="h-4 w-4 text-emerald-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-400">
                  <CheckBadgeIcon className="h-4 w-4 text-emerald-500" />
                  Works with Ollama, Gemini, OpenAI
                </div>
              </div>
            </div>

            {/* Right — Animated Workflow Demo */}
            <div className="relative animate-slide-up lg:animate-slide-up-delay">
              <WorkflowDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <section className="border-y border-surface-300/50 bg-card/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink-400">
            <span className="flex items-center gap-2"><CpuChipIcon className="h-4 w-4 text-accent-500" /><strong className="text-ink-700 font-semibold">{TOTAL_AGENTS}</strong> pre-built agents</span>
            <span className="hidden sm:block h-4 w-px bg-surface-300" />
            <span className="flex items-center gap-2"><BoltIcon className="h-4 w-4 text-accent-500" /><strong className="text-ink-700 font-semibold">{PROVIDER_COUNT}</strong> LLM providers</span>
            <span className="hidden sm:block h-4 w-px bg-surface-300" />
            <span className="flex items-center gap-2"><CommandLineIcon className="h-4 w-4 text-accent-500" /><strong className="text-ink-700 font-semibold">{VIRAL_STEP_COUNT}</strong>-step viral pipeline</span>
            <span className="hidden sm:block h-4 w-px bg-surface-300" />
            <span className="flex items-center gap-2"><LockClosedIcon className="h-4 w-4 text-accent-500" />Runs 100% locally with Ollama — free</span>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <p className="section-label mb-3">Why NavniAI</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-700 mb-4">
            Score and rescue content before you publish
          </h2>
          <p className="text-ink-400 max-w-2xl mx-auto leading-relaxed">
            Every pipeline step builds on the last — persona-aware hooks, viral scoring, automatic angle rotation if the score is low. No more posting blind.
          </p>
        </div>

        {/* Featured row — 2 large cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-6 stagger-children">
          <FeatureCard
            icon={<BoltIcon className="h-7 w-7" />}
            color="text-amber-600 dark:text-amber-400"
            bgColor="bg-amber-50 dark:bg-amber-950/40"
            title="Visual Workflow Builder"
            description="Drag-and-drop canvas powered by React Flow. Connect agents visually, set conditions, and watch your pipeline execute in real-time with live streaming output."
            featured
          />
          <FeatureCard
            icon={<EyeIcon className="h-7 w-7" />}
            color="text-cyan-600 dark:text-cyan-400"
            bgColor="bg-cyan-50 dark:bg-cyan-950/40"
            title="Human-in-the-Loop"
            description="Pause the pipeline between agents. Review, edit, or regenerate any output at checkpoints before it flows to the next stage — full control over your AI pipeline."
            featured
          />
        </div>

        {/* Supporting row — 4 compact cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
          <FeatureCard
            icon={<CpuChipIcon className="h-5 w-5" />}
            color="text-violet-600 dark:text-violet-400"
            bgColor="bg-violet-50 dark:bg-violet-950/40"
            title="SSE Streaming"
            description="Watch tokens stream in real-time. No more waiting for entire responses."
          />
          <FeatureCard
            icon={<PuzzlePieceIcon className="h-5 w-5" />}
            color="text-accent-600 dark:text-accent-400"
            bgColor="bg-accent-50 dark:bg-accent-50/30"
            title="Custom Agents"
            description="Define agents for any role with custom system prompts."
          />
          <FeatureCard
            icon={<CommandLineIcon className="h-5 w-5" />}
            color="text-emerald-600 dark:text-emerald-400"
            bgColor="bg-emerald-50 dark:bg-emerald-950/40"
            title="Structured Handoffs"
            description="Typed JSON between agents — clean, focused context passing."
          />
          <FeatureCard
            icon={<UserGroupIcon className="h-5 w-5" />}
            color="text-rose-600 dark:text-rose-400"
            bgColor="bg-rose-50 dark:bg-rose-950/40"
            title="Multi-Provider"
            description="Ollama, OpenAI, Gemini, Anthropic, Groq — with fallback chains."
          />
        </div>
      </section>

      {/* ═══ PIPELINE SHOWCASE ═══ */}
      <section id="pipelines" className="bg-surface-50 dark:bg-surface-200/30 border-y border-surface-300/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <p className="section-label mb-3">The Viral Social Pipeline</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-700 mb-4">
              {VIRAL_STEP_COUNT} agents. One viral content pack.
            </h2>
            <p className="text-ink-400 max-w-2xl mx-auto leading-relaxed">
              The only pipeline that scores your content <em>and</em> automatically rewrites it if the score is low — so you always publish your best angle.
            </p>
          </div>

          {/* Viral pipeline — full-width hero card */}
          <div className="glass-card-hover p-8 relative overflow-hidden group mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 to-pink-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex flex-wrap items-start gap-3 mb-5">
                <span className="text-3xl">🔥</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-ink-700">Viral Social Orchestrator</h3>
                  <p className="text-xs text-ink-400">Discover trends → Map your audience → Generate 16 hooks → Write Reel + Carousel → Score virality → Rotate angle if score is low → Adapt for every platform</p>
                </div>
                <Link href="/workflow/builder?template=viral-social" className="btn-primary text-xs px-4 py-2 whitespace-nowrap flex items-center gap-1.5 shrink-0">
                  Run Pipeline <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {VIRAL_AGENTS.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border text-center bg-surface-100 border-surface-300">
                      <span className="text-lg">{s.agent?.icon}</span>
                      <span className="text-[10px] font-semibold text-ink-500 whitespace-nowrap">{s.agent?.name}</span>
                    </div>
                    {i < VIRAL_AGENTS.length - 1 && <div className="w-3 h-0.5 rounded-full shrink-0 bg-surface-300" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 stagger-children">
            <PipelineCard
              title="Content Marketing Pack"
              description="Research → Write → Edit → SEO → Social — complete content package in minutes"
              agents={[
                { emoji: '🔬', name: 'Researcher', status: 'done' },
                { emoji: '✍️', name: 'Writer', status: 'done' },
                { emoji: '📝', name: 'Editor', status: 'active' },
                { emoji: '🎯', name: 'SEO', status: 'pending' },
                { emoji: '📱', name: 'Social', status: 'pending' },
              ]}
              gradient="from-blue-500/10 to-violet-500/10"
            />
            <PipelineCard
              title="Custom Pipeline Builder"
              description="Drag any agent onto the canvas, connect them, and run your own multi-agent workflow"
              agents={[
                { emoji: '🧩', name: 'Any Agent', status: 'done' },
                { emoji: '🔗', name: 'Connect', status: 'done' },
                { emoji: '▶️', name: 'Run', status: 'active' },
                { emoji: '📤', name: 'Export', status: 'pending' },
              ]}
              gradient="from-violet-500/10 to-pink-500/10"
            />
          </div>
        </div>
      </section>

      {/* ═══ PROVIDER LOGOS ═══ */}
      <section id="domains" className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <p className="section-label mb-3">Integrations</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-700">
            Bring your own model
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-4 items-stretch stagger-children">
          {[
            { name: 'Ollama', desc: 'Local / Private' },
            { name: 'OpenAI', desc: 'GPT-4o' },
            { name: 'Anthropic', desc: 'Claude' },
            { name: 'Google', desc: 'Gemini' },
            { name: 'Groq', desc: 'Ultra-fast' },
            { name: 'OpenRouter', desc: 'Any Model' },
          ].map((p) => (
            <div key={p.name} className="glass-card px-6 py-4 flex flex-col items-center justify-center gap-1 min-w-[130px]">
              <span className="text-base font-bold text-ink-700">{p.name}</span>
              <span className="text-[11px] text-ink-400 font-medium">{p.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-2xl gradient-border">
          <div className="absolute inset-0 hero-mesh" />
          <div className="relative px-8 py-16 sm:py-20 text-center">
            <p className="section-label mb-4">Start in seconds</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-ink-700">
              Your next post, <span className="gradient-text">scored before you publish</span>.
            </h2>
            <p className="text-ink-400 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
              {TOTAL_AGENTS} agents, {PROVIDER_COUNT} providers, one {VIRAL_STEP_COUNT}-step pipeline that scores your content and rewrites it if the score is low. First run free.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Link href="/workflow/builder?template=viral-social" className="btn-hero text-base px-10 py-4 inline-flex items-center gap-2.5">
                Try the Viral Pipeline
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="text-sm text-ink-400 hover:text-ink-700 transition-colors">
                or view the dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-surface-300/60 bg-card/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={22} className="rounded-md" />
            <span className="text-sm font-semibold text-ink-600">NavniAI</span>
          </div>
          <p className="text-xs text-ink-300">Visual AI Agent Orchestration Platform • Built with Next.js & React Flow</p>
        </div>
      </footer>
    </div>
  )
}

// ─── Component: Feature Card ───
function FeatureCard({ icon, title, description, color, bgColor, featured }: {
  icon: React.ReactNode; title: string; description: string; color: string; bgColor: string; featured?: boolean
}) {
  return (
    <div className={`glass-card-hover group relative overflow-hidden ${featured ? 'p-8' : 'p-6'}`}>
      <div className={`${color} ${bgColor} ${featured ? 'p-3.5 rounded-xl' : 'p-2.5 rounded-lg'} w-fit mb-4`}>{icon}</div>
      <h3 className={`font-bold mb-2 text-ink-700 group-hover:text-accent-500 transition-colors ${featured ? 'text-xl' : 'text-base'}`}>{title}</h3>
      <p className={`text-ink-400 leading-relaxed ${featured ? 'text-sm' : 'text-xs'}`}>{description}</p>
      {/* Hover glow — violet tinted */}
      <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent)' }} />
    </div>
  )
}

// ─── Component: Pipeline Card ───
function PipelineCard({ title, description, agents, gradient }: {
  title: string; description: string; gradient: string
  agents: { emoji: string; name: string; status: 'done' | 'active' | 'pending' }[]
}) {
  return (
    <div className="glass-card-hover p-6 relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative">
        <h3 className="text-base font-semibold text-ink-700 mb-1.5">{title}</h3>
        <p className="text-xs text-ink-400 mb-5">{description}</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {agents.map((agent, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className={`flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-lg border transition-all shrink-0 ${
                agent.status === 'done'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40'
                  : agent.status === 'active'
                  ? 'bg-accent-50/80 dark:bg-accent-50/20 border-accent-300/60 dark:border-accent-300/30 ring-2 ring-accent-500/20 animate-pulse'
                  : 'bg-surface-100 border-surface-300'
              }`}>
                <span className="text-lg">{agent.emoji}</span>
                <span className="text-[10px] font-semibold text-ink-500 whitespace-nowrap">{agent.name}</span>
                {agent.status === 'done' && <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold">✓ Done</span>}
                {agent.status === 'active' && <span className="text-[8px] text-accent-600 dark:text-accent-400 font-bold">● Live</span>}
              </div>
              {i < agents.length - 1 && (
                <div className={`w-5 h-0.5 rounded-full ${
                  agent.status === 'done' ? 'bg-emerald-400/60' : 'bg-surface-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


// ─── Component: Animated Workflow Demo (Hero right panel) ───
function WorkflowDemo() {
  const [activeStep, setActiveStep] = useState(0)
  const steps = [
    { emoji: '📈', name: 'Trend Scout', output: 'Top trend: "AI tools for solopreneurs" — 340% velocity spike...' },
    { emoji: '🎯', name: 'Audience Persona', output: 'Persona: Bootstrapped founder, 28-40, LinkedIn-primary, FOMO-driven...' },
    { emoji: '🪝', name: 'Hook Generator', output: 'Hook #1 (Contrarian, 9.4/10): "I deleted my entire content calendar. Here\'s what replaced it." ...' },
    { emoji: '⚡', name: 'Viral Scorer', output: 'SCORE: 9 — Hook: 9 · Shareability: 9 · Platform fit: 8 · CTA: 9...' },
  ]

  useEffect(() => {
    const timer = setInterval(() => setActiveStep(s => (s + 1) % steps.length), 2500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative">
      {/* Multi-hue glow behind card */}
      <div className="absolute -inset-6 rounded-2xl blur-3xl animate-glow-pulse" style={{
        background: 'radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.15), transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(139,92,246,0.12), transparent 60%)'
      }} />

      <div className="glass-card gradient-border relative p-6 sm:p-8 shadow-elevated">
        {/* Header — traffic-light dots */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-ink-500">Viral Social Pipeline — Running</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
        </div>

        {/* Agent Steps */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isDone = i < activeStep
            const isActive = i === activeStep
            const isPending = i > activeStep
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all duration-500 ${
                  isDone
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/30'
                    : isActive
                    ? 'bg-accent-50/60 dark:bg-accent-50/10 border-accent-300/60 dark:border-accent-300/20 ring-1 ring-accent-500/20'
                    : 'bg-surface-50/50 border-surface-200'
                }`}
              >
                <span className="text-xl flex-shrink-0">{step.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink-700">{step.name}</span>
                    {isDone && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">✓ Complete</span>}
                    {isActive && <span className="text-[10px] text-accent-600 dark:text-accent-400 font-bold bg-accent-50 dark:bg-accent-50/20 px-1.5 py-0.5 rounded animate-pulse">● Streaming...</span>}
                  </div>
                  {(isDone || isActive) && (
                    <p className={`text-xs mt-1 ${isDone ? 'text-ink-400' : 'text-accent-600 dark:text-accent-400'}`}>
                      {isActive ? step.output.substring(0, Math.floor(step.output.length * 0.7)) + '▊' : step.output}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress bar — indigo→violet gradient */}
        <div className="mt-5 h-1.5 bg-surface-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${((activeStep + 1) / steps.length) * 100}%`,
              background: 'linear-gradient(90deg, rgb(var(--accent-500)), rgb(var(--violet-500)))',
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-ink-400">Step {activeStep + 1} of {steps.length}</span>
          <span className="text-[10px] font-semibold gradient-text">Live Preview</span>
        </div>
      </div>
    </div>
  )
}
