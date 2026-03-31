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
}

export interface LLMCallResult {
  text: string; provider: LLMProviderKey | 'simulated'; model?: string
}

export const PROVIDER_REGISTRY: Record<LLMProviderKey, LLMProviderConfig> = {
  ollama: {
    id: 'ollama', name: 'Ollama (Local)', icon: '\uD83E\uDD99', color: '#a855f7',
    defaultModel: 'llama3.2', requiresApiKey: false, supportsClientSide: true,
    models: ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'codellama', 'phi3', 'gemma2', 'qwen2.5'],
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
    case 'simulated': return { label: 'Simulated', bgClass: 'bg-gray-600/20', textClass: 'text-gray-400' }
    default: return { label: key, bgClass: 'bg-gray-600/20', textClass: 'text-gray-400' }
  }
}

// --- API Call Functions ---

async function callOllamaProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number): Promise<string> {
  const base = cfg.baseUrl || 'http://localhost:11434'
  const model = cfg.model || 'llama3.2'
  const res = await fetch(`${base}/api/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: msg, system: sys, stream: false }),
    signal: AbortSignal.timeout(ms),
  })
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`)
  return (await res.json()).response || ''
}

async function callOpenAIProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number): Promise<string> {
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
    signal: AbortSignal.timeout(ms),
  })
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
  return (await res.json()).choices?.[0]?.message?.content || ''
}

async function callGeminiProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number): Promise<string> {
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
      signal: AbortSignal.timeout(ms),
    })
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function callAnthropicProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number): Promise<string> {
  const apiKey = cfg.apiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Anthropic API key not configured')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: cfg.model || 'claude-sonnet-4-20250514', system: sys,
      max_tokens: cfg.maxTokens ?? 2000, messages: [{ role: 'user', content: msg }],
    }),
    signal: AbortSignal.timeout(ms),
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)
  return (await res.json()).content?.[0]?.text || ''
}

async function callGroqProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number): Promise<string> {
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
    signal: AbortSignal.timeout(ms),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status}`)
  return (await res.json()).choices?.[0]?.message?.content || ''
}

async function callOpenRouterProvider(sys: string, msg: string, cfg: LLMUserConfig, ms: number): Promise<string> {
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
    signal: AbortSignal.timeout(ms),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  return (await res.json()).choices?.[0]?.message?.content || ''
}

// --- Dispatch & Fallback ---

export async function callProvider(
  provider: LLMProviderKey, sys: string, msg: string, cfg: LLMUserConfig, timeoutMs = 30000
): Promise<string> {
  const fns: Record<LLMProviderKey, typeof callOllamaProvider> = {
    ollama: callOllamaProvider, openai: callOpenAIProvider, gemini: callGeminiProvider,
    anthropic: callAnthropicProvider, groq: callGroqProvider, openrouter: callOpenRouterProvider,
  }
  const fn = fns[provider]
  if (!fn) throw new Error(`Unknown provider: ${provider}`)
  return fn(sys, msg, cfg, timeoutMs)
}

export async function callLLMWithFallback(
  systemPrompt: string, userMessage: string, settings?: LLMSettings, timeoutMs = 30000
): Promise<LLMCallResult> {
  const s = settings || loadSettings()
  const chain = s.fallbackChain.length > 0 ? s.fallbackChain : [s.activeProvider]
  const errors: string[] = []
  for (const key of chain) {
    try {
      const cfg = s.providers[key] || { provider: key }
      const text = await callProvider(key, systemPrompt, userMessage, cfg, timeoutMs)
      return { text, provider: key, model: cfg.model || PROVIDER_REGISTRY[key]?.defaultModel }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${key}: ${msg}`)
    }
  }
  // Final fallback: simulated response
  return {
    text: `[Simulated] All providers failed (${errors.join('; ')}). Input: ${userMessage.slice(0, 200)}`,
    provider: 'simulated',
  }
}
