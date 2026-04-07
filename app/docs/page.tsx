'use client'

import Link from 'next/link'
import { SparklesIcon, BookOpenIcon } from '@heroicons/react/24/outline'

const sections = [
  {
    title: 'Getting Started',
    icon: '🚀',
    items: [
      { name: 'What is NavniAI?', desc: 'Overview of agent orchestration for developers' },
      { name: 'Quick Start Guide', desc: 'Create your first workflow in 5 minutes' },
      { name: 'Core Concepts', desc: 'Agents, workflows, steps, and connections' },
    ],
  },
  {
    title: 'Agents',
    icon: '🤖',
    items: [
      { name: 'Code Generator', desc: 'Generate features, components, and boilerplate' },
      { name: 'Code Reviewer', desc: 'Automated code quality analysis' },
      { name: 'Security Scanner', desc: 'Vulnerability detection and remediation' },
      { name: 'Test Writer', desc: 'Generate unit, integration, and E2E tests' },
      { name: 'Documenter', desc: 'Auto-generate API docs and READMEs' },
      { name: 'Debug Helper', desc: 'Stack trace analysis and error resolution' },
      { name: 'Refactor Agent', desc: 'Code improvement and tech debt reduction' },
      { name: 'DevOps Agent', desc: 'CI/CD, PRs, and deployment automation' },
    ],
  },
  {
    title: 'Workflow Builder',
    icon: '🔧',
    items: [
      { name: 'Visual Canvas', desc: 'Drag-and-drop workflow design with React Flow' },
      { name: 'Connecting Agents', desc: 'Wire outputs from one agent into another' },
      { name: 'Conditional Branching', desc: 'Route execution based on agent results' },
      { name: 'Parallel Execution', desc: 'Run independent agents simultaneously' },
    ],
  },
  {
    title: 'Integrations',
    icon: '🔗',
    items: [
      { name: 'GitHub', desc: 'PR creation, branch management, webhooks' },
      { name: 'LLM Providers', desc: 'Bring Your Own Key — Ollama, Groq, OpenAI, Google' },
      { name: 'API & Webhooks', desc: 'Trigger workflows from external services' },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <nav className="border-b border-white/[0.06] bg-dark-950/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <SparklesIcon className="h-7 w-7 text-primary-400" />
              <span className="text-xl font-bold gradient-text">NavniAI</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm text-dark-300 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/workflow/builder" className="btn-primary text-sm">Open Builder</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-10">
          <BookOpenIcon className="h-8 w-8 text-primary-400" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Documentation</h1>
            <p className="text-dark-400 text-sm mt-0.5">Learn how to build automated workflows with NavniAI</p>
          </div>
        </div>

        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>{section.icon}</span> {section.title}
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {section.items.map((item) => (
                  <div key={item.name} className="glass-card-hover p-4 cursor-pointer">
                    <h3 className="text-sm font-semibold text-white mb-0.5">{item.name}</h3>
                    <p className="text-xs text-dark-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 glass-card p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/[0.04] to-accent-500/[0.04]" />
          <div className="relative">
            <p className="text-dark-400 text-sm mb-4">Ready to build your first workflow?</p>
            <Link href="/workflow/builder" className="btn-primary inline-flex items-center gap-2">
              Open Workflow Builder →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

