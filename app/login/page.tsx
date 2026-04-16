'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SparklesIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-ink-400">Analyzing patterns...</div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push(callbackUrl)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <SparklesIcon className="h-8 w-8 text-accent-500" />
            <span className="text-2xl font-bold text-ink-700">NavniAI</span>
          </Link>
          <p className="text-ink-400 text-sm mt-2">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-7 space-y-5">
          {error && (
            <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-ink-500 mb-1.5">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-3.5 py-2.5 bg-surface-50 border border-surface-300 rounded-md text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
              placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-ink-500 mb-1.5">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-3.5 py-2.5 bg-surface-50 border border-surface-300 rounded-md text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
              placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 text-sm disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center text-xs text-ink-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-accent-500 hover:text-accent-600 transition">Sign up</Link>
          </div>
        </form>

        <div className="text-center mt-5">
          <Link href="/" className="text-xs text-ink-300 hover:text-ink-500 transition">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}

