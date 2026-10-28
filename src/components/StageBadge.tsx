export default function StageBadge({ stage }: { stage: string | null }) {
  if (!stage) return null
  const preparing = /prepar/i.test(stage)
  return (
    <span className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${
      preparing ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
    }`}>
      {stage}
    </span>
  )
}
