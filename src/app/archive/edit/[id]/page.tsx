import ArchivePage from '@/components/ArchivePage'

export default async function ArchiveEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ArchivePage initialModal={id} />
}
