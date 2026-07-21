import { NextRequest, NextResponse } from 'next/server'
import { callProvider, PROVIDER_REGISTRY, type LLMProviderKey, type LLMUserConfig } from '@/lib/llmProviders'

// Server-side demo proxy — lets brand-new users get REAL pipeline output with
// zero setup, using a key held only on the server. Rate-limited via a cookie so
// the free demo can't be abused. Once exhausted, the client falls back to the
// simulated response and prompts the user to connect their own provider.

const COUNT_COOKIE = 'navniai_demo_used'
const CALL_LIMIT = parseInt(process.env.DEMO_CALL_LIMIT || '50', 10)

/** Pick the demo provider + key from server env. Returns null when unconfigured. */
function resolveDemoProvider(): { provider: LLMProviderKey; cfg: LLMUserConfig } | null {
  const explicit = process.env.DEMO_LLM_API_KEY
  const explicitProvider = process.env.DEMO_LLM_PROVIDER as LLMProviderKey | undefined
  const candidates: Array<[LLMProviderKey, string | undefined]> = [
    ['groq', process.env.GROQ_API_KEY],
    ['gemini', process.env.GEMINI_API_KEY],
    ['openai', process.env.OPENAI_API_KEY],
    ['openrouter', process.env.OPENROUTER_API_KEY],
  ]
  if (explicit && explicitProvider) {
    return {
      provider: explicitProvider,
      cfg: { provider: explicitProvider, apiKey: explicit, model: process.env.DEMO_LLM_MODEL || PROVIDER_REGISTRY[explicitProvider]?.defaultModel },
    }
  }
  for (const [provider, key] of candidates) {
    if (key) return { provider, cfg: { provider, apiKey: key, model: process.env.DEMO_LLM_MODEL || PROVIDER_REGISTRY[provider].defaultModel } }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const used = parseInt(req.cookies.get(COUNT_COOKIE)?.value || '0', 10) || 0
    if (used >= CALL_LIMIT) {
      return NextResponse.json({ ok: false, limited: true, remaining: 0 }, { status: 429 })
    }

    const demo = resolveDemoProvider()
    if (!demo) {
      return NextResponse.json({ ok: false, error: 'demo_unavailable' }, { status: 503 })
    }

    const body = await req.json().catch(() => ({}))
    const system = typeof body.system === 'string' ? body.system : 'You are a helpful assistant.'
    const message = typeof body.message === 'string' ? body.message : ''
    if (!message.trim()) {
      return NextResponse.json({ ok: false, error: 'empty_message' }, { status: 400 })
    }

    const cfg: LLMUserConfig = {
      ...demo.cfg,
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
      maxTokens: typeof body.maxTokens === 'number' ? Math.min(body.maxTokens, 2000) : 2000,
    }

    const text = await callProvider(demo.provider, system, message, cfg, 60000)
    const remaining = Math.max(0, CALL_LIMIT - (used + 1))

    const res = NextResponse.json({ ok: true, text, provider: 'demo', remaining })
    res.cookies.set(COUNT_COOKIE, String(used + 1), {
      httpOnly: false, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'demo_failed' },
      { status: 500 }
    )
  }
}
