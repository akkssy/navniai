'use client'

import { useState } from 'react'

export interface ContentBrief {
  topic: string
  audience: string
  tone: 'professional' | 'conversational' | 'authoritative' | 'witty' | 'friendly'
  wordCount: number
  primaryKeyword: string
  secondaryKeywords: string
  notes: string
  useRAG: boolean
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', icon: '👔' },
  { value: 'conversational', label: 'Conversational', icon: '💬' },
  { value: 'authoritative', label: 'Authoritative', icon: '🎓' },
  { value: 'witty', label: 'Witty & Bold', icon: '⚡' },
  { value: 'friendly', label: 'Friendly Expert', icon: '😊' },
]

const WORD_COUNT_OPTIONS = [800, 1200, 1500, 2000, 3000]

interface ContentBriefFormProps {
  onSubmit: (brief: ContentBrief) => void
  isRunning: boolean
}

export function ContentBriefForm({ onSubmit, isRunning }: ContentBriefFormProps) {
  const [brief, setBrief] = useState<ContentBrief>({
    topic: '',
    audience: '',
    tone: 'friendly',
    wordCount: 1500,
    primaryKeyword: '',
    secondaryKeywords: '',
    notes: '',
    useRAG: false,
  })

  const update = (field: keyof ContentBrief, value: any) => {
    setBrief(prev => ({ ...prev, [field]: value }))
  }

  const canSubmit = brief.topic.trim().length > 0 && !isRunning

  return (
    <div className="w-96 bg-card border-r border-surface-300 flex flex-col h-full">
      <div className="px-5 py-4 border-b border-surface-300">
        <h2 className="text-sm font-semibold text-ink-700 flex items-center gap-2">
          📋 Content Brief
        </h2>
        <p className="text-[11px] text-ink-400 mt-1">Fill in your brief — the pipeline does the rest.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Topic */}
        <div>
          <label className="block text-[11px] font-medium text-ink-500 mb-1.5">Topic *</label>
          <input
            type="text"
            value={brief.topic}
            onChange={e => update('topic', e.target.value)}
            placeholder="e.g. How AI is transforming content marketing in 2026"
            className="w-full bg-surface-50 border border-surface-300 text-ink-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
          />
        </div>

        {/* Audience */}
        <div>
          <label className="block text-[11px] font-medium text-ink-500 mb-1.5">Target Audience</label>
          <input
            type="text"
            value={brief.audience}
            onChange={e => update('audience', e.target.value)}
            placeholder="e.g. SaaS marketers, beginner to intermediate"
            className="w-full bg-surface-50 border border-surface-300 text-ink-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
          />
        </div>

        {/* Primary Keyword */}
        <div>
          <label className="block text-[11px] font-medium text-ink-500 mb-1.5">Primary Keyword</label>
          <input
            type="text"
            value={brief.primaryKeyword}
            onChange={e => update('primaryKeyword', e.target.value)}
            placeholder="e.g. AI content marketing"
            className="w-full bg-surface-50 border border-surface-300 text-ink-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
          />
        </div>

        {/* Secondary Keywords */}
        <div>
          <label className="block text-[11px] font-medium text-ink-500 mb-1.5">Secondary Keywords</label>
          <input
            type="text"
            value={brief.secondaryKeywords}
            onChange={e => update('secondaryKeywords', e.target.value)}
            placeholder="AI writing tools, content automation, SEO AI"
            className="w-full bg-surface-50 border border-surface-300 text-ink-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
          />
        </div>

        {/* Tone */}
        <div>
          <label className="block text-[11px] font-medium text-ink-500 mb-1.5">Tone</label>
          <div className="grid grid-cols-2 gap-1.5">
            {TONE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => update('tone', opt.value)}
                className={`px-2.5 py-2 rounded-md text-[11px] font-medium border transition text-left flex items-center gap-1.5 ${
                  brief.tone === opt.value
                    ? 'bg-accent-50 border-accent-300 text-accent-700'
                    : 'bg-surface-50 border-surface-300 text-ink-500 hover:border-surface-400'
                }`}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Word Count */}
        <div>
          <label className="block text-[11px] font-medium text-ink-500 mb-1.5">Target Length</label>
          <div className="flex gap-1.5">
            {WORD_COUNT_OPTIONS.map(wc => (
              <button
                key={wc}
                onClick={() => update('wordCount', wc)}
                className={`flex-1 py-2 rounded-md text-[11px] font-medium border transition ${
                  brief.wordCount === wc
                    ? 'bg-accent-50 border-accent-300 text-accent-700'
                    : 'bg-surface-50 border-surface-300 text-ink-500 hover:border-surface-400'
                }`}
              >
                {wc >= 1000 ? `${(wc/1000).toFixed(wc % 1000 === 0 ? 0 : 1)}k` : wc}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[11px] font-medium text-ink-500 mb-1.5">Additional Notes</label>
          <textarea
            value={brief.notes}
            onChange={e => update('notes', e.target.value)}
            placeholder="Any specific angles, examples to include, competitor URLs, brand guidelines..."
            rows={3}
            className="w-full bg-surface-50 border border-surface-300 text-ink-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 resize-y transition"
          />
        </div>

        {/* RAG Knowledge Base Toggle */}
        <div className="bg-surface-50 border border-surface-300 rounded-lg p-3.5">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={brief.useRAG}
                onChange={e => update('useRAG', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-300 rounded-full peer peer-checked:bg-accent-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
            </div>
            <div>
              <span className="text-xs font-medium text-ink-700 flex items-center gap-1.5">
                🧠 Use Knowledge Base
              </span>
              <p className="text-[10px] text-ink-400 mt-0.5">
                Inject uploaded brand docs, style guides & reference material into every agent.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="px-5 py-4 border-t border-surface-300">
        <button
          onClick={() => canSubmit && onSubmit(brief)}
          disabled={!canSubmit}
          className="w-full btn-primary disabled:bg-surface-300 disabled:text-ink-300 text-sm flex items-center justify-center gap-2"
        >
          {isRunning ? (
            <><span className="animate-spin">⏳</span> Generating Content...</>
          ) : (
            <>🚀 Generate Content Package</>
          )}
        </button>
        <p className="text-[10px] text-ink-300 text-center mt-2">
          Runs 5 agents: Research → Write → Edit → SEO → Social
        </p>
      </div>
    </div>
  )
}

