'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SparklesIcon, RocketLaunchIcon, CpuChipIcon } from '@heroicons/react/24/outline'

const FEATURED = [
  {
    id: 'viral-social',
    icon: '🔥',
    name: 'Viral Social Media',
    description: 'Trend Scout → Audience Persona → 16 Hook Variants → Reel Script → Carousel → Viral Score',
    color: '#f97316',
    badge: 'Most Popular',
  },
  {
    id: 'marketing-content',
    icon: '✨',
    name: 'Content Marketing Pack',
    description: 'Research → Blog Post → Social Posts → Email Newsletter → Analytics Hook',
    color: '#8b5cf6',
    badge: 'Best for Starters',
  },
  {
    id: 'pr-review',
    icon: '📋',
    name: 'PR Review Pipeline',
    description: 'Security Scan → Code Quality → Test Coverage → Summary Comment',
    color: '#3b82f6',
    badge: 'For Dev Teams',
  },
]

const STEPS = ['Welcome', 'Pick Template', 'LLM Setup', 'Launch']

interface Props {
  onDismiss: () => void
}

// ─── Step Components ──────────────────────────────────────────────────────────

function StepWelcome() {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 rounded-2xl bg-accent-100 dark:bg-accent-950 flex items-center justify-center">
          <SparklesIcon className="h-8 w-8 text-accent-500" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-ink-700 mb-2">Welcome to NavniAI</h2>
      <p className="text-sm text-ink-400 mb-8 max-w-md mx-auto">
        An AI agent orchestration platform. Chain multiple AI agents together into automated pipelines — each step builds on the last.
      </p>
      <div className="grid grid-cols-3 gap-4 text-left">
        {[
          { icon: '🔗', title: 'Multi-Agent Pipelines', desc: 'Connect agents in sequence. Output of one becomes input of the next.' },
          { icon: '⚡', title: 'Live Canvas Execution', desc: 'Watch each node light up in real-time as the pipeline runs.' },
          { icon: '🎯', title: '16 Content Frameworks', desc: 'Proven viral hook templates, persona mapping, and platform variants.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="glass-card p-4 rounded-xl">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-xs font-semibold text-ink-700 mb-1">{title}</p>
            <p className="text-[11px] text-ink-400">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepPick({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-ink-700 mb-1">Choose your first pipeline</h2>
      <p className="text-sm text-ink-400 mb-6">You can run any template at any time from the dashboard.</p>
      <div className="space-y-3">
        {FEATURED.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
              selected === t.id
                ? 'border-accent-400 bg-accent-50 dark:bg-accent-950/30'
                : 'border-surface-300 hover:border-surface-400 bg-card'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl shrink-0 pt-0.5">{t.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-ink-700">{t.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-100 text-ink-400 border border-surface-300">{t.badge}</span>
                </div>
                <p className="text-[11px] text-ink-400 truncate">{t.description}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                selected === t.id ? 'border-accent-500 bg-accent-500' : 'border-surface-300'
              }`}>
                {selected === t.id && <span className="text-white text-[9px] font-bold">✓</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepLLM() {
  return (
    <div>
      <h2 className="text-xl font-bold text-ink-700 mb-1">Connect an AI provider</h2>
      <p className="text-sm text-ink-400 mb-6">NavniAI needs at least one LLM provider to run pipelines.</p>
      <div className="space-y-3 mb-6">
        {[
          { icon: '🦙', name: 'Ollama (Local)', desc: 'Free, runs on your machine. Install Ollama + pull a model like qwen3:8b.', href: 'https://ollama.com', tag: 'Free & Private' },
          { icon: '♊', name: 'Google Gemini', desc: 'Fast and generous free tier. Add your API key in Settings.', href: 'https://aistudio.google.com/app/apikey', tag: 'Free Tier' },
          { icon: '🤖', name: 'OpenAI', desc: 'GPT-4o and beyond. Add your API key in Settings.', href: 'https://platform.openai.com/api-keys', tag: 'Pay-per-use' },
        ].map(p => (
          <div key={p.name} className="flex items-center gap-4 p-4 rounded-xl border border-surface-300 bg-card">
            <span className="text-xl shrink-0">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-ink-700">{p.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800">{p.tag}</span>
              </div>
              <p className="text-[11px] text-ink-400">{p.desc}</p>
            </div>
            <a href={p.href} target="_blank" rel="noreferrer" className="text-[11px] text-accent-500 hover:underline shrink-0">
              Docs ↗
            </a>
          </div>
        ))}
      </div>
      <div className="text-center">
        <a href="/settings" target="_blank" className="btn-primary text-sm px-5 py-2 inline-flex items-center gap-2">
          <CpuChipIcon className="h-4 w-4" /> Open LLM Settings ↗
        </a>
        <p className="text-[11px] text-ink-300 mt-2">Opens in a new tab — come back when done.</p>
      </div>
    </div>
  )
}

function StepLaunch({ template }: { template: typeof FEATURED[0] }) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-5">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl" style={{ background: template.color + '18' }}>
          {template.icon}
        </div>
      </div>
      <h2 className="text-2xl font-bold text-ink-700 mb-2">You're all set!</h2>
      <p className="text-sm text-ink-400 mb-6">
        You're about to launch the <strong className="text-ink-700">{template.name}</strong> pipeline.
        A brief form will pop up so you can fill in your niche and target audience — then the agents take over.
      </p>
      <div className="glass-card p-5 rounded-xl text-left max-w-sm mx-auto">
        <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider mb-3">What happens next</p>
        {['Fill the brief form (niche, persona, platform)', 'Watch nodes execute live on the canvas', 'Copy or download your output as Markdown'].map((step, i) => (
          <div key={i} className="flex items-center gap-3 mb-2 last:mb-0">
            <span className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-950 text-accent-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
            <span className="text-xs text-ink-600">{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OnboardingWizard({ onDismiss }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState(FEATURED[0].id)

  function dismiss() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('navniai_onboarding_v1', 'done')
    }
    onDismiss()
  }

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  function back() { setStep(s => Math.max(s - 1, 0)) }

  function launch() {
    dismiss()
    router.push(`/workflow/builder?template=${selectedTemplate}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-surface-300 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">

        {/* Progress bar */}
        <div className="flex border-b border-surface-300">
          {STEPS.map((label, i) => (
            <div key={label} className={`flex-1 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              i === step ? 'text-accent-600 border-b-2 border-accent-500' :
              i < step ? 'text-emerald-600' : 'text-ink-300'
            }`}>
              {i < step ? '✓ ' : ''}{label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="p-8 flex-1">
          {step === 0 && <StepWelcome />}
          {step === 1 && <StepPick selected={selectedTemplate} onSelect={setSelectedTemplate} />}
          {step === 2 && <StepLLM />}
          {step === 3 && <StepLaunch template={FEATURED.find(t => t.id === selectedTemplate)!} />}
        </div>

        {/* Footer */}
        <div className="border-t border-surface-300 px-8 py-4 flex items-center justify-between bg-surface-50/50">
          <button onClick={dismiss} className="text-xs text-ink-300 hover:text-ink-500 transition">
            Skip for now
          </button>
          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={back} className="btn-secondary text-sm px-4 py-2">← Back</button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="btn-primary text-sm px-5 py-2">
                {step === 2 ? 'I\'m ready →' : 'Next →'}
              </button>
            ) : (
              <button onClick={launch} className="btn-primary text-sm px-6 py-2 flex items-center gap-2">
                <RocketLaunchIcon className="h-4 w-4" /> Launch Pipeline
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
