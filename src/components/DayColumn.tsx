'use client'

import { useDroppable } from '@dnd-kit/core'
import PlannerTaskChip from './PlannerTaskChip'
import { formatDayLabel, isToday } from '@/lib/dates'

interface DayColumnProps {
  date: Date
  dayKey: string
  taskIds: string[]
  onEdit: (taskId: string) => void
}

export default function DayColumn({ date, dayKey, taskIds, onEdit }: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayKey}`,
    data: { type: 'day', dayKey },
  })

  const { short, num } = formatDayLabel(date)
  const today = isToday(date)

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Day header */}
      <div
        className={`border-b-2 pb-2 mb-2 transition-colors ${
          isOver
            ? 'border-[var(--accent-bright)]'
            : today
            ? 'border-[var(--accent)]'
            : 'border-[var(--border-dim)]'
        }`}
      >
        <div className={`text-[10px] tracking-widest ${today ? 'text-[var(--accent)]' : 'opacity-40'}`}>
          {short}
        </div>
        <div className={`text-lg leading-tight ${today ? 'text-[var(--accent-bright)]' : 'opacity-40'}`}>
          {num}
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-1.5 flex-1 min-h-16 transition-colors p-0.5 ${
          isOver ? 'bg-[rgba(109,189,175,0.05)]' : ''
        }`}
      >
        {taskIds.map((taskId) => (
          <PlannerTaskChip
            key={`${dayKey}-${taskId}`}
            taskId={taskId}
            dayKey={dayKey}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  )
}
