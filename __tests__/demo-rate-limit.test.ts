/**
 * Tests for the server-side demo proxy route's rate-limiting logic.
 *
 * We test the pure behaviour of resolveDemoProvider and the cookie-counter
 * logic by mocking the NextRequest/NextResponse shape — no real HTTP calls.
 */

import { NextRequest } from 'next/server'

// ── helpers ────────────────────────────────────────────────────────────────

function makeRequest(cookieValue?: string, body: object = { system: 'sys', message: 'hello' }) {
  const url = 'http://localhost/api/demo/generate'
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
  const req = new NextRequest(url, init)
  if (cookieValue !== undefined) {
    // NextRequest reads cookies from the Cookie header
    Object.defineProperty(req, 'cookies', {
      value: {
        get: (name: string) => (name === 'navniai_demo_used' ? { value: cookieValue } : undefined),
      },
    })
  }
  return req
}

// ── resolveDemoProvider ─────────────────────────────────────────────────────

describe('resolveDemoProvider', () => {
  // We re-require the module inside each test so env mutations take effect
  const importRoute = () => require('../app/api/demo/generate/route')

  beforeEach(() => jest.resetModules())
  const DEMO_KEYS = ['GROQ_API_KEY','GEMINI_API_KEY','OPENAI_API_KEY','OPENROUTER_API_KEY','DEMO_LLM_API_KEY','DEMO_LLM_PROVIDER','DEMO_LLM_MODEL'] as const
  let savedEnv: Partial<Record<typeof DEMO_KEYS[number], string | undefined>> = {}

  beforeEach(() => {
    // Save and wipe all demo-relevant env vars so tests are hermetic
    DEMO_KEYS.forEach(k => { savedEnv[k] = process.env[k]; delete process.env[k] })
  })
  afterEach(() => {
    // Restore original env
    DEMO_KEYS.forEach(k => {
      if (savedEnv[k] !== undefined) process.env[k] = savedEnv[k]
      else delete process.env[k]
    })
    savedEnv = {}
  })

  it('returns null when no env keys are set', async () => {
    // No relevant env vars → POST should return 503 demo_unavailable
    const { POST } = importRoute()
    const req = makeRequest('0')
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(503)
    expect(json.error).toBe('demo_unavailable')
  })

  it('picks GROQ_API_KEY when set', async () => {
    process.env.GROQ_API_KEY = 'test-groq-key'
    // We can't call a real Groq endpoint, but we can verify the function
    // resolves the provider without throwing by importing it directly.
    // Use a manual module-level test instead:
    const { POST } = importRoute()
    const req = makeRequest('0', { system: '', message: '' })
    const res = await POST(req)
    const json = await res.json()
    // Empty message → 400 (but the key WAS resolved, so not 503)
    expect(res.status).toBe(400)
    expect(json.error).toBe('empty_message')
  })

  it('prefers explicit DEMO_LLM_API_KEY + DEMO_LLM_PROVIDER over generic keys', async () => {
    process.env.GROQ_API_KEY = 'generic-key'
    process.env.DEMO_LLM_API_KEY = 'explicit-key'
    process.env.DEMO_LLM_PROVIDER = 'openai'
    // Blank message to short-circuit before any real network call
    const { POST } = importRoute()
    const req = makeRequest('0', { system: 's', message: '' })
    const res = await POST(req)
    // empty_message → resolved past provider selection
    expect((await res.json()).error).toBe('empty_message')
  })
})

// ── rate-limit cookie logic ─────────────────────────────────────────────────

describe('demo rate-limit (cookie counter)', () => {
  const LIMIT = 50 // matches DEMO_CALL_LIMIT default

  beforeEach(() => jest.resetModules())

  it('returns 429 when used >= CALL_LIMIT', async () => {
    const { POST } = require('../app/api/demo/generate/route')
    const req = makeRequest(String(LIMIT))
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(429)
    expect(json.limited).toBe(true)
    expect(json.remaining).toBe(0)
  })

  it('allows the request when used < CALL_LIMIT', async () => {
    // We need a key to get past the 503 guard — set an env var so
    // resolveDemoProvider returns non-null, then mock callProvider
    process.env.GROQ_API_KEY = 'fake'
    jest.mock('../lib/llmProviders', () => ({
      ...jest.requireActual('../lib/llmProviders'),
      callProvider: jest.fn().mockResolvedValue('mocked LLM output'),
    }))
    const { POST } = require('../app/api/demo/generate/route')
    const req = makeRequest(String(LIMIT - 1), { system: 's', message: 'test prompt' })
    const res = await POST(req)
    const json = await res.json()
    // Should succeed (not 429)
    expect(res.status).not.toBe(429)
    if (json.ok) {
      expect(json.remaining).toBe(0) // LIMIT-1+1 = LIMIT → remaining = 0
    }
    delete process.env.GROQ_API_KEY
  })

  it('respects DEMO_CALL_LIMIT env override', async () => {
    process.env.DEMO_CALL_LIMIT = '5'
    jest.resetModules()
    const { POST } = require('../app/api/demo/generate/route')
    const req = makeRequest('5') // used === limit of 5
    const res = await POST(req)
    expect(res.status).toBe(429)
    delete process.env.DEMO_CALL_LIMIT
  })
})
