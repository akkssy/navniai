import { NextRequest, NextResponse } from 'next/server'
import { callProvider, type LLMProviderKey, type LLMUserConfig, PROVIDER_REGISTRY } from '@/lib/llmProviders'

export async function POST(request: NextRequest) {
  try {
    const { provider, config } = await request.json() as { provider: LLMProviderKey; config: LLMUserConfig }
    if (!PROVIDER_REGISTRY[provider]) {
      return NextResponse.json({ ok: false, error: 'Unknown provider' })
    }
    const text = await callProvider(provider, 'You are a test assistant.', 'Reply with exactly: OK', config, 10000)
    return NextResponse.json({ ok: true, model: config.model || PROVIDER_REGISTRY[provider].defaultModel, response: text.slice(0, 100) })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg })
  }
}
