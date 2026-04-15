import WorkflowDetailClient from './WorkflowDetailClient'
import { PIPELINE_TEMPLATES } from '@/lib/pipelineTemplates'

export function generateStaticParams() {
  return PIPELINE_TEMPLATES.map(t => ({ id: t.id }))
}

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  return <WorkflowDetailClient params={params} />
}
