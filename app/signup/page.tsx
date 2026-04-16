'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SparklesIcon } from '@heroicons/react/24/outline'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Account created but sign-in failed. Please log in.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
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
          <p className="text-ink-400 text-sm mt-2">Create your free account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-7 space-y-4">
          {error && (
            <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-ink-500 mb-1.5">Full Name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3.5 py-2.5 bg-surface-50 border border-surface-300 rounded-md text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
              placeholder="John Doe" />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-ink-500 mb-1.5">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-3.5 py-2.5 bg-surface-50 border border-surface-300 rounded-md text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
              placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-ink-500 mb-1.5">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
              className="w-full px-3.5 py-2.5 bg-surface-50 border border-surface-300 rounded-md text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
              placeholder="••••••••" />
            <p className="text-[10px] text-ink-300 mt-1">Must be at least 8 characters</p>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 text-sm disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-[10px] text-ink-300">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>

          <div className="text-center text-xs text-ink-400">
            Already have an account?{' '}
            <Link href="/login" className="text-accent-500 hover:text-accent-600 transition">Sign in</Link>
          </div>
        </form>

        <div className="text-center mt-5">
          <Link href="/" className="text-xs text-ink-300 hover:text-ink-500 transition">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}

