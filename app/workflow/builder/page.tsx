'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { WorkflowBuilder } from '@/components/WorkflowBuilder'
import { TemplateBriefModal } from '@/components/TemplateBriefModal'
import { getTemplateById } from '@/lib/pipelineTemplates'

function BuilderWithTemplate() {
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template') || undefined
  const runId = searchParams.get('run') || undefined
  const workflowId = searchParams.get('workflowId') || undefined

  const template = templateId ? getTemplateById(templateId) : null
  const hasBriefFields = (template?.briefFields?.length ?? 0) > 0

  // briefReady: starts false when there are fields to collect, true otherwise
  const [briefReady, setBriefReady] = useState(!hasBriefFields)
  const [briefValues, setBriefValues] = useState<Record<string, string>>({})

  if (!briefReady && template && hasBriefFields) {
    return (
      <TemplateBriefModal
        template={template}
        onSubmit={(values) => { setBriefValues(values); setBriefReady(true) }}
        onSkip={() => setBriefReady(true)}
      />
    )
  }

  return (
    <WorkflowBuilder
      templateId={templateId}
      runId={runId}
      workflowId={workflowId}
      briefValues={briefValues}
    />
  )
}

export default function WorkflowBuilderPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-ink-400">Loading builder...</div>}>
      <BuilderWithTemplate />
    </Suspense>
  )
}

