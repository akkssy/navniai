'use client'

import Link from 'next/link'
import { SparklesIcon, PlayIcon, PencilSquareIcon, ClockIcon } from '@heroicons/react/24/outline'

// Mock data — will be replaced with API calls
const mockWorkflows: Record<string, { name: string; status: string; runs: number; lastRun: string; steps: string[] }> = {
  '1': { name: 'PR Review Pipeline', status: 'active', runs: 45, lastRun: '2 hours ago', steps: ['Security Scan', 'Code Review', 'Post Summary'] },
  '2': { name: 'Feature Development', status: 'draft', runs: 12, lastRun: '1 day ago', steps: ['Generate Code', 'Write Tests', 'Generate Docs', 'Create PR'] },
  '3': { name: 'Bug Fix Workflow', status: 'active', runs: 78, lastRun: '30 minutes ago', steps: ['Analyze Error', 'Generate Fix', 'Write Regression Test', 'Review Fix'] },
}

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const workflow = mockWorkflows[id]

  if (!workflow) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-600 mb-4">404</h1>
          <p className="text-gray-400 mb-6">Workflow not found</p>
          <Link href="/dashboard" className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <nav className="border-b border-dark-700 bg-dark-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <SparklesIcon className="h-8 w-8 text-primary-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
                Cognify AI
              </span>
            </Link>
            <Link href="/dashboard" className="px-4 py-2 text-gray-300 hover:text-white transition">
              ← Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Workflow Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{workflow.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                workflow.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'
              }`}>
                {workflow.status}
              </span>
              <span className="flex items-center gap-1"><ClockIcon className="h-4 w-4" /> Last run: {workflow.lastRun}</span>
              <span>{workflow.runs} total runs</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/workflow/builder?edit=${id}`}
              className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg transition"
            >
              <PencilSquareIcon className="h-4 w-4" /> Edit
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition">
              <PlayIcon className="h-4 w-4" /> Run Now
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Pipeline Steps</h2>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {workflow.steps.map((step, i) => (
              <div key={step} className="flex items-center gap-3 shrink-0">
                <div className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-sm">
                  <span className="text-gray-500 mr-2">{i + 1}.</span>
                  {step}
                </div>
                {i < workflow.steps.length - 1 && (
                  <span className="text-gray-600">→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Runs (placeholder) */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Runs</h2>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between bg-dark-700 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="text-sm text-gray-300">Run #{workflow.runs - i}</span>
                </div>
                <span className="text-xs text-gray-500">{i === 0 ? workflow.lastRun : `${i + 1} days ago`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

