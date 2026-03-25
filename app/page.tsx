'use client'

import Link from 'next/link'
import { ArrowRightIcon, SparklesIcon, BoltIcon, CpuChipIcon, UserGroupIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Navigation */}
      <nav className="border-b border-dark-700 bg-dark-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-8 w-8 text-primary-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
                NavniAI
              </span>
            </div>
            <div className="flex gap-4">
              <Link href="/login" className="px-4 py-2 text-gray-300 hover:text-white transition">
                Login
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-block px-4 py-1.5 bg-primary-600/20 border border-primary-500/30 rounded-full text-sm text-primary-400 mb-6">
            ✨ New beginnings in AI orchestration
          </div>
          <h1 className="text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              AI Agent Orchestration
            </span>
            <br />
            <span className="text-white">for Every Domain</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Build, connect, and run AI agent workflows visually — for coding, HR, legal, marketing,
            support, or any domain you can imagine. Create custom agents or use built-in ones.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/workflow/builder"
              className="px-8 py-4 bg-primary-600 hover:bg-primary-700 rounded-lg text-lg font-semibold flex items-center gap-2 transition"
            >
              Start Building
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-lg text-lg font-semibold transition"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <FeatureCard
            icon={<BoltIcon className="h-12 w-12 text-yellow-500" />}
            title="Visual Workflow Builder"
            description="Drag-and-drop canvas to create multi-agent workflows. Connect agents, configure actions, and run — no code required."
          />
          <FeatureCard
            icon={<PuzzlePieceIcon className="h-12 w-12 text-blue-500" />}
            title="Create Custom Agents"
            description="Define agents for any role — recruiter, contract reviewer, content writer — with custom prompts and actions."
          />
          <FeatureCard
            icon={<UserGroupIcon className="h-12 w-12 text-purple-500" />}
            title="Any Domain"
            description="Built-in coding agents plus the power to create agents for HR, legal, marketing, sales, support, and more."
          />
        </div>

        {/* Domain Examples */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Works Across Domains</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <DomainExample
              title="Code Review Pipeline"
              agents={[
                { icon: '⚡', label: 'Generator' },
                { icon: '🔍', label: 'Reviewer' },
                { icon: '🧪', label: 'Tester' },
                { icon: '✅', label: 'Deploy' },
              ]}
            />
            <DomainExample
              title="HR Hiring Pipeline"
              agents={[
                { icon: '📄', label: 'Screen Resume' },
                { icon: '💬', label: 'Interview Q&A' },
                { icon: '📊', label: 'Evaluation' },
                { icon: '📧', label: 'Outreach' },
              ]}
            />
            <DomainExample
              title="Legal Contract Review"
              agents={[
                { icon: '📑', label: 'Parse Contract' },
                { icon: '⚖️', label: 'Compliance' },
                { icon: '🚩', label: 'Risk Score' },
                { icon: '📝', label: 'Summary' },
              ]}
            />
            <DomainExample
              title="Content Marketing"
              agents={[
                { icon: '💡', label: 'Ideation' },
                { icon: '✍️', label: 'Writer' },
                { icon: '🎨', label: 'Visual' },
                { icon: '📱', label: 'Social Posts' },
              ]}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 bg-gradient-to-r from-primary-900/40 to-purple-900/40 border border-primary-700/30 rounded-xl p-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to orchestrate?</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Start with 8 built-in coding agents, or create your own for any use case.
          </p>
          <Link
            href="/workflow/builder"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 rounded-lg text-lg font-semibold transition"
          >
            Open Workflow Builder
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:border-primary-600 transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

function DomainExample({ title, agents }: { title: string, agents: { icon: string, label: string }[] }) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div className="flex items-center gap-2 flex-wrap">
        {agents.map((agent, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1 bg-dark-700 px-4 py-2 rounded-lg border border-dark-600">
              <span className="text-xl">{agent.icon}</span>
              <span className="text-xs font-medium text-gray-300">{agent.label}</span>
            </div>
            {i < agents.length - 1 && <ArrowRightIcon className="h-4 w-4 text-gray-600 mx-1" />}
          </div>
        ))}
      </div>
    </div>
  )
}

