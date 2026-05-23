'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SparklesIcon } from '@heroicons/react/24/outline'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-ink-400">Loading...</div>}>
      <ResetForm />
    </Suspense>
  )
}

function ResetForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
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
          <p className="text-ink-400 text-sm mt-2">Choose a new password</p>
        </div>

        <div className="glass-card p-7">
          {!token ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-red-600">Invalid reset link.</p>
              <Link href="/forgot-password" className="text-xs text-accent-500 hover:text-accent-600">
                Request a new one →
              </Link>
            </div>
          ) : done ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">✅</div>
              <h3 className="text-sm font-semibold text-ink-700">Password updated!</h3>
              <p className="text-xs text-ink-400">Redirecting you to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>
              )}
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1.5">New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  className="w-full px-3.5 py-2.5 bg-surface-50 border border-surface-300 rounded-md text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
                  placeholder="At least 8 characters" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1.5">Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  className="w-full px-3.5 py-2.5 bg-surface-50 border border-surface-300 rounded-md text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
                  placeholder="Repeat your password" />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 text-sm disabled:opacity-50">
                {loading ? 'Updating...' : 'Set New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
