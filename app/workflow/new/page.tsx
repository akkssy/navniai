'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewWorkflowPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the visual workflow builder for new workflows
    router.replace('/workflow/builder')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500 mx-auto mb-4" />
        <p className="text-ink-400">Opening Workflow Builder...</p>
      </div>
    </div>
  )
}

