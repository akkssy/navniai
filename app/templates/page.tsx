'use client'

import Link from 'next/link'
import { SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

const templates = [
  {
    id: 'pr-review',
    name: 'PR Review Pipeline',
    icon: '📋',
    color: '#8b5cf6',
    description: 'Automated code review for pull requests. Runs security scan, code quality analysis, and posts a summary comment.',
    agents: ['Security Scanner', 'Code Reviewer', 'DevOps Agent'],
    runs: '12.4K',
    category: 'Code Quality',
  },
  {
    id: 'feature-dev',
    name: 'Feature Development',
    icon: '🚀',
    color: '#3b82f6',
    description: 'End-to-end feature creation: generates code, writes tests, creates documentation, and opens a PR.',
    agents: ['Code Generator', 'Test Writer', 'Documenter', 'DevOps Agent'],
    runs: '8.7K',
    category: 'Development',
  },
  {
    id: 'bug-fix',
    name: 'Bug Fix Workflow',
    icon: '🐛',
    color: '#ef4444',
    description: 'Analyze error logs, identify root cause, generate a fix, write regression tests, and submit for review.',
    agents: ['Debug Helper', 'Code Generator', 'Test Writer', 'Code Reviewer'],
    runs: '6.2K',
    category: 'Debugging',
  },
  {
    id: 'security-audit',
    name: 'Security Audit',
    icon: '🔒',
    color: '#ec4899',
    description: 'Comprehensive security scan: vulnerability detection, dependency audit, and remediation suggestions.',
    agents: ['Security Scanner', 'Code Reviewer', 'Refactor Agent'],
    runs: '4.1K',
    category: 'Security',
  },
  {
    id: 'code-refactor',
    name: 'Code Refactoring',
    icon: '🔄',
    color: '#06b6d4',
    description: 'Analyze code quality, identify tech debt, refactor for readability and performance, then verify with tests.',
    agents: ['Code Reviewer', 'Refactor Agent', 'Test Writer'],
    runs: '3.8K',
    category: 'Code Quality',
  },
  {
    id: 'api-docs',
    name: 'API Documentation',
    icon: '📚',
    color: '#f59e0b',
    description: 'Auto-generate comprehensive API docs from your codebase, including examples and schemas.',
    agents: ['Documenter', 'Code Reviewer'],
    runs: '2.9K',
    category: 'Documentation',
  },
]

export default function TemplatesPage() {
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Workflow Templates</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Start with a pre-built template and customize it to fit your needs. Each template chains multiple AI agents into an automated pipeline.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/workflow/builder?template=${template.id}`}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:border-primary-600 transition group block"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{template.icon}</span>
                <span className="text-xs text-gray-500 bg-dark-700 px-2 py-1 rounded">{template.category}</span>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary-400 transition">{template.name}</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">{template.description}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {template.agents.map((agent) => (
                  <span key={agent} className="text-xs bg-dark-700 text-gray-300 px-2 py-1 rounded">
                    {agent}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-dark-700">
                <span className="text-xs text-gray-500">{template.runs} uses</span>
                <span className="text-primary-400 text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Use template <ArrowRightIcon className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

