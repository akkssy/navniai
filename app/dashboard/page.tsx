'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlusIcon, PlayIcon, ClockIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/outline'

export default function Dashboard() {
  const [workflows] = useState([
    { id: '1', name: 'PR Review Pipeline', status: 'active', runs: 45, lastRun: '2 hours ago' },
    { id: '2', name: 'Feature Development', status: 'draft', runs: 12, lastRun: '1 day ago' },
    { id: '3', name: 'Bug Fix Workflow', status: 'active', runs: 78, lastRun: '30 minutes ago' },
  ])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-dark-950/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-3.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <SparklesIcon className="h-6 w-6 text-primary-400" />
                <span className="text-lg font-bold gradient-text">NavniAI</span>
              </Link>
              <h1 className="text-sm font-medium text-dark-400">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2.5">
              <Link href="/settings" className="btn-secondary text-xs px-3.5 py-2">
                ⚙️ LLM Settings
              </Link>
              <Link href="/workflow/new" className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5">
                <PlusIcon className="h-4 w-4" />
                New Workflow
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Workflows" value="12" accent="text-primary-400" />
          <StatCard label="Active" value="8" accent="text-emerald-400" />
          <StatCard label="Total Runs" value="1,234" accent="text-amber-400" />
          <StatCard label="Success Rate" value="94%" accent="text-accent-400" />
        </div>

        {/* Workflows List */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white">Your Workflows</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {workflows.map((workflow) => (
              <WorkflowRow key={workflow.id} workflow={workflow} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <QuickAction title="Browse Templates" description="Pre-built workflow templates" href="/templates" icon="📚" />
          <QuickAction title="Workflow Builder" description="Create custom workflows visually" href="/workflow/builder" icon="🎨" />
          <QuickAction title="Documentation" description="Learn about agent orchestration" href="/docs" icon="📖" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string, value: string, accent: string }) {
  return (
    <div className="glass-card p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-dark-400 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}

function WorkflowRow({ workflow }: { workflow: any }) {
  return (
    <div className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-white">{workflow.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              workflow.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-white/[0.04] text-dark-400 border border-white/[0.06]'
            }`}>
              {workflow.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-dark-400">
            <span className="flex items-center gap-1">
              <PlayIcon className="h-3.5 w-3.5" />
              {workflow.runs} runs
            </span>
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              {workflow.lastRun}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary text-xs px-3.5 py-1.5">Run</button>
          <Link href={`/workflow/${workflow.id}`} className="btn-secondary text-xs px-3.5 py-1.5">
            Edit
          </Link>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ title, description, href, icon }: { title: string, description: string, href: string, icon: string }) {
  return (
    <Link href={href} className="glass-card-hover p-5 block group">
      <div className="text-2xl mb-2.5">{icon}</div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-dark-400">{description}</p>
    </Link>
  )
}

