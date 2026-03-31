'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlusIcon, PlayIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function Dashboard() {
  const [workflows] = useState([
    { id: '1', name: 'PR Review Pipeline', status: 'active', runs: 45, lastRun: '2 hours ago' },
    { id: '2', name: 'Feature Development', status: 'draft', runs: 12, lastRun: '1 day ago' },
    { id: '3', name: 'Bug Fix Workflow', status: 'active', runs: 78, lastRun: '30 minutes ago' },
  ])

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Workflow Dashboard</h1>
            <div className="flex items-center gap-3">
              <Link
                href="/settings"
                className="px-4 py-2 bg-dark-600 hover:bg-dark-500 rounded-lg flex items-center gap-2 transition text-gray-300"
              >
                ⚙️ LLM Settings
              </Link>
              <Link
                href="/workflow/new"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center gap-2 transition"
              >
                <PlusIcon className="h-5 w-5" />
                New Workflow
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard label="Total Workflows" value="12" icon="📊" />
          <StatCard label="Active Workflows" value="8" icon="✅" />
          <StatCard label="Total Runs" value="1,234" icon="▶️" />
          <StatCard label="Success Rate" value="94%" icon="🎯" />
        </div>

        {/* Workflows List */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-700">
            <h2 className="text-xl font-bold">Your Workflows</h2>
          </div>
          <div className="divide-y divide-dark-700">
            {workflows.map((workflow) => (
              <WorkflowRow key={workflow.id} workflow={workflow} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <QuickAction
            title="Browse Templates"
            description="Start with pre-built workflow templates"
            href="/templates"
            icon="📚"
          />
          <QuickAction
            title="Workflow Builder"
            description="Create custom workflows visually"
            href="/workflow/builder"
            icon="🎨"
          />
          <QuickAction
            title="Documentation"
            description="Learn about agent orchestration"
            href="/docs"
            icon="📖"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: string }) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  )
}

function WorkflowRow({ workflow }: { workflow: any }) {
  return (
    <div className="px-6 py-4 hover:bg-dark-700 transition cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{workflow.name}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              workflow.status === 'active' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {workflow.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <PlayIcon className="h-4 w-4" />
              {workflow.runs} runs
            </span>
            <span className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              Last run: {workflow.lastRun}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm transition">
            Run
          </button>
          <Link
            href={`/workflow/${workflow.id}`}
            className="px-4 py-2 bg-dark-600 hover:bg-dark-500 rounded-lg text-sm transition"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ title, description, href, icon }: { title: string, description: string, href: string, icon: string }) {
  return (
    <Link
      href={href}
      className="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:border-primary-600 transition block"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </Link>
  )
}

