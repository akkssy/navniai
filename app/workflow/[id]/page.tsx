import WorkflowDetailClient from './WorkflowDetailClient'

export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }]
}

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  return <WorkflowDetailClient params={params} />
}
