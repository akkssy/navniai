'use client'

import { useState } from 'react'

// Ranked hook auditioning — turns the hook_generator step's text into a
// scoreboard. The agent already emits 16 scored hooks + a top-3 with reasoning,
// platform variants, and a debrief; this surfaces them ranked by predicted
// virality. Self-contained (own parser), mirroring StoryboardPreview.

export interface HookVariant {
  id: number
  framework: string
  text: string
  score: number
}
export interface HookPick {
  rank: number
  ref: number
  framework: string
  text: string
  why: string
}
export interface HookAudition {
  hooks: HookVariant[]
  top3: HookPick[]
  platformVariants: { instagram: string; linkedin: string; x: string; tiktok: string }
  debrief: { persona_fit: string; risk_flag: string; ab_test: string }
}

interface Props {
  rawOutput: string
}

function section(text: string, name: string): string {
  const re = new RegExp(`===\\s*${name}\\s*===([\\s\\S]*?)(?====\\s*[A-Z0-9_]+\\s*===|$)`, 'i')
  return text.match(re)?.[1]?.trim() ?? ''
}
function fieldLine(label: string, src: string): string {
  return src.match(new RegExp(`${label}\\s*:\\s*(.+)`, 'i'))?.[1]?.trim() ?? ''
}

export function parseHooks(raw: string): HookAudition | null {
  const hooksRaw = section(raw, 'HOOKS')
  const hooks: HookVariant[] = []
  const re = /HOOK_(\d+)\s*\[([^\]]+)\]\s*:\s*([\s\S]*?)\s*\|\s*SCORE:\s*(\d+(?:\.\d+)?)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(hooksRaw)) !== null) {
    const text = m[3].trim()
    if (!text) continue
    hooks.push({
      id: parseInt(m[1], 10),
      framework: m[2].trim().replace(/_/g, ' '),
      text,
      score: Math.max(0, Math.min(10, Math.round(parseFloat(m[4])))),
    })
  }
  if (hooks.length === 0) return null

  const topRaw = section(raw, 'TOP_3')
  const top3: HookPick[] = []
  const pre = /#\s*(\d+)\s+HOOK_(\d+)\s*\[([^\]]+)\]\s*[—\-–]\s*([\s\S]*?)\s*WHY\s*:\s*([\s\S]*?)(?=#\s*\d+\s+HOOK_|$)/gi
  let p: RegExpExecArray | null
  while ((p = pre.exec(topRaw)) !== null) {
    top3.push({
      rank: parseInt(p[1], 10),
      ref: parseInt(p[2], 10),
      framework: p[3].trim().replace(/_/g, ' '),
      text: p[4].trim(),
      why: p[5].trim(),
    })
  }

  const pv = section(raw, 'PLATFORM_VARIANTS')
  const dbg = section(raw, 'HOOK_DEBRIEF')
  return {
    hooks,
    top3,
    platformVariants: {
      instagram: fieldLine('INSTAGRAM_REEL_HOOK', pv),
      linkedin: fieldLine('LINKEDIN_HOOK', pv),
      x: fieldLine('X_HOOK', pv),
      tiktok: fieldLine('TIKTOK_HOOK', pv),
    },
    debrief: {
      persona_fit: fieldLine('PERSONA_FIT', dbg),
      risk_flag: fieldLine('RISK_FLAG', dbg),
      ab_test: fieldLine('A_B_TEST', dbg),
    },
  }
}

function scoreClasses(score: number): string {
  if (score >= 8) return 'bg-emerald-500'
  if (score >= 6) return 'bg-amber-500'
  return 'bg-slate-400'
}
const MEDALS = ['🥇', '🥈', '🥉']

export default function HookAuditionView({ rawOutput }: Props) {
  const data = parseHooks(rawOutput)
  const [copied, setCopied] = useState<string | null>(null)
  if (!data) return null

  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(c => (c === key ? null : c)), 2000)
    })
  }

  const ranked = [...data.hooks].sort((a, b) => b.score - a.score)
  const scoreOf = (ref: number) => data.hooks.find(h => h.id === ref)?.score
  const top = data.top3.length
    ? data.top3
    : ranked.slice(0, 3).map((h, i) => ({ rank: i + 1, ref: h.id, framework: h.framework, text: h.text, why: '' }))
  const variants = [
    { key: 'ig', label: '📸 Instagram Reel', text: data.platformVariants.instagram },
    { key: 'li', label: '💼 LinkedIn', text: data.platformVariants.linkedin },
    { key: 'x', label: '𝕏 Twitter / X', text: data.platformVariants.x },
    { key: 'tt', label: '🎵 TikTok', text: data.platformVariants.tiktok },
  ].filter(v => v.text)
  const debrief = [
    { label: '🎯 Persona fit', text: data.debrief.persona_fit },
    { label: '⚠️ Risk flag', text: data.debrief.risk_flag },
    { label: '🧪 A/B test', text: data.debrief.ab_test },
  ].filter(d => d.text)

  return (
    <div className="border-b border-surface-300 bg-gradient-to-b from-surface-50/60 to-card/60 dark:from-surface-900/40 dark:to-card/40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-200 dark:border-surface-700">
        <span className="text-[11px] font-semibold text-ink-700 flex items-center gap-1.5">
          🪝 Hook Audition
          <span className="text-[10px] text-ink-400 font-normal">· {data.hooks.length} hooks ranked by predicted virality</span>
        </span>
      </div>

      {/* Top-3 podium — the picks with reasoning */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4">
        {top.slice(0, 3).map((h, i) => {
          const s = scoreOf(h.ref)
          return (
            <div key={h.rank} className={`relative rounded-xl border p-3 ${i === 0 ? 'border-accent-300 dark:border-accent-600 bg-accent-50/60 dark:bg-accent-900/15' : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50'}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-base leading-none">{MEDALS[i] ?? `#${h.rank}`}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-accent-600 bg-accent-100 dark:bg-accent-900/40 px-1.5 py-0.5 rounded">{h.framework}</span>
                {typeof s === 'number' && (
                  <span className={`ml-auto text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${scoreClasses(s)}`}>{s}/10</span>
                )}
              </div>
              <p className="text-[13px] font-semibold text-ink-700 dark:text-ink-200 leading-snug">{h.text}</p>
              {h.why && <p className="text-[10px] text-ink-400 mt-1.5 leading-relaxed italic">{h.why}</p>}
              <button
                onClick={() => copy(`top-${h.rank}`, h.text)}
                className="mt-2 text-[10px] px-2 py-0.5 rounded-md border border-surface-300 text-ink-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition"
              >
                {copied === `top-${h.rank}` ? '✅ Copied' : '📋 Copy'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Full leaderboard */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-ink-400 font-semibold mb-1.5">All {ranked.length} hooks · ranked by SCROLL-STOP score</p>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {ranked.map((h, i) => (
            <div key={h.id} className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 group">
              <span className="text-[10px] text-ink-300 font-mono w-5 text-right shrink-0">{i + 1}</span>
              <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded shrink-0 ${scoreClasses(h.score)}`}>{h.score}</span>
              <span className="text-[8px] uppercase tracking-wider text-ink-400 w-20 shrink-0 truncate hidden sm:block">{h.framework}</span>
              <span className="text-[12px] text-ink-600 dark:text-ink-300 leading-snug flex-1 min-w-0">{h.text}</span>
              <button
                onClick={() => copy(`hook-${h.id}`, h.text)}
                className="text-[10px] px-1.5 py-0.5 rounded border border-surface-300 text-ink-500 opacity-0 group-hover:opacity-100 transition shrink-0"
              >
                {copied === `hook-${h.id}` ? '✅' : '📋'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Platform-adapted openers */}
      {variants.length > 0 && (
        <div className="px-4 pb-3 border-t border-surface-200 dark:border-surface-700 pt-3">
          <p className="text-[10px] text-ink-400 font-semibold mb-1.5">📤 Platform-adapted openers — copy the winner, tuned per feed</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {variants.map(v => (
              <div key={v.key} className="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-semibold text-ink-500">{v.label}</span>
                  <button
                    onClick={() => copy(v.key, v.text)}
                    className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-surface-300 text-ink-500 hover:bg-surface-100 dark:hover:bg-surface-700 transition"
                  >
                    {copied === v.key ? '✅ Copied' : '📋 Copy'}
                  </button>
                </div>
                <p className="text-[12px] text-ink-700 dark:text-ink-200 leading-snug">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debrief */}
      {debrief.length > 0 && (
        <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 space-y-1.5">
          {debrief.map(d => (
            <p key={d.label} className="text-[10px] text-ink-400 leading-relaxed">
              <span className="font-semibold text-ink-500">{d.label}:</span> {d.text}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
