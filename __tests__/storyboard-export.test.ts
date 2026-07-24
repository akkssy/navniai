/**
 * Tests for the Storyboard export helpers used to feed external video tools.
 *
 * These are pure functions exported from StoryboardPreview:
 *   - parseScenes: robustly extracts a scene list from LLM output
 *   - buildScript / buildSRT / buildVisualPrompts / buildProductionKit
 *
 * The focus is on the hardening added to parseScenes (empty arrays, missing
 * closing markers, prose-wrapped JSON, malformed scenes) and on the cumulative
 * timecode math in buildSRT.
 */

import {
  parseScenes,
  buildScript,
  buildSRT,
  buildVisualPrompts,
  buildProductionKit,
  type StoryboardScene,
} from '@/components/StoryboardPreview'

// ── fixtures ────────────────────────────────────────────────────────────────

const scene = (over: Partial<StoryboardScene> = {}): StoryboardScene => ({
  id: 1, label: 'HOOK', timeRange: '0-3s', duration: 3,
  spokenLine: 'Stop scrolling.', onScreenText: 'STOP SCROLLING',
  visualPrompt: 'close-up hands typing', transition: 'cut', ...over,
})

const wrap = (json: string) => `===SCENES===\n${json}\n===END_SCENES===`

// ── parseScenes ─────────────────────────────────────────────────────────────

describe('parseScenes', () => {
  it('parses a well-formed scene block', () => {
    const out = parseScenes(wrap(JSON.stringify([scene(), scene({ id: 2, label: 'CTA' })])))
    expect(out).toHaveLength(2)
    expect(out?.[1].label).toBe('CTA')
  })

  it('returns null when there is no SCENES marker', () => {
    expect(parseScenes('just some prose, no scenes here')).toBeNull()
  })

  it('returns null for an empty array (prevents active-scene crash)', () => {
    expect(parseScenes(wrap('[]'))).toBeNull()
  })

  it('returns null when the JSON is not an array', () => {
    expect(parseScenes(wrap('{"label":"HOOK"}'))).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(parseScenes(wrap('[{ not valid json'))).toBeNull()
  })

  it('tolerates a missing ===END_SCENES=== marker (truncated output)', () => {
    const out = parseScenes(`===SCENES===\n${JSON.stringify([scene()])}`)
    expect(out).toHaveLength(1)
    expect(out?.[0].label).toBe('HOOK')
  })

  it('extracts the array when wrapped in prose or code fences', () => {
    const raw = `===SCENES===\nHere you go:\n\`\`\`json\n${JSON.stringify([scene()])}\n\`\`\`\ndone\n===END_SCENES===`
    expect(parseScenes(raw)).toHaveLength(1)
  })

  it('coerces a missing/non-numeric duration to a 5s default', () => {
    const out = parseScenes(wrap(JSON.stringify([{ label: 'HOOK' }, { label: 'CTA', duration: 'abc' }])))
    expect(out?.[0].duration).toBe(5)
    expect(out?.[1].duration).toBe(5)
  })

  it('filters out non-object entries but keeps valid ones', () => {
    const out = parseScenes(wrap(JSON.stringify([null, 'nope', scene()])))
    expect(out).toHaveLength(1)
    expect(out?.[0].label).toBe('HOOK')
  })

  it('defaults a missing label and transition', () => {
    const out = parseScenes(wrap(JSON.stringify([{ duration: 4 }])))
    expect(out?.[0].label).toBe('SCENE_1')
    expect(out?.[0].transition).toBe('cut')
  })
})

// ── buildSRT ────────────────────────────────────────────────────────────────

describe('buildSRT', () => {
  it('produces cumulative timecodes from scene durations', () => {
    const srt = buildSRT([
      scene({ id: 1, duration: 3, onScreenText: 'ONE' }),
      scene({ id: 2, duration: 12, onScreenText: 'TWO' }),
    ])
    expect(srt).toContain('1\n00:00:00,000 --> 00:00:03,000\nONE')
    expect(srt).toContain('2\n00:00:03,000 --> 00:00:15,000\nTWO')
    expect(srt.endsWith('\n')).toBe(true)
  })

  it('rolls over into minutes and hours correctly', () => {
    const srt = buildSRT([scene({ duration: 3661, onScreenText: 'LONG' })])
    expect(srt).toContain('00:00:00,000 --> 01:01:01,000')
  })
})

// ── buildScript / buildVisualPrompts / buildProductionKit ───────────────────

describe('buildScript', () => {
  it('joins spoken lines with blank lines', () => {
    const s = buildScript([scene({ spokenLine: 'A' }), scene({ spokenLine: 'B' })])
    expect(s).toBe('A\n\nB')
  })
})

describe('buildVisualPrompts', () => {
  it('numbers prompts and humanizes underscored labels', () => {
    const out = buildVisualPrompts([scene({ label: 'VALUE_1', timeRange: '15-25s', visualPrompt: 'b-roll' })])
    expect(out).toBe('1. [15-25s] VALUE 1 — b-roll')
  })
})

describe('buildProductionKit', () => {
  it('summarizes total runtime and scene count in the header', () => {
    const kit = buildProductionKit([scene({ duration: 3 }), scene({ duration: 12 })])
    expect(kit).toContain('Total runtime: 15s · 2 scenes')
    expect(kit).toContain('🎙 Voiceover:')
  })
})
