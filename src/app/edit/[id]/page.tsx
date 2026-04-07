import TaskManagerPage from '@/components/TaskManagerPage'

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TaskManagerPage initialModal={id} />
}
