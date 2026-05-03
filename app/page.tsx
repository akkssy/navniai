'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRightIcon, SparklesIcon, BoltIcon, UserGroupIcon, PuzzlePieceIcon, CpuChipIcon, EyeIcon, CommandLineIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
import ThemeToggle from '@/components/ThemeToggle'

// Animated counter hook
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

export default function Home() {
  const agents = useCounter(18, 1500)
  const providers = useCounter(6, 1200)
  const domains = useCounter(10, 1400)

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-surface-300/50 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <SparklesIcon className="h-7 w-7 text-accent-500" />
                <div className="absolute -inset-1 bg-accent-500/20 rounded-full blur-md" />
              </div>
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
              <Link href="/workflow/builder" className="btn-primary text-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 hero-mesh" />
        <div className="absolute inset-0 grid-pattern" />
        {/* Floating glow orbs — multi-hue */}
        <div className="absolute top-20 left-[12%] w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-16 right-[8%] w-96 h-96 bg-violet-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[60%] left-[40%] w-64 h-64 bg-rose-500/5 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '4s' }} />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 sm:pt-28 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Hero Text */}
            <div className="animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-accent-50/80 dark:bg-accent-50/40 text-accent-600 dark:text-accent-400 text-xs font-semibold rounded-full mb-8 border border-accent-200/50 dark:border-accent-200/20 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500" />
                </span>
                Visual AI Agent Orchestration
              </div>

              <h1 className="heading-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-7 text-ink-700">
                Build AI that<br />
                <span className="gradient-text">thinks together.</span>
              </h1>

              <p className="text-lg sm:text-xl text-ink-400 mb-10 leading-relaxed max-w-xl animate-slide-up-delay">
                Drag, connect, and orchestrate multi-agent pipelines — from code review to legal compliance —
                with real-time streaming and human-in-the-loop checkpoints.
              </p>

              <div className="flex flex-wrap gap-4 animate-slide-up-delay-2">
                <Link href="/workflow/builder" className="btn-hero text-base px-8 py-3.5 flex items-center gap-2.5">
                  Start Building Free
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link href="/dashboard" className="btn-secondary text-base px-8 py-3.5 flex items-center gap-2">
                  <EyeIcon className="h-4 w-4" />
                  View Dashboard
                </Link>
              </div>

              {/* Micro-stats under CTA */}
              <div className="flex items-center gap-6 mt-10 animate-slide-up-delay-3">
                <div className="flex items-center gap-2 text-sm text-ink-400">
                  <CheckBadgeIcon className="h-4 w-4 text-emerald-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-400">
                  <CheckBadgeIcon className="h-4 w-4 text-emerald-500" />
                  Works offline with Ollama
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

      {/* ═══ STATS BAR ═══ */}
      <section className="border-y border-surface-300/50 bg-card/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value={agents} suffix="+" label="Pre-built Agents" icon={<CpuChipIcon className="h-5 w-5" />} />
            <StatItem value={providers} label="LLM Providers" icon={<BoltIcon className="h-5 w-5" />} />
            <StatItem value={domains} suffix="+" label="Domain Templates" icon={<PuzzlePieceIcon className="h-5 w-5" />} />
            <StatItem value={100} suffix="%" label="Open & Extensible" icon={<CommandLineIcon className="h-5 w-5" />} />
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <p className="section-label mb-3">Why NavniAI</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-700 mb-4">
            Everything you need to orchestrate AI
          </h2>
          <p className="text-ink-400 max-w-2xl mx-auto leading-relaxed">
            From visual workflow design to real-time streaming — all the tools to build production-grade multi-agent systems.
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
            <p className="section-label mb-3">Pipeline Templates</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-700 mb-4">
              Pre-built for every workflow
            </h2>
            <p className="text-ink-400 max-w-2xl mx-auto leading-relaxed">
              Start with battle-tested templates or build your own from scratch.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 stagger-children">
            <PipelineCard
              title="Content Marketing Pipeline"
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
              title="Code Review Pipeline"
              description="Generate → Review → Test → Deploy — automated code quality at scale"
              agents={[
                { emoji: '⚡', name: 'Generator', status: 'done' },
                { emoji: '🔍', name: 'Reviewer', status: 'done' },
                { emoji: '🧪', name: 'Tester', status: 'done' },
                { emoji: '🚀', name: 'Deploy', status: 'active' },
              ]}
              gradient="from-emerald-500/10 to-cyan-500/10"
            />
            <PipelineCard
              title="HR Hiring Pipeline"
              description="Screen → Interview → Evaluate → Outreach — streamline your hiring process"
              agents={[
                { emoji: '📄', name: 'Screener', status: 'done' },
                { emoji: '💬', name: 'Interviewer', status: 'active' },
                { emoji: '📊', name: 'Evaluator', status: 'pending' },
                { emoji: '📧', name: 'Outreach', status: 'pending' },
              ]}
              gradient="from-amber-500/10 to-orange-500/10"
            />
            <PipelineCard
              title="Legal Contract Review"
              description="Parse → Compliance → Risk → Summary — AI-powered legal analysis"
              agents={[
                { emoji: '📑', name: 'Parser', status: 'done' },
                { emoji: '⚖️', name: 'Compliance', status: 'done' },
                { emoji: '🚩', name: 'Risk', status: 'active' },
                { emoji: '📝', name: 'Summary', status: 'pending' },
              ]}
              gradient="from-rose-500/10 to-pink-500/10"
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
        <div className="flex flex-wrap justify-center gap-5 items-center stagger-children">
          {[
            { name: 'Ollama', letter: 'O', bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-200', desc: 'Local / Private' },
            { name: 'OpenAI', letter: 'AI', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', desc: 'GPT-4o' },
            { name: 'Anthropic', letter: 'A', bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-400', desc: 'Claude' },
            { name: 'Google', letter: 'G', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', desc: 'Gemini' },
            { name: 'Groq', letter: 'Gq', bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400', desc: 'Ultra-fast' },
            { name: 'OpenRouter', letter: 'OR', bg: 'bg-accent-50 dark:bg-accent-50/30', text: 'text-accent-600 dark:text-accent-400', desc: 'Any Model' },
          ].map((p) => (
            <div key={p.name} className="glass-card-hover px-6 py-5 flex flex-col items-center gap-2 min-w-[130px]">
              <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center`}>
                <span className={`text-sm font-black ${p.text}`}>{p.letter}</span>
              </div>
              <span className="text-sm font-bold text-ink-700">{p.name}</span>
              <span className="text-[10px] text-ink-400 font-medium">{p.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-2xl gradient-border">
          <div className="absolute inset-0 hero-mesh" />
          <div className="absolute inset-0 grid-pattern opacity-40" />
          {/* Glow accents */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl" />
          <div className="relative px-8 py-16 sm:py-20 text-center">
            <p className="section-label mb-4">✨ Start in seconds</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-ink-700">
              Ready to orchestrate <span className="gradient-text">intelligence</span>?
            </h2>
            <p className="text-ink-400 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
              18 agents, 6 providers, infinite possibilities. Build your first pipeline in under 2 minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/workflow/builder" className="btn-hero text-base px-10 py-4 inline-flex items-center gap-2.5">
                Open Workflow Builder
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="btn-secondary text-base px-8 py-4">
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-surface-300/60 bg-card/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-accent-500" />
            <span className="text-sm font-semibold text-ink-600">NavniAI</span>
          </div>
          <p className="text-xs text-ink-300">Visual AI Agent Orchestration Platform • Built with Next.js & React Flow</p>
        </div>
      </footer>
    </div>
  )
}

// ─── Component: Stat Item ───
function StatItem({ value, suffix = '', label, icon }: { value: number; suffix?: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="text-center animate-counter-in">
      <div className="flex items-center justify-center gap-2.5 mb-1.5">
        <span className="text-accent-400">{icon}</span>
        <span className="text-3xl sm:text-4xl font-extrabold tabular-nums gradient-number">{value}{suffix}</span>
      </div>
      <p className="text-xs text-ink-400 font-medium tracking-wide">{label}</p>
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
        <div className="flex items-center gap-2">
          {agents.map((agent, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-lg border transition-all ${
                agent.status === 'done'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40'
                  : agent.status === 'active'
                  ? 'bg-accent-50/80 dark:bg-accent-50/20 border-accent-300/60 dark:border-accent-300/30 ring-2 ring-accent-500/20 animate-pulse'
                  : 'bg-surface-100 border-surface-300'
              }`}>
                <span className="text-lg">{agent.emoji}</span>
                <span className="text-[10px] font-semibold text-ink-500">{agent.name}</span>
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
    { emoji: '🔬', name: 'Researcher', output: 'Found 12 sources on AI orchestration...' },
    { emoji: '✍️', name: 'Writer', output: 'Drafting 2,500-word article with 8 sections...' },
    { emoji: '📝', name: 'Editor', output: 'Quality score: 9.2/10 — refined tone & flow...' },
    { emoji: '🎯', name: 'SEO Agent', output: 'SEO score: 94/100 — optimized meta tags...' },
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
            <span className="text-xs font-semibold text-ink-500">Content Pipeline — Running</span>
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
