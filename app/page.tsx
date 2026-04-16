'use client'

import Link from 'next/link'
import { ArrowRightIcon, SparklesIcon, BoltIcon, UserGroupIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline'
import ThemeToggle from '@/components/ThemeToggle'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-surface-300 bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <SparklesIcon className="h-7 w-7 text-accent-500" />
              <span className="text-xl font-bold text-ink-700">NavniAI</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/login" className="px-4 py-2 text-sm text-ink-400 hover:text-ink-700 transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary text-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section — Split Layout */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center animate-fade-in">
          {/* Left — Text / Branding */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-accent-50 text-accent-600 text-xs font-medium rounded-md mb-6 border border-accent-100">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
              Visual AI Agent Orchestration
            </div>
            <h1 className="heading-serif text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-ink-700">
              Intelligence,<br />
              <span className="text-accent-500">refined.</span>
            </h1>
            <p className="text-lg text-ink-400 mb-10 leading-relaxed max-w-lg">
              Visually orchestrate multi-agent pipelines for coding, HR, legal,
              marketing — or any domain you can imagine.
            </p>
            <div className="flex gap-3">
              <Link href="/workflow/builder" className="btn-primary text-base px-7 py-3 flex items-center gap-2">
                Start Building
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="btn-secondary text-base px-7 py-3">
                Dashboard
              </Link>
            </div>
          </div>

          {/* Right — AI Thinking Canvas */}
          <div className="relative">
            <div className="glass-card p-6 space-y-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                <span className="text-xs font-medium text-ink-400">Generating insight...</span>
              </div>
              {['Analyzing document structure...', 'Identifying key compliance risks...', 'Generating executive summary...'].map((text, i) => (
                <div key={i} className="p-4 bg-surface-100 rounded-md border border-surface-300" style={{ animationDelay: `${i * 150}ms` }}>
                  <p className="text-sm text-ink-500">{text}</p>
                </div>
              ))}
              <div className="p-4 bg-accent-50 rounded-md border border-accent-100">
                <p className="text-sm text-accent-700 font-medium">✓ 3 risks identified, report ready</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-5 mt-28">
          <FeatureCard
            icon={<BoltIcon className="h-5 w-5" />}
            color="text-amber-600"
            bgColor="bg-amber-50"
            title="Visual Workflow Builder"
            description="Drag-and-drop canvas to create multi-agent workflows. Connect agents, configure actions, and run."
          />
          <FeatureCard
            icon={<PuzzlePieceIcon className="h-5 w-5" />}
            color="text-accent-600"
            bgColor="bg-accent-50"
            title="Custom Agents"
            description="Define agents for any role — recruiter, contract reviewer, content writer — with custom prompts."
          />
          <FeatureCard
            icon={<UserGroupIcon className="h-5 w-5" />}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
            title="Any Domain"
            description="Built-in coding agents plus the power to create agents for HR, legal, marketing, and more."
          />
        </div>

        {/* Domain Examples */}
        <div className="mt-28">
          <div className="text-center mb-10">
            <p className="section-label mb-3">Use Cases</p>
            <h2 className="heading-serif text-3xl font-bold tracking-tight text-ink-700">Works Across Domains</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <DomainExample title="Code Review Pipeline" agents={[
              { icon: '⚡', label: 'Generator' }, { icon: '🔍', label: 'Reviewer' },
              { icon: '🧪', label: 'Tester' }, { icon: '✅', label: 'Deploy' },
            ]} />
            <DomainExample title="HR Hiring Pipeline" agents={[
              { icon: '📄', label: 'Screen' }, { icon: '💬', label: 'Interview' },
              { icon: '📊', label: 'Evaluate' }, { icon: '📧', label: 'Outreach' },
            ]} />
            <DomainExample title="Legal Contract Review" agents={[
              { icon: '📑', label: 'Parse' }, { icon: '⚖️', label: 'Compliance' },
              { icon: '🚩', label: 'Risk' }, { icon: '📝', label: 'Summary' },
            ]} />
            <DomainExample title="Content Marketing" agents={[
              { icon: '💡', label: 'Ideation' }, { icon: '✍️', label: 'Writer' },
              { icon: '🎨', label: 'Visual' }, { icon: '📱', label: 'Publish' },
            ]} />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-28 mb-12 glass-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-50 to-surface-100" />
          <div className="relative">
            <h2 className="heading-serif text-3xl font-bold tracking-tight mb-3 text-ink-700">Ready to orchestrate?</h2>
            <p className="text-ink-400 mb-8 max-w-lg mx-auto">
              Start with 8 built-in coding agents, or create your own for any use case.
            </p>
            <Link href="/workflow/builder" className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
              Open Workflow Builder
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description, color, bgColor }: { icon: React.ReactNode, title: string, description: string, color: string, bgColor: string }) {
  return (
    <div className="glass-card-hover p-6 group">
      <div className={`${color} ${bgColor} mb-4 p-2.5 rounded-md w-fit`}>{icon}</div>
      <h3 className="text-base font-semibold mb-2 text-ink-700">{title}</h3>
      <p className="text-sm text-ink-400 leading-relaxed">{description}</p>
    </div>
  )
}

function DomainExample({ title, agents }: { title: string, agents: { icon: string, label: string }[] }) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold mb-4 text-ink-500">{title}</h3>
      <div className="flex items-center gap-1.5">
        {agents.map((agent, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="flex flex-col items-center gap-1 bg-surface-100 border border-surface-300 px-3 py-2 rounded-md">
              <span className="text-lg">{agent.icon}</span>
              <span className="text-[10px] font-medium text-ink-400">{agent.label}</span>
            </div>
            {i < agents.length - 1 && (
              <div className="w-4 h-px bg-surface-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

