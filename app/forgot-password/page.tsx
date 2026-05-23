'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SparklesIcon } from '@heroicons/react/24/outline'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [devLink, setDevLink] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      setSubmitted(true)
      if (data.devLink) setDevLink(data.devLink)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <SparklesIcon className="h-8 w-8 text-accent-500" />
            <span className="text-2xl font-bold text-ink-700">NavniAI</span>
          </Link>
          <p className="text-ink-400 text-sm mt-2">Reset your password</p>
        </div>

        <div className="glass-card p-7">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📬</div>
              <h3 className="text-sm font-semibold text-ink-700">Check your email</h3>
              <p className="text-xs text-ink-400">
                If an account exists for <strong>{email}</strong>, we've sent a password reset link.
              </p>
              {devLink && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-left">
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">
                    🛠 Dev mode — email not configured
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-500 mb-2">Use this link directly:</p>
                  <a href={devLink} className="text-[11px] text-accent-600 underline break-all">{devLink}</a>
                </div>
              )}
              <Link href="/login" className="block text-xs text-accent-500 hover:text-accent-600 mt-2">
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs text-ink-400">
                Enter the email you registered with and we'll send you a reset link.
              </p>
              {error && (
                <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>
              )}
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-ink-500 mb-1.5">Email</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-3.5 py-2.5 bg-surface-50 border border-surface-300 rounded-md text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
                  placeholder="you@example.com" autoFocus />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 text-sm disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <div className="text-center text-xs text-ink-400">
                Remember it?{' '}
                <Link href="/login" className="text-accent-500 hover:text-accent-600">Sign in</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
