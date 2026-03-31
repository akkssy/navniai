'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PROVIDER_REGISTRY, ALL_PROVIDER_KEYS, loadSettings, saveSettings,
  type LLMProviderKey, type LLMSettings,
} from '@/lib/llmProviders'

export default function SettingsPage() {
  const [settings, setSettings] = useState<LLMSettings | null>(null)
  const [testResults, setTestResults] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState<string | null>(null)

  useEffect(() => { setSettings(loadSettings()) }, [])

  if (!settings) return <div className="min-h-screen bg-dark-900 flex items-center justify-center text-gray-400">Loading...</div>

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
    <div className="min-h-screen bg-dark-900">
      <header className="border-b border-dark-700 bg-dark-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">LLM Settings</h1>
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition">Back to Dashboard</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Active Provider */}
        <section className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h2 className="text-lg font-semibold mb-4">Active Provider</h2>
          <div className="grid grid-cols-3 gap-3">
            {ALL_PROVIDER_KEYS.map(key => {
              const p = PROVIDER_REGISTRY[key]
              const active = settings.activeProvider === key
              return (
                <button key={key} onClick={() => update(s => ({ ...s, activeProvider: key }))}
                  className={`p-4 rounded-lg border-2 text-left transition ${active ? 'border-primary-500 bg-primary-500/10' : 'border-dark-600 hover:border-dark-500'}`}>
                  <div className="text-2xl mb-1">{p.icon}</div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.requiresApiKey ? 'API key required' : 'No key needed'}</div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Provider Configs */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Provider Configuration</h2>
          {ALL_PROVIDER_KEYS.map(key => {
            const p = PROVIDER_REGISTRY[key]
            const cfg = settings.providers[key]
            const result = testResults[key]
            return (
              <div key={key} className="bg-dark-800 rounded-xl p-5 border border-dark-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{p.icon} {p.name}</span>
                  <button onClick={() => testProvider(key)} disabled={testing === key}
                    className="px-3 py-1 text-sm rounded bg-dark-600 hover:bg-dark-500 disabled:opacity-50 transition">
                    {testing === key ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
                {result && <div className={`text-sm mb-3 ${result.startsWith('Connected') ? 'text-green-400' : 'text-red-400'}`}>{result}</div>}
                <div className="grid grid-cols-2 gap-3">
                  {p.requiresApiKey && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">API Key</label>
                      <input type="password" value={cfg.apiKey || ''} placeholder="sk-..."
                        onChange={e => update(s => { s.providers[key] = { ...s.providers[key], apiKey: e.target.value }; return s })}
                        className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-sm" />
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Model</label>
                    <select value={cfg.model || p.defaultModel}
                      onChange={e => update(s => { s.providers[key] = { ...s.providers[key], model: e.target.value }; return s })}
                      className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-sm">
                      {p.models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  {p.defaultBaseUrl && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Base URL</label>
                      <input type="text" value={cfg.baseUrl || p.defaultBaseUrl}
                        onChange={e => update(s => { s.providers[key] = { ...s.providers[key], baseUrl: e.target.value }; return s })}
                        className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-sm" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </section>

        {/* Fallback Chain */}
        <section className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h2 className="text-lg font-semibold mb-2">Fallback Chain</h2>
          <p className="text-sm text-gray-500 mb-3">Order in which providers are tried if the active one fails.</p>
          <div className="flex flex-wrap gap-2">
            {settings.fallbackChain.map((key, i) => (
              <span key={key} className="px-3 py-1 bg-dark-600 rounded-full text-sm flex items-center gap-1">
                <span className="text-gray-400">{i + 1}.</span> {PROVIDER_REGISTRY[key]?.icon} {PROVIDER_REGISTRY[key]?.name}
              </span>
            ))}
            <span className="px-3 py-1 bg-dark-700 rounded-full text-sm text-gray-500">Simulated (always last)</span>
          </div>
        </section>
      </main>
    </div>
  )
}
