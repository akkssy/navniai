'use client'

import Link from 'next/link'
import { SparklesIcon, BookOpenIcon } from '@heroicons/react/24/outline'

const sections = [
  {
    title: 'Getting Started',
    icon: '🚀',
    items: [
      { name: 'What is Cognify AI?', desc: 'Overview of agent orchestration for developers' },
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
            <div className="flex gap-4">
              <Link href="/dashboard" className="px-4 py-2 text-gray-300 hover:text-white transition">
                Dashboard
              </Link>
              <Link href="/workflow/builder" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition">
                Open Builder
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <BookOpenIcon className="h-10 w-10 text-primary-500" />
          <div>
            <h1 className="text-4xl font-bold">Documentation</h1>
            <p className="text-gray-400 mt-1">Learn how to build automated developer workflows with Cognify AI</p>
          </div>
        </div>

        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>{section.icon}</span> {section.title}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {section.items.map((item) => (
                  <div
                    key={item.name}
                    className="bg-dark-800 border border-dark-700 rounded-lg p-5 hover:border-primary-600 transition cursor-pointer"
                  >
                    <h3 className="font-semibold text-white mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-dark-800 border border-dark-700 rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">Ready to build your first workflow?</p>
          <Link
            href="/workflow/builder"
            className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition"
          >
            Open Workflow Builder →
          </Link>
        </div>
      </div>
    </div>
  )
}

