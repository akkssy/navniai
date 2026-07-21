// NavniAI - Multi-Provider LLM Integration Module
// Shared by both server-side API route and client-side executor

export type LLMProviderKey = 'ollama' | 'openai' | 'gemini' | 'anthropic' | 'groq' | 'openrouter'

export interface LLMProviderConfig {
  id: LLMProviderKey; name: string; icon: string; color: string
  defaultModel: string; models: string[]; requiresApiKey: boolean
  supportsClientSide: boolean; defaultBaseUrl?: string
}

export interface LLMUserConfig {
  provider: LLMProviderKey; apiKey?: string; model?: string
  baseUrl?: string; temperature?: number; maxTokens?: number
}

export interface LLMSettings {
  activeProvider: LLMProviderKey
  fallbackChain: LLMProviderKey[]
  providers: Record<LLMProviderKey, LLMUserConfig>
  brandVoice?: string  // User's brand voice / persona injected into every agent system prompt
}

export interface LLMCallResult {
  text: string; provider: LLMProviderKey | 'simulated' | 'demo'; model?: string
}

export const PROVIDER_REGISTRY: Record<LLMProviderKey, LLMProviderConfig> = {
  ollama: {
    id: 'ollama', name: 'Ollama (Local)', icon: '\uD83E\uDD99', color: '#a855f7',
    defaultModel: 'qwen3:8b', requiresApiKey: false, supportsClientSide: true,
    models: ['qwen3:8b', 'deepseek-coder:6.7b', 'deepseek-coder:1.3b', 'llama3.2', 'llama3.1', 'llama3', 'mistral', 'codellama', 'phi3', 'gemma2', 'qwen2.5'],
    defaultBaseUrl: 'http://localhost:11434',
  },
  openai: {
    id: 'openai', name: 'OpenAI', icon: '\uD83D\uDFE2', color: '#10a37f',
    defaultModel: 'gpt-4o-mini', requiresApiKey: true, supportsClientSide: false,
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-mini', 'o1-preview'],
  },
  gemini: {
    id: 'gemini', name: 'Google Gemini', icon: '\uD83D\uDC8E', color: '#4285f4',
    defaultModel: 'gemini-2.0-flash', requiresApiKey: true, supportsClientSide: false,
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
  },
  anthropic: {
    id: 'anthropic', name: 'Anthropic Claude', icon: '\uD83D\uDD36', color: '#d97757',
    defaultModel: 'claude-sonnet-4-20250514', requiresApiKey: true, supportsClientSide: false,
    models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
  },
  groq: {
    id: 'groq', name: 'Groq', icon: '\u26A1', color: '#f55036',
    defaultModel: 'llama-3.3-70b-versatile', requiresApiKey: true, supportsClientSide: false,
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
  },
  openrouter: {
    id: 'openrouter', name: 'OpenRouter', icon: '\uD83D\uDD00', color: '#6366f1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct', requiresApiKey: true, supportsClientSide: false,
    models: ['meta-llama/llama-3.3-70b-instruct', 'google/gemini-2.0-flash-exp:free', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o-mini'],
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
  },
}

export const ALL_PROVIDER_KEYS: LLMProviderKey[] = ['ollama', 'openai', 'gemini', 'anthropic', 'groq', 'openrouter']

export const DEFAULT_SETTINGS: LLMSettings = {
  activeProvider: 'ollama',
  fallbackChain: ['ollama', 'groq', 'openai', 'openrouter'],
  providers: Object.fromEntries(
    ALL_PROVIDER_KEYS.map(k => [k, {
      provider: k, model: PROVIDER_REGISTRY[k].defaultModel,
      baseUrl: PROVIDER_REGISTRY[k].defaultBaseUrl, temperature: 0.7, maxTokens: 2000,
    }])
  ) as Record<LLMProviderKey, LLMUserConfig>,
}

const SETTINGS_KEY = 'navniai_llm_settings'

export function loadSettings(): LLMSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const saved = JSON.parse(raw)
    const merged = { ...DEFAULT_SETTINGS, ...saved }
    for (const k of ALL_PROVIDER_KEYS) {
      merged.providers[k] = { ...DEFAULT_SETTINGS.providers[k], ...saved.providers?.[k] }
    }
    return merged
  } catch { return DEFAULT_SETTINGS }
}

export function saveSettings(settings: LLMSettings): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* quota */ }
}

export function getProviderBadge(key: string): { label: string; bgClass: string; textClass: string } {
  switch (key) {
    case 'ollama': return { label: 'Ollama', bgClass: 'bg-purple-600/20', textClass: 'text-purple-400' }
    case 'openai': return { label: 'OpenAI', bgClass: 'bg-emerald-600/20', textClass: 'text-emerald-400' }
    case 'gemini': return { label: 'Gemini', bgClass: 'bg-blue-600/20', textClass: 'text-blue-400' }
    case 'anthropic': return { label: 'Claude', bgClass: 'bg-orange-600/20', textClass: 'text-orange-400' }
    case 'groq': return { label: 'Groq', bgClass: 'bg-red-600/20', textClass: 'text-red-400' }
    case 'openrouter': return { label: 'OpenRouter', bgClass: 'bg-indigo-600/20', textClass: 'text-indigo-400' }
    case 'demo': return { label: 'Free Demo', bgClass: 'bg-accent-600/20', textClass: 'text-accent-400' }
    case 'simulated': return { label: 'Simulated', bgClass: 'bg-gray-600/20', textClass: 'text-gray-400' }
    default: return { label: key, bgClass: 'bg-gray-600/20', textClass: 'text-gray-400' }
  }
}

// --- Abort & Retry Helpers ---

/** Combine a timeout with an optional external abort signal */
function makeSignal(timeoutMs: number, external?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs)
  if (!external) return timeout
  // AbortSignal.any is available in Node 20+ and modern browsers
  if ('any' in AbortSignal) return (AbortSignal as any).any([timeout, external])
  // Fallback: create a linked controller
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  timeout.addEventListener('abort', onAbort, { once: true })
  external.addEventListener('abort', onAbort, { once: true })
  return controller.signal
}

/** Retry a function with exponential backoff. Does NOT retry abort errors. */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelayMs = 1000,
  signal?: AbortSignal,
): Promise<T> {
  let lastError: Error | undefined
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      // Never retry user-initiated aborts
      if (lastError.name === 'AbortError') throw lastError
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt)
        await new Promise((r) => setTimeout(r, delay))
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      }
    }
  }
  throw lastError!
}

// --- API Call Functions ---

// Build the shared /api/generate request body. For qwen3 models we disable the
// internal reasoning pass via the `think: false` option — appending "/no_think"
// to the prompt is ignored by the generate endpoint and leaves reasoning on,
// which makes calls ~30x slower and pollutes the output.
function buildOllamaBody(model: string, msg: string, sys: string, cfg: LLMUserConfig) {
  const body: Record<string, unknown> = {
    model, prompt: msg, system: sys,
    options: { temperature: cfg.temperature ?? 0.7, num_predict: cfg.maxTokens ?? 2000 },
  }
  if (model.startsWith('qwen3')) body.think = false
  return body
}

async function callOllamaProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number, signal?: AbortSignal): Promise<string> {
  const base = cfg.baseUrl || 'http://localhost:11434'
  const model = cfg.model || 'qwen3:8b'
  const res = await fetch(`${base}/api/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...buildOllamaBody(model, msg, sys, cfg), stream: false }),
    signal: makeSignal(ms, signal),
  })
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`)
  return (await res.json()).response || ''
}

async function callOpenAIProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number, signal?: AbortSignal): Promise<string> {
  const apiKey = cfg.apiKey || process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key not configured')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: cfg.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: msg }],
      temperature: cfg.temperature ?? 0.7, max_tokens: cfg.maxTokens ?? 2000,
    }),
    signal: makeSignal(ms, signal),
  })
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
  return (await res.json()).choices?.[0]?.message?.content || ''
}

async function callGeminiProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number, signal?: AbortSignal): Promise<string> {
  const apiKey = cfg.apiKey || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')
  const model = cfg.model || 'gemini-2.0-flash'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sys }] },
        contents: [{ parts: [{ text: msg }] }],
        generationConfig: { temperature: cfg.temperature ?? 0.7, maxOutputTokens: cfg.maxTokens ?? 2000 },
      }),
      signal: makeSignal(ms, signal),
    })
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function callAnthropicProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number, signal?: AbortSignal): Promise<string> {
  const apiKey = cfg.apiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Anthropic API key not configured')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: cfg.model || 'claude-sonnet-4-20250514', system: sys,
      max_tokens: cfg.maxTokens ?? 2000, messages: [{ role: 'user', content: msg }],
    }),
    signal: makeSignal(ms, signal),
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)
  return (await res.json()).content?.[0]?.text || ''
}

async function callGroqProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number, signal?: AbortSignal): Promise<string> {
  const apiKey = cfg.apiKey || process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('Groq API key not configured')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: cfg.model || 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: msg }],
      temperature: cfg.temperature ?? 0.7, max_tokens: cfg.maxTokens ?? 2000,
    }),
    signal: makeSignal(ms, signal),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status}`)
  return (await res.json()).choices?.[0]?.message?.content || ''
}

async function callOpenRouterProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number, signal?: AbortSignal): Promise<string> {
  const apiKey = cfg.apiKey || process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OpenRouter API key not configured')
  const base = cfg.baseUrl || 'https://openrouter.ai/api/v1'
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: cfg.model || 'meta-llama/llama-3.3-70b-instruct',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: msg }],
      temperature: cfg.temperature ?? 0.7, max_tokens: cfg.maxTokens ?? 2000,
    }),
    signal: makeSignal(ms, signal),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  return (await res.json()).choices?.[0]?.message?.content || ''
}

// --- Dispatch & Fallback ---

export async function callProvider(
  provider: LLMProviderKey, sys: string, msg: string, cfg: LLMUserConfig, timeoutMs = 30000, signal?: AbortSignal,
): Promise<string> {
  const fns: Record<LLMProviderKey, typeof callOllamaProvider> = {
    ollama: callOllamaProvider, openai: callOpenAIProvider, gemini: callGeminiProvider,
    anthropic: callAnthropicProvider, groq: callGroqProvider, openrouter: callOpenRouterProvider,
  }
  const fn = fns[provider]
  if (!fn) throw new Error(`Unknown provider: ${provider}`)
  return fn(sys, msg, cfg, timeoutMs, signal)
}

export interface LLMCallOptions {
  settings?: LLMSettings
  timeoutMs?: number
  signal?: AbortSignal
  /** Max retries per provider before falling to the next in the chain (default: 1) */
  maxRetries?: number
}

/** Check if an env-var API key exists for a provider (server-side only) */
function getEnvApiKey(provider: LLMProviderKey): string | undefined {
  const envMap: Record<LLMProviderKey, string | undefined> = {
    ollama:      undefined, // no key needed
    openai:      process.env.OPENAI_API_KEY,
    gemini:      process.env.GEMINI_API_KEY,
    anthropic:   process.env.ANTHROPIC_API_KEY,
    groq:        process.env.GROQ_API_KEY,
    openrouter:  process.env.OPENROUTER_API_KEY,
  }
  return envMap[provider] || undefined
}

// --- Free Demo Fallback (server-proxied key, zero-setup first run) ---

const DEMO_REMAINING_KEY = 'navniai_demo_remaining'

/** Remaining free demo LLM calls, mirrored from the server. null = unknown/not started. */
export function getDemoRunsRemaining(): number | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(DEMO_REMAINING_KEY)
  return raw === null ? null : parseInt(raw, 10)
}

/**
 * Call the server-side demo proxy. Only runs in the browser (relative URL).
 * Returns the generated text, or null when the demo is unavailable/exhausted.
 */
async function callDemoProxy(sys: string, msg: string, cfg: LLMUserConfig, signal?: AbortSignal): Promise<string | null> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return null
  try {
    const res = await fetch('/api/demo/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: sys, message: msg, temperature: cfg.temperature, maxTokens: cfg.maxTokens }),
      signal,
    })
    if (res.status === 429) {
      try { localStorage.setItem(DEMO_REMAINING_KEY, '0') } catch { /* quota */ }
      return null
    }
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.ok || typeof data.text !== 'string') return null
    if (typeof data.remaining === 'number') {
      try { localStorage.setItem(DEMO_REMAINING_KEY, String(data.remaining)) } catch { /* quota */ }
    }
    return data.text
  } catch { return null }
}

export async function callLLMWithFallback(
  systemPrompt: string, userMessage: string,
  settingsOrOptions?: LLMSettings | LLMCallOptions, timeoutMs = 30000,
): Promise<LLMCallResult> {
  // Support both old signature (settings, timeout) and new options object
  let s: LLMSettings
  let timeout: number
  let signal: AbortSignal | undefined
  let maxRetries: number
  if (settingsOrOptions && 'activeProvider' in settingsOrOptions) {
    // Old signature: callLLMWithFallback(sys, msg, settings, timeout)
    s = settingsOrOptions as LLMSettings
    timeout = timeoutMs
    signal = undefined
    maxRetries = 1
  } else if (settingsOrOptions) {
    const opts = settingsOrOptions as LLMCallOptions
    s = opts.settings || loadSettings()
    timeout = opts.timeoutMs ?? timeoutMs
    signal = opts.signal
    maxRetries = opts.maxRetries ?? 1
  } else {
    s = loadSettings()
    timeout = timeoutMs
    signal = undefined
    maxRetries = 1
  }

  // Always try activeProvider first, then the rest of the fallback chain (deduped)
  const baseChain = s.fallbackChain.length > 0 ? s.fallbackChain : [s.activeProvider]
  const chain = [s.activeProvider, ...baseChain.filter(p => p !== s.activeProvider)]

  const errors: string[] = []
  for (const key of chain) {
    // Check abort before trying each provider
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const cfg = s.providers[key] || { provider: key }
    // Skip providers that require an API key but don't have one configured
    if (PROVIDER_REGISTRY[key]?.requiresApiKey && !cfg.apiKey && !getEnvApiKey(key)) {
      errors.push(`${key}: no API key configured`)
      continue
    }
    try {
      const text = await withRetry(
        () => callProvider(key, systemPrompt, userMessage, cfg, timeout, signal),
        maxRetries, 1000, signal,
      )
      return { text, provider: key, model: cfg.model || PROVIDER_REGISTRY[key]?.defaultModel }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${key}: ${msg}`)
    }
  }
  // Free demo fallback: server-proxied key so a brand-new user's first run works
  const demoCfg = s.providers[s.activeProvider] || { provider: s.activeProvider }
  const demoText = await callDemoProxy(systemPrompt, userMessage, demoCfg, signal)
  if (demoText) return { text: demoText, provider: 'demo', model: 'demo' }

  // Final fallback: simulated response
  console.error('[NavniAI] All LLM providers failed (non-streaming):', errors)
  return {
    text: `[Simulated] All providers failed (${errors.join('; ')}). Input: ${userMessage.slice(0, 200)}`,
    provider: 'simulated',
  }
}

// ═══════════════════════════════════════════════════════════════
// STREAMING SUPPORT — SSE / NDJSON token-by-token streaming
// ═══════════════════════════════════════════════════════════════

export type OnChunkCallback = (chunk: string) => void

/** Read lines from a ReadableStream, handling partial lines across chunks */
async function readStreamLines(body: ReadableStream<Uint8Array>, processLine: (line: string) => void): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.trim()) processLine(line.trim())
    }
  }
  if (buffer.trim()) processLine(buffer.trim())
}

// --- Streaming Provider Implementations ---

async function streamOllamaProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number, onChunk: OnChunkCallback, signal?: AbortSignal): Promise<string> {
  const base = cfg.baseUrl || 'http://localhost:11434'
  const model = cfg.model || 'qwen3:8b'
  const res = await fetch(`${base}/api/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...buildOllamaBody(model, msg, sys, cfg), stream: true }),
    signal: makeSignal(ms, signal),
  })
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`)
  if (!res.body) throw new Error('No response body')
  let full = ''
  await readStreamLines(res.body, (line) => {
    try {
      const json = JSON.parse(line)
      if (json.response) { full += json.response; onChunk(json.response) }
    } catch {}
  })
  return full
}

/** Shared streamer for OpenAI-compatible APIs (OpenAI, Groq, OpenRouter) */
async function streamOpenAICompatible(
  url: string, apiKey: string, model: string, sys: string, msg: string,
  cfg: LLMUserConfig, ms: number, onChunk: OnChunkCallback, signal?: AbortSignal, extraHeaders?: Record<string, string>,
): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, ...extraHeaders },
    body: JSON.stringify({
      model, stream: true,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: msg }],
      temperature: cfg.temperature ?? 0.7, max_tokens: cfg.maxTokens ?? 2000,
    }),
    signal: makeSignal(ms, signal),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  if (!res.body) throw new Error('No response body')
  let full = ''
  await readStreamLines(res.body, (line) => {
    if (!line.startsWith('data: ')) return
    const data = line.slice(6)
    if (data === '[DONE]') return
    try {
      const json = JSON.parse(data)
      const token = json.choices?.[0]?.delta?.content
      if (token) { full += token; onChunk(token) }
    } catch {}
  })
  return full
}

async function streamOpenAIProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number, onChunk: OnChunkCallback, signal?: AbortSignal): Promise<string> {
  const apiKey = cfg.apiKey || process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key not configured')
  return streamOpenAICompatible('https://api.openai.com/v1/chat/completions', apiKey, cfg.model || 'gpt-4o-mini', sys, msg, cfg, ms, onChunk, signal)
}

async function streamGroqProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number, onChunk: OnChunkCallback, signal?: AbortSignal): Promise<string> {
  const apiKey = cfg.apiKey || process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('Groq API key not configured')
  return streamOpenAICompatible('https://api.groq.com/openai/v1/chat/completions', apiKey, cfg.model || 'llama-3.3-70b-versatile', sys, msg, cfg, ms, onChunk, signal)
}

async function streamOpenRouterProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number, onChunk: OnChunkCallback, signal?: AbortSignal): Promise<string> {
  const apiKey = cfg.apiKey || process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OpenRouter API key not configured')
  const base = cfg.baseUrl || 'https://openrouter.ai/api/v1'
  return streamOpenAICompatible(`${base}/chat/completions`, apiKey, cfg.model || 'meta-llama/llama-3.3-70b-instruct', sys, msg, cfg, ms, onChunk, signal)
}

async function streamGeminiProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number, onChunk: OnChunkCallback, signal?: AbortSignal): Promise<string> {
  const apiKey = cfg.apiKey || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')
  const model = cfg.model || 'gemini-2.0-flash'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sys }] },
        contents: [{ parts: [{ text: msg }] }],
        generationConfig: { temperature: cfg.temperature ?? 0.7, maxOutputTokens: cfg.maxTokens ?? 2000 },
      }),
      signal: makeSignal(ms, signal),
    })
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  if (!res.body) throw new Error('No response body')
  let full = ''
  await readStreamLines(res.body, (line) => {
    if (!line.startsWith('data: ')) return
    try {
      const json = JSON.parse(line.slice(6))
      const token = json.candidates?.[0]?.content?.parts?.[0]?.text
      if (token) { full += token; onChunk(token) }
    } catch {}
  })
  return full
}

async function streamAnthropicProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number, onChunk: OnChunkCallback, signal?: AbortSignal): Promise<string> {
  const apiKey = cfg.apiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Anthropic API key not configured')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: cfg.model || 'claude-sonnet-4-20250514', system: sys, stream: true,
      max_tokens: cfg.maxTokens ?? 2000, messages: [{ role: 'user', content: msg }],
    }),
    signal: makeSignal(ms, signal),
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)
  if (!res.body) throw new Error('No response body')
  let full = ''
  await readStreamLines(res.body, (line) => {
    if (!line.startsWith('data: ')) return
    try {
      const json = JSON.parse(line.slice(6))
      if (json.type === 'content_block_delta') {
        const token = json.delta?.text
        if (token) { full += token; onChunk(token) }
      }
    } catch {}
  })
  return full
}

// --- Streaming Dispatch & Fallback ---

type StreamFn = (sys: string, msg: string, cfg: LLMUserConfig, ms: number, onChunk: OnChunkCallback, signal?: AbortSignal) => Promise<string>

export async function streamProviderCall(
  provider: LLMProviderKey, sys: string, msg: string, cfg: LLMUserConfig, timeoutMs: number, onChunk: OnChunkCallback, signal?: AbortSignal,
): Promise<string> {
  const fns: Record<LLMProviderKey, StreamFn> = {
    ollama: streamOllamaProvider, openai: streamOpenAIProvider, gemini: streamGeminiProvider,
    anthropic: streamAnthropicProvider, groq: streamGroqProvider, openrouter: streamOpenRouterProvider,
  }
  const fn = fns[provider]
  if (!fn) throw new Error(`Unknown provider: ${provider}`)
  return fn(sys, msg, cfg, timeoutMs, onChunk, signal)
}

export async function callLLMWithFallbackStreaming(
  systemPrompt: string, userMessage: string, onChunk: OnChunkCallback,
  settingsOrOptions?: LLMSettings | LLMCallOptions, timeoutMs = 300000,
): Promise<LLMCallResult> {
  let s: LLMSettings
  let timeout: number
  let signal: AbortSignal | undefined
  let maxRetries: number
  if (settingsOrOptions && 'activeProvider' in settingsOrOptions) {
    s = settingsOrOptions as LLMSettings
    timeout = timeoutMs
    signal = undefined
    maxRetries = 1
  } else if (settingsOrOptions) {
    const opts = settingsOrOptions as LLMCallOptions
    s = opts.settings || loadSettings()
    timeout = opts.timeoutMs ?? timeoutMs
    signal = opts.signal
    maxRetries = opts.maxRetries ?? 1
  } else {
    s = loadSettings()
    timeout = timeoutMs
    signal = undefined
    maxRetries = 1
  }

  // Always try activeProvider first, then the rest of the fallback chain (deduped)
  const baseChain = s.fallbackChain.length > 0 ? s.fallbackChain : [s.activeProvider]
  const chain = [s.activeProvider, ...baseChain.filter(p => p !== s.activeProvider)]

  const errors: string[] = []
  for (const key of chain) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const cfg = s.providers[key] || { provider: key }
    // Skip providers that require an API key but don't have one configured
    if (PROVIDER_REGISTRY[key]?.requiresApiKey && !cfg.apiKey && !getEnvApiKey(key)) {
      errors.push(`${key}: no API key configured`)
      continue
    }
    try {
      const text = await withRetry(
        () => streamProviderCall(key, systemPrompt, userMessage, cfg, timeout, onChunk, signal),
        maxRetries, 1000, signal,
      )
      return { text, provider: key, model: cfg.model || PROVIDER_REGISTRY[key]?.defaultModel }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${key}: ${msg}`)
    }
  }
  // Free demo fallback: server-proxied key (non-streamed; emitted as one chunk)
  const demoCfg = s.providers[s.activeProvider] || { provider: s.activeProvider }
  const demoText = await callDemoProxy(systemPrompt, userMessage, demoCfg, signal)
  if (demoText) { onChunk(demoText); return { text: demoText, provider: 'demo', model: 'demo' } }

  console.error('[NavniAI] All LLM providers failed:', errors)
  const simText = `[Simulated] All providers failed (${errors.join('; ')}). Input: ${userMessage.slice(0, 200)}`
  onChunk(simText)
  return { text: simText, provider: 'simulated' }
}
