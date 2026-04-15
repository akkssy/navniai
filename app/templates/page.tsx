'use client'

import Link from 'next/link'
import { SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { PIPELINE_TEMPLATES, getAgentForStep } from '@/lib/pipelineTemplates'

const templates = PIPELINE_TEMPLATES

export default function TemplatesPage() {
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

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <p className="section-label mb-3">Templates</p>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Workflow Templates</h1>
          <p className="text-dark-400 text-sm max-w-xl mx-auto">
            Start with a pre-built template and customize it. Each chains multiple AI agents into an automated pipeline.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Link key={template.id} href={`/workflow/builder?template=${template.id}`}
              className="glass-card-hover p-5 group block">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{template.icon}</span>
                <span className="text-[10px] font-medium text-dark-400 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full">{template.category}</span>
              </div>
              <h3 className="text-sm font-semibold mb-1.5 text-white group-hover:text-primary-400 transition">{template.name}</h3>
              <p className="text-xs text-dark-400 mb-3 leading-relaxed">{template.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {template.steps.map((step, i) => {
                  const agent = getAgentForStep(step)
                  return (
                    <span key={step.agentId + i} className="text-[10px] bg-white/[0.04] border border-white/[0.06] text-dark-300 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <span>{agent?.icon || '⚙️'}</span>{step.label}
                    </span>
                  )
                })}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                <span className="text-[10px] text-dark-500">{template.runs.toLocaleString()} runs • {template.steps.length} steps</span>
                <span className="text-primary-400 text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
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

