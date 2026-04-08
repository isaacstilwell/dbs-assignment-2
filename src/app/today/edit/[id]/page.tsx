import TodayPage from '@/components/TodayPage'

export default async function TodayEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TodayPage initialModal={id} />
}
