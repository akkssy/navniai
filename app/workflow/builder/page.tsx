'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { WorkflowBuilder } from '@/components/WorkflowBuilder'

function BuilderWithTemplate() {
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template') || undefined
  const runId = searchParams.get('run') || undefined
  return <WorkflowBuilder templateId={templateId} runId={runId} />
}

export default function WorkflowBuilderPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-ink-400">Loading builder...</div>}>
      <BuilderWithTemplate />
    </Suspense>
  )
}

