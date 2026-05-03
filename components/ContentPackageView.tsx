'use client'

import { useState } from 'react'

import type { AgentStructuredOutput } from '@/lib/agentOutputParser'

interface StepOutput { output: string; status: string; provider?: string; structured?: AgentStructuredOutput }

const TAB_CONFIG: { agentId: string; label: string; icon: string }[] = [
  { agentId: 'researcher', label: 'Research', icon: '🔍' },
  { agentId: 'writer', label: 'Article', icon: '✍️' },
  { agentId: 'editor', label: 'Edited', icon: '📝' },
  { agentId: 'seo_optimizer', label: 'SEO', icon: '📊' },
  { agentId: 'social_writer', label: 'Social', icon: '📱' },
]

interface ContentPackageViewProps {
  outputs: Record<string, StepOutput>
  nodeAgentMap: Record<string, string>
  onClose: () => void
}

// ─── Section Parser ───
function parseSections(raw: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const regex = /===([A-Z_]+)===/g
  let match: RegExpExecArray | null
  const markers: { key: string; start: number }[] = []
  while ((match = regex.exec(raw)) !== null) {
    markers.push({ key: match[1], start: match.index + match[0].length })
  }
  for (let i = 0; i < markers.length; i++) {
    const end = i + 1 < markers.length ? raw.lastIndexOf('===', markers[i + 1].start - markers[i + 1].key.length - 3) : raw.length
    sections[markers[i].key] = raw.slice(markers[i].start, end).trim()
  }
  if (markers.length === 0) sections['_RAW'] = raw
  return sections
}

function lines(s: string) { return s.split('\n').filter(l => l.trim()) }
function bulletLines(s: string) { return s.split('\n').filter(l => l.trim().match(/^[-•*]/)) }

// ─── Shared UI Helpers ───
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  )
}

function FallbackRenderer({ raw }: { raw: string }) {
  return (
    <article className="prose prose-sm max-w-none text-ink-600 leading-relaxed prose-headings:text-ink-700 prose-headings:font-semibold">
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-transparent border-none p-0">{raw}</pre>
    </article>
  )
}

// ─── Research Renderer ───
function ResearchRenderer({ raw }: { raw: string }) {
  const s = parseSections(raw)
  if (s._RAW) return <FallbackRenderer raw={s._RAW} />
  return (
    <div className="space-y-6">
      {s.KEY_FINDINGS && (
        <Section title="Key Findings" icon="💡">
          <div className="grid gap-2">{bulletLines(s.KEY_FINDINGS).map((line, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <span className="text-amber-500 mt-0.5 shrink-0">◆</span>
              <span className="text-sm text-ink-600">{line.replace(/^[-•*]\s*/, '')}</span>
            </div>
          ))}</div>
        </Section>
      )}
      {s.AUDIENCE_PROFILE && <Section title="Audience Profile" icon="👥"><pre className="whitespace-pre-wrap text-sm text-ink-600 leading-relaxed bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">{s.AUDIENCE_PROFILE}</pre></Section>}
      {s.KEYWORDS && (
        <Section title="Keywords" icon="🏷️">
          <div className="flex flex-wrap gap-2">{lines(s.KEYWORDS).map((line, i) => {
            const isP = line.toLowerCase().startsWith('primary')
            return <div key={i} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${isP ? 'bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-300 border-accent-300 dark:border-accent-700' : 'bg-surface-100 dark:bg-surface-800 text-ink-500 border-surface-300 dark:border-surface-600'}`}>{line.trim()}</div>
          })}</div>
        </Section>
      )}
      {s.COMPETITIVE_GAPS && (
        <Section title="Competitor Gaps" icon="🎯">{lines(s.COMPETITIVE_GAPS).map((line, i) => (
          <div key={i} className="flex gap-2 items-start py-1.5"><span className="text-red-400 shrink-0 mt-0.5">⚠</span><span className="text-sm text-ink-600">{line.replace(/^[-•*\d.]\s*/, '')}</span></div>
        ))}</Section>
      )}
      {s.UNIQUE_ANGLE && <Section title="Unique Angle" icon="✨"><div className="p-4 rounded-lg bg-accent-50 dark:bg-accent-950/30 border-l-4 border-accent-400"><p className="text-sm text-ink-600 italic">{s.UNIQUE_ANGLE}</p></div></Section>}
      {s.CONTENT_OUTLINE && <Section title="Content Outline" icon="📋"><pre className="whitespace-pre-wrap text-sm text-ink-600 leading-relaxed bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">{s.CONTENT_OUTLINE}</pre></Section>}
      {s.BRIEF_SUMMARY && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">📄 Brief Summary</h4>
          <pre className="whitespace-pre-wrap text-sm text-ink-600 leading-relaxed">{s.BRIEF_SUMMARY}</pre>
        </div>
      )}
    </div>
  )
}

// ─── Article Renderer ───
function ArticleRenderer({ raw }: { raw: string }) {
  const s = parseSections(raw)
  const meta = s.META; const article = s.ARTICLE || s._RAW || raw
  return (
    <div className="space-y-4">
      {meta && (
        <div className="flex flex-wrap gap-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
          {meta.split('\n').filter(l => l.includes(':')).map((line, i) => {
            const [label, ...rest] = line.split(':')
            return <div key={i} className="flex items-center gap-2"><span className="text-[10px] font-semibold text-ink-400 uppercase">{label.trim()}</span><span className="text-xs text-ink-600 bg-card px-2 py-0.5 rounded border border-surface-300 dark:border-surface-600">{rest.join(':').trim()}</span></div>
          })}
        </div>
      )}
      <FallbackRenderer raw={article} />
    </div>
  )
}

// ─── Editor Renderer ───
function EditorRenderer({ raw }: { raw: string }) {
  const s = parseSections(raw)
  if (s._RAW) return <FallbackRenderer raw={s._RAW} />
  return (
    <div className="space-y-6">
      {s.EDITOR_SCORES && (
        <Section title="Editor Scores" icon="📊">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{lines(s.EDITOR_SCORES).filter(l => l.includes(':')).map((line, i) => {
            const [label, val] = line.split(':').map(x => x.trim())
            const num = parseInt(val?.match(/(\d+)/)?.[1] || '0')
            const c = num >= 8 ? 'emerald' : num >= 6 ? 'amber' : 'red'
            return <ScoreCard key={i} label={label} value={val} color={c} />
          })}</div>
        </Section>
      )}
      {s.CHANGES_MADE && (
        <Section title="Changes Made" icon="✏️"><div className="space-y-2">{bulletLines(s.CHANGES_MADE).map((line, i) => (
          <div key={i} className="flex gap-2 p-2.5 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900"><span className="text-blue-400 shrink-0">→</span><span className="text-sm text-ink-600">{line.replace(/^-\s*/, '')}</span></div>
        ))}</div></Section>
      )}
      {s.SUGGESTIONS && <Section title="Remaining Suggestions" icon="💭">{bulletLines(s.SUGGESTIONS).map((line, i) => (
        <div key={i} className="flex gap-2 py-1.5"><span className="text-amber-400 shrink-0">○</span><span className="text-sm text-ink-500">{line.replace(/^-\s*/, '')}</span></div>
      ))}</Section>}
      {s.EDITED_ARTICLE && <Section title="Edited Article" icon="📝"><FallbackRenderer raw={s.EDITED_ARTICLE} /></Section>}
    </div>
  )
}


// ─── SEO Renderer ───
function SEORenderer({ raw }: { raw: string }) {
  const s = parseSections(raw)
  if (s._RAW) return <FallbackRenderer raw={s._RAW} />
  return (
    <div className="space-y-6">
      {s.SEO_SCORE && (
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-accent-50 to-surface-50 dark:from-accent-950/40 dark:to-surface-800 border border-accent-200 dark:border-accent-800">
          <div className="text-4xl font-bold text-accent-600 dark:text-accent-400">{s.SEO_SCORE.replace(/[^0-9/]/g, '').trim() || s.SEO_SCORE}</div>
          <div className="text-xs text-ink-400 mt-1 uppercase font-medium">SEO Score</div>
        </div>
      )}
      {s.META_TAGS && (
        <Section title="Meta Tags" icon="🏷️">
          <div className="space-y-3">{lines(s.META_TAGS).filter(l => l.includes(':')).map((line, i) => {
            const [label, ...rest] = line.split(':')
            const val = rest.join(':').trim()
            return (
              <div key={i} className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                <div className="text-[10px] font-semibold text-ink-400 uppercase mb-1">{label.trim()}</div>
                <div className="text-sm text-ink-700 font-medium">{val}</div>
                {label.trim().toLowerCase() === 'title' && <div className="text-[10px] text-ink-300 mt-1">{val.length} / 60 chars</div>}
                {label.trim().toLowerCase() === 'description' && <div className="text-[10px] text-ink-300 mt-1">{val.length} / 155 chars</div>}
              </div>
            )
          })}</div>
        </Section>
      )}
      {s.CHECKLIST && (
        <Section title="SEO Checklist" icon="✅">
          <div className="space-y-1.5">{lines(s.CHECKLIST).map((line, i) => {
            const statusMatch = line.match(/^(PASS|WARN|FAIL)\s*\|\s*(.+?)\s*\|\s*(.+)$/)
            if (!statusMatch) return <div key={i} className="text-sm text-ink-500 py-1">{line}</div>
            const [, status, item, detail] = statusMatch
            const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌'
            const bg = status === 'PASS' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900' : status === 'WARN' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900' : 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900'
            return (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${bg}`}>
                <span className="text-base shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-700">{item}</div>
                  <div className="text-xs text-ink-400 mt-0.5">{detail}</div>
                </div>
              </div>
            )
          })}</div>
        </Section>
      )}
      {s.KEYWORDS && <Section title="Keyword Analysis" icon="🔑"><pre className="whitespace-pre-wrap text-sm text-ink-600 leading-relaxed bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">{s.KEYWORDS}</pre></Section>}
      {s.FAQ && (
        <Section title="FAQ Schema" icon="❓">
          <div className="space-y-3">{s.FAQ.split(/\nQ:\s*/g).filter(b => b.trim()).map((block, i) => {
            const [q, ...aParts] = block.split(/\nA:\s*/)
            return (
              <div key={i} className="rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
                <div className="px-4 py-2.5 bg-surface-50 dark:bg-surface-800 text-sm font-medium text-ink-700">Q: {q.trim()}</div>
                <div className="px-4 py-2.5 text-sm text-ink-500">{aParts.join('\n').trim()}</div>
              </div>
            )
          })}</div>
        </Section>
      )}
      {s.QUICK_WINS && (
        <Section title="Quick Wins" icon="⚡">
          {lines(s.QUICK_WINS).map((line, i) => (
            <div key={i} className="flex gap-3 items-start py-2">
              <span className="w-6 h-6 rounded-full bg-accent-100 dark:bg-accent-900 text-accent-600 dark:text-accent-400 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-sm text-ink-600">{line.replace(/^\d+[.)]\s*/, '')}</span>
            </div>
          ))}
        </Section>
      )}
      {s.SCHEMA && (
        <Section title="JSON-LD Schema" icon="🔧">
          <pre className="whitespace-pre-wrap text-xs text-ink-500 bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700 font-mono overflow-x-auto">{s.SCHEMA}</pre>
        </Section>
      )}
    </div>
  )
}

// ─── Social Renderer ───
function SocialRenderer({ raw }: { raw: string }) {
  const s = parseSections(raw)
  if (s._RAW) return <FallbackRenderer raw={s._RAW} />
  const platforms: { key: string; name: string; icon: string; color: string; bg: string }[] = [
    { key: 'LINKEDIN', name: 'LinkedIn', icon: '💼', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
    { key: 'TWITTER', name: 'X / Twitter', icon: '𝕏', color: 'text-ink-700', bg: 'bg-surface-50 dark:bg-surface-800 border-surface-300 dark:border-surface-600' },
    { key: 'INSTAGRAM', name: 'Instagram', icon: '📸', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800' },
    { key: 'NEWSLETTER', name: 'Newsletter', icon: '📧', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' },
  ]
  return (
    <div className="space-y-6">
      {platforms.map(p => s[p.key] ? (
        <div key={p.key} className={`rounded-xl border overflow-hidden ${p.bg}`}>
          <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${p.bg}`}>
            <span className="text-lg">{p.icon}</span>
            <span className={`text-sm font-semibold ${p.color}`}>{p.name}</span>
            <button onClick={() => { navigator.clipboard.writeText(s[p.key]) }} className="ml-auto text-[10px] text-ink-400 hover:text-ink-600 px-2 py-1 rounded hover:bg-white/50 dark:hover:bg-black/20 transition">📋 Copy</button>
          </div>
          <div className="p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-600">{s[p.key]}</pre>
          </div>
          <div className="px-4 py-2 border-t border-inherit">
            <span className="text-[10px] text-ink-300">{s[p.key].length} characters</span>
          </div>
        </div>
      ) : null)}
      {s.POSTING_STRATEGY && (
        <Section title="Posting Strategy" icon="📊">
          <pre className="whitespace-pre-wrap text-sm text-ink-600 leading-relaxed bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">{s.POSTING_STRATEGY}</pre>
        </Section>
      )}
    </div>
  )
}

// ─── Agent-specific renderer map ───
const RENDERERS: Record<string, React.FC<{ raw: string }>> = {
  researcher: ResearchRenderer,
  writer: ArticleRenderer,
  editor: EditorRenderer,
  seo_optimizer: SEORenderer,
  social_writer: SocialRenderer,
}

// ─── Main Component ───
export function ContentPackageView({ outputs, nodeAgentMap, onClose }: ContentPackageViewProps) {
  const tabs = TAB_CONFIG.map(tab => {
    const nodeId = Object.keys(nodeAgentMap).find(nid => nodeAgentMap[nid] === tab.agentId)
    const output = nodeId ? outputs[nodeId] : null
    return { ...tab, nodeId, output }
  }).filter(tab => tab.output)

  const marketingIds = new Set(TAB_CONFIG.map(t => t.agentId))
  Object.entries(outputs).filter(([nid]) => !marketingIds.has(nodeAgentMap[nid])).forEach(([nid, out]) => {
    tabs.push({ agentId: nodeAgentMap[nid] || 'unknown', label: nodeAgentMap[nid] || 'Output', icon: '⚙️', nodeId: nid, output: out })
  })

  const [activeTab, setActiveTab] = useState(tabs.length > 1 ? 1 : 0)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  if (tabs.length === 0) return null
  const currentTab = tabs[activeTab] || tabs[0]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopyFeedback('Copied!'); setTimeout(() => setCopyFeedback(null), 2000) }).catch(() => { setCopyFeedback('Copy failed'); setTimeout(() => setCopyFeedback(null), 2000) })
  }

  const Renderer = RENDERERS[currentTab.agentId] || FallbackRenderer

  return (
    <div className="h-full border-t border-surface-300 bg-card flex flex-col">
      {/* Tabs */}
      <div className="flex items-center justify-between px-4 py-0 border-b border-surface-300 bg-surface-50">
        <div className="flex items-center gap-0">
          {tabs.map((tab, i) => (
            <button key={tab.agentId + i} onClick={() => setActiveTab(i)}
              className={`px-4 py-2.5 text-[11px] font-medium border-b-2 transition flex items-center gap-1.5 ${activeTab === i ? 'border-accent-500 text-accent-600 bg-card' : 'border-transparent text-ink-400 hover:text-ink-600 hover:bg-surface-100'}`}>
              <span>{tab.icon}</span>{tab.label}
              {tab.output?.status === 'completed' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {copyFeedback && <span className="text-[10px] text-emerald-600 font-medium">{copyFeedback}</span>}
          <button onClick={() => currentTab.output && copyToClipboard(currentTab.output.output)} className="text-[11px] text-ink-400 hover:text-ink-700 px-2.5 py-1.5 rounded-md hover:bg-surface-100 transition flex items-center gap-1">📋 Copy</button>
          <button onClick={() => { const all = tabs.map(t => `# ${t.icon} ${t.label}\n\n${t.output?.output || ''}`).join('\n\n---\n\n'); copyToClipboard(all) }} className="text-[11px] text-ink-400 hover:text-ink-700 px-2.5 py-1.5 rounded-md hover:bg-surface-100 transition flex items-center gap-1">📦 Copy All</button>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 text-xs px-2 py-1 rounded-md hover:bg-surface-100 transition">✕</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentTab.output ? (
          <div className="max-w-3xl mx-auto">
            {/* Provider + structured data quality badges */}
            {(currentTab.output.provider || currentTab.output.structured) && (
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                {currentTab.output.provider && currentTab.output.provider !== 'simulated' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-100 border border-surface-300 text-ink-400">via {currentTab.output.provider}</span>
                )}
                {currentTab.output.structured && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ structured
                    {currentTab.output.structured.type === 'editor' && currentTab.output.structured.data.scores.overall > 0 && ` · ${currentTab.output.structured.data.scores.overall}/10`}
                    {currentTab.output.structured.type === 'seo_optimizer' && currentTab.output.structured.data.seo_score > 0 && ` · SEO ${currentTab.output.structured.data.seo_score}/100`}
                    {currentTab.output.structured.type === 'researcher' && currentTab.output.structured.data.keywords.primary && ` · kw: ${currentTab.output.structured.data.keywords.primary}`}
                  </span>
                )}
              </div>
            )}
            <Renderer raw={currentTab.output.output} />
          </div>
        ) : (
          <div className="text-center text-ink-300 py-12"><p className="text-3xl mb-2 opacity-40">📭</p><p className="text-sm">No output for this step yet.</p></div>
        )}
      </div>
    </div>
  )
}
function ScoreCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
  }
  return (
    <div className={`p-3 rounded-lg border text-center ${colors[color] || colors.amber}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] font-medium text-ink-400 mt-1 uppercase">{label}</div>
    </div>
  )
}

