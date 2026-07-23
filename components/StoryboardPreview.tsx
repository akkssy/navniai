'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface StoryboardScene {
  id: number
  label: string
  timeRange: string
  duration: number
  spokenLine: string
  onScreenText: string
  visualPrompt: string
  transition: string
}

interface Props {
  rawOutput: string
}

const GRADIENTS: Record<string, string> = {
  HOOK:      'from-red-600 via-rose-500 to-orange-500',
  LOOP:      'from-purple-700 via-violet-600 to-indigo-600',
  VALUE_1:   'from-blue-700 via-blue-600 to-cyan-600',
  VALUE_2:   'from-sky-600 via-cyan-500 to-blue-500',
  VALUE_3:   'from-teal-600 via-cyan-500 to-sky-600',
  INTERRUPT: 'from-amber-500 via-orange-500 to-yellow-500',
  CTA:       'from-emerald-600 via-teal-500 to-green-500',
}
const SCENE_EMOJI: Record<string, string> = {
  HOOK: '🪝', LOOP: '🔄', VALUE_1: '💡', VALUE_2: '💡', VALUE_3: '💡',
  INTERRUPT: '⚡', CTA: '📣',
}
function gradient(label: string) {
  return GRADIENTS[label] ?? 'from-slate-700 via-slate-600 to-slate-700'
}

export function parseScenes(raw: string): StoryboardScene[] | null {
  const m = raw.match(/===SCENES===\s*([\s\S]*?)\s*===END_SCENES===/)
  if (!m) return null
  try {
    const parsed = JSON.parse(m[1])
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export default function StoryboardPreview({ rawOutput }: Props) {
  const scenes = parseScenes(rawOutput)
  const [activeIdx, setActiveIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = () => {
    if (timerRef.current)   clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => () => {
    clearTimers()
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
  }, [])

  const playScene = useCallback((idx: number, list: StoryboardScene[]) => {
    if (idx >= list.length) { setIsPlaying(false); setProgress(0); return }
    const scene = list[idx]
    setActiveIdx(idx)
    setProgress(0)
    clearTimers()

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(scene.spokenLine)
      utt.rate = 1.1
      window.speechSynthesis.speak(utt)
    }

    const ms = scene.duration * 1000
    let elapsed = 0
    intervalRef.current = setInterval(() => {
      elapsed += 80
      setProgress(Math.min((elapsed / ms) * 100, 100))
    }, 80)
    timerRef.current = setTimeout(() => {
      clearTimers()
      playScene(idx + 1, list)
    }, ms)
  }, [])

  const stopPlayback = useCallback(() => {
    clearTimers()
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    setIsPlaying(false)
    setProgress(0)
  }, [])

  const handlePlay = () => {
    if (!scenes) return
    if (isPlaying) { stopPlayback(); return }
    setIsPlaying(true)
    playScene(activeIdx, scenes)
  }

  const handleSceneClick = (idx: number) => {
    stopPlayback()
    setActiveIdx(idx)
  }

  if (!scenes) return null
  const active = scenes[activeIdx]
  const totalDuration = scenes.reduce((s, sc) => s + sc.duration, 0)

  return (
    <div className="border-b border-surface-300 bg-gradient-to-b from-surface-50/60 to-card/60 dark:from-surface-900/40 dark:to-card/40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-200 dark:border-surface-700">
        <span className="text-[11px] font-semibold text-ink-700 flex items-center gap-1.5">
          🎞️ Reel Storyboard Preview
          <span className="text-[10px] text-ink-400 font-normal">· {totalDuration}s · {scenes.length} scenes</span>
        </span>
        <button
          onClick={handlePlay}
          className={`text-[11px] px-3 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
            isPlaying
              ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-200'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
          }`}
        >
          {isPlaying ? '⏹ Stop' : '▶ Preview Reel'}
        </button>
      </div>

      <div className="flex gap-4 p-4">
        {/* Phone-shaped active scene card */}
        <div className="shrink-0">
          <div
            className={`relative w-32 sm:w-36 bg-gradient-to-b ${gradient(active.label)} rounded-2xl overflow-hidden shadow-lg`}
            style={{ aspectRatio: '9/16' }}
          >
            {/* Time badge */}
            <div className="absolute top-2 left-2 text-[8px] bg-black/40 text-white px-1.5 py-0.5 rounded-full font-mono">
              {active.timeRange}
            </div>
            {/* Transition badge */}
            <div className="absolute top-2 right-2 text-[7px] bg-white/20 text-white px-1 py-0.5 rounded font-mono uppercase tracking-wider">
              {active.transition}
            </div>
            {/* On-screen caption */}
            <div className="absolute inset-x-2 bottom-14 text-center">
              <p className="text-white font-black text-[9px] sm:text-[10px] leading-tight drop-shadow-lg uppercase tracking-wide">
                {active.onScreenText}
              </p>
            </div>
            {/* Scene label */}
            <div className="absolute bottom-3 inset-x-0 text-center">
              <span className="text-[8px] text-white/70 font-medium">
                {SCENE_EMOJI[active.label] ?? '🎬'} {active.label.replace(/_/g, ' ')}
              </span>
            </div>
            {/* Progress bar */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-black/30">
              <div
                className="h-full bg-white/80 transition-none"
                style={{ width: `${isPlaying ? progress : 0}%` }}
              />
            </div>
          </div>
          {/* Director note */}
          <p className="mt-2 w-32 sm:w-36 text-[9px] text-ink-400 italic leading-snug">
            📷 {active.visualPrompt}
          </p>
        </div>

        {/* Right side: voiceover + scene strip */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Voiceover text */}
          <div className="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
            <p className="text-[10px] text-ink-400 font-semibold mb-1">🎙 Voiceover</p>
            <p className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed">{active.spokenLine}</p>
          </div>

          {/* Scene thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {scenes.map((sc, i) => (
              <button
                key={sc.id}
                onClick={() => handleSceneClick(i)}
                title={sc.label.replace(/_/g, ' ')}
                className="shrink-0 flex flex-col items-center gap-1"
              >
                <div
                  className={`w-9 rounded-lg bg-gradient-to-b ${gradient(sc.label)} flex items-center justify-center border-2 transition-all ${
                    i === activeIdx
                      ? 'border-white shadow-md scale-110'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                  style={{ aspectRatio: '9/16' }}
                >
                  <span className="text-sm">{SCENE_EMOJI[sc.label] ?? '🎬'}</span>
                </div>
                <span className="text-[7px] text-ink-400 w-9 text-center leading-none truncate">
                  {sc.timeRange}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
