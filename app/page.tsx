'use client'

import Link from 'next/link'
import { ArrowRightIcon, SparklesIcon, BoltIcon, UserGroupIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-600/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-500/[0.05] rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/[0.06] bg-dark-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <SparklesIcon className="h-7 w-7 text-primary-400" />
              <span className="text-xl font-bold gradient-text">NavniAI</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm text-dark-300 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary text-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass-card text-xs text-primary-300 mb-8 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            Visual AI Agent Orchestration
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-white">Build AI workflows</span>
            <br />
            <span className="gradient-text">for every domain</span>
          </h1>
          <p className="text-lg text-dark-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Visually orchestrate multi-agent pipelines for coding, HR, legal,
            marketing — or any domain you can imagine.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/workflow/builder" className="btn-primary text-base px-7 py-3 flex items-center gap-2">
              Start Building
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link href="/dashboard" className="btn-secondary text-base px-7 py-3">
              Dashboard
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-5 mt-24">
          <FeatureCard
            icon={<BoltIcon className="h-6 w-6" />}
            color="text-amber-400"
            title="Visual Workflow Builder"
            description="Drag-and-drop canvas to create multi-agent workflows. Connect agents, configure actions, and run."
          />
          <FeatureCard
            icon={<PuzzlePieceIcon className="h-6 w-6" />}
            color="text-primary-400"
            title="Custom Agents"
            description="Define agents for any role — recruiter, contract reviewer, content writer — with custom prompts."
          />
          <FeatureCard
            icon={<UserGroupIcon className="h-6 w-6" />}
            color="text-accent-400"
            title="Any Domain"
            description="Built-in coding agents plus the power to create agents for HR, legal, marketing, and more."
          />
        </div>

        {/* Domain Examples */}
        <div className="mt-24">
          <div className="text-center mb-10">
            <p className="section-label mb-3">Use Cases</p>
            <h2 className="text-3xl font-bold tracking-tight">Works Across Domains</h2>
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
        <div className="mt-24 mb-12 glass-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/[0.06] to-accent-500/[0.06]" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Ready to orchestrate?</h2>
            <p className="text-dark-400 mb-8 max-w-lg mx-auto">
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

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <div className="glass-card-hover p-6 group">
      <div className={`${color} mb-4 p-2.5 rounded-xl bg-white/[0.03] w-fit`}>{icon}</div>
      <h3 className="text-base font-semibold mb-2 text-white">{title}</h3>
      <p className="text-sm text-dark-400 leading-relaxed">{description}</p>
    </div>
  )
}

function DomainExample({ title, agents }: { title: string, agents: { icon: string, label: string }[] }) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold mb-4 text-dark-300">{title}</h3>
      <div className="flex items-center gap-1.5">
        {agents.map((agent, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="flex flex-col items-center gap-1 bg-white/[0.03] border border-white/[0.06] px-3 py-2 rounded-xl">
              <span className="text-lg">{agent.icon}</span>
              <span className="text-[10px] font-medium text-dark-400">{agent.label}</span>
            </div>
            {i < agents.length - 1 && (
              <div className="w-4 h-px bg-white/[0.1]" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

