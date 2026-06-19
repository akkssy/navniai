import WorkflowDetailClient from './WorkflowDetailClient'

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  return <WorkflowDetailClient params={params} />
}
