'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import {
  PROVIDER_REGISTRY, ALL_PROVIDER_KEYS, loadSettings, saveSettings,
  type LLMProviderKey, type LLMSettings,
} from '@/lib/llmProviders'

export default function SettingsPage() {
  const [settings, setSettings] = useState<LLMSettings | null>(null)
  const [testResults, setTestResults] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState<string | null>(null)

  useEffect(() => { setSettings(loadSettings()) }, [])

  if (!settings) return <div className="min-h-screen flex items-center justify-center text-ink-400">Analyzing patterns...</div>

  const update = (fn: (s: LLMSettings) => LLMSettings) => {
    const next = fn({ ...settings })
    setSettings(next)
    saveSettings(next)
  }

  const testProvider = async (key: LLMProviderKey) => {
    setTesting(key)
    setTestResults(r => ({ ...r, [key]: 'testing...' }))
    try {
      const res = await fetch('/api/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: key, config: settings.providers[key] }),
      })
      const data = await res.json()
      setTestResults(r => ({ ...r, [key]: data.ok ? `Connected (${data.model})` : `Failed: ${data.error}` }))
    } catch (e: unknown) {
      setTestResults(r => ({ ...r, [key]: `Error: ${e instanceof Error ? e.message : 'unknown'}` }))
    }
    setTesting(null)
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-300 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold tracking-tight text-ink-700">LLM Settings</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard" className="text-ink-400 hover:text-ink-700 text-sm transition">← Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Active Provider */}
        <section className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 text-ink-700">Active Provider</h2>
          <div className="grid grid-cols-3 gap-3">
            {ALL_PROVIDER_KEYS.map(key => {
              const p = PROVIDER_REGISTRY[key]
              const active = settings.activeProvider === key
              return (
                <button key={key} onClick={() => update(s => ({ ...s, activeProvider: key }))}
                  className={`p-4 rounded-md border text-left transition-all duration-200 ${active ? 'border-accent-300 bg-accent-50 shadow-input-focus' : 'border-surface-300 hover:border-surface-400 hover:bg-surface-50'}`}>
                  <div className="text-xl mb-1.5">{p.icon}</div>
                  <div className="font-medium text-sm text-ink-700">{p.name}</div>
                  <div className="text-[11px] text-ink-300 mt-0.5">{p.requiresApiKey ? 'API key required' : 'No key needed'}</div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Provider Configs */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-ink-700">Provider Configuration</h2>
          {ALL_PROVIDER_KEYS.map(key => {
            const p = PROVIDER_REGISTRY[key]
            const cfg = settings.providers[key]
            const result = testResults[key]
            return (
              <div key={key} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm text-ink-700">{p.icon} {p.name}</span>
                  <button onClick={() => testProvider(key)} disabled={testing === key}
                    className="btn-secondary text-xs px-3 py-1.5">
                    {testing === key ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
                {result && <div className={`text-xs mb-3 ${result.startsWith('Connected') ? 'text-emerald-600' : 'text-red-500'}`}>{result}</div>}
                <div className="grid grid-cols-2 gap-3">
                  {p.requiresApiKey && (
                    <div>
                      <label className="text-[11px] text-ink-300 block mb-1">API Key</label>
                      <input type="password" value={cfg.apiKey || ''} placeholder="sk-..."
                        onChange={e => update(s => { s.providers[key] = { ...s.providers[key], apiKey: e.target.value }; return s })}
                        className="w-full bg-surface-50 border border-surface-300 rounded-md px-3 py-2 text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition" />
                    </div>
                  )}
                  <div>
                    <label className="text-[11px] text-ink-300 block mb-1">Model</label>
                    <select value={cfg.model || p.defaultModel}
                      onChange={e => update(s => { s.providers[key] = { ...s.providers[key], model: e.target.value }; return s })}
                      className="w-full bg-surface-50 border border-surface-300 rounded-md px-3 py-2 text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition">
                      {p.models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  {p.defaultBaseUrl && (
                    <div>
                      <label className="text-[11px] text-ink-300 block mb-1">Base URL</label>
                      <input type="text" value={cfg.baseUrl || p.defaultBaseUrl}
                        onChange={e => update(s => { s.providers[key] = { ...s.providers[key], baseUrl: e.target.value }; return s })}
                        className="w-full bg-surface-50 border border-surface-300 rounded-md px-3 py-2 text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </section>

        {/* Fallback Chain */}
        <section className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-2 text-ink-700">Fallback Chain</h2>
          <p className="text-[11px] text-ink-300 mb-3">Order in which providers are tried if the active one fails.</p>
          <div className="flex flex-wrap gap-2">
            {settings.fallbackChain.map((key, i) => (
              <span key={key} className="px-3 py-1.5 bg-surface-100 border border-surface-300 rounded-md text-xs flex items-center gap-1">
                <span className="text-ink-300">{i + 1}.</span> {PROVIDER_REGISTRY[key]?.icon} {PROVIDER_REGISTRY[key]?.name}
              </span>
            ))}
            <span className="px-3 py-1.5 bg-surface-50 border border-surface-200 rounded-md text-xs text-ink-300">Simulated (always last)</span>
          </div>
        </section>
      </main>
    </div>
  )
}
