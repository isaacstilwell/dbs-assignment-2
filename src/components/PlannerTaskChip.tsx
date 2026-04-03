'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore } from '@/store/tasks'
import { usePlannerStore } from '@/store/planner'

interface PlannerTaskChipProps {
  taskId: string
  dayKey: string
  onEdit: (taskId: string) => void
}

export default function PlannerTaskChip({ taskId, dayKey, onEdit }: PlannerTaskChipProps) {
  const { tasks } = useTaskStore()
  const { removeFromDay } = usePlannerStore()
  const task = tasks[taskId]

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `planner-${dayKey}-${taskId}`,
    data: { type: 'planner-chip', taskId, dayKey },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  if (!task) return null

  const isDone = task.status === 'done'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 border border-[var(--border-dim)] hover:border-[var(--accent)] bg-[var(--card-bg)] px-2 py-2.5 group transition-colors"
    >
      <span
        {...attributes}
        {...listeners}
        className="text-[var(--text-dim)] text-base shrink-0 select-none leading-none cursor-grab"
      >
        ⠿
      </span>
      <span
        onClick={() => onEdit(taskId)}
        className={`flex-1 text-xs leading-tight truncate cursor-pointer hover:underline mt-0.5 ${
          isDone ? 'line-through opacity-40' : ''
        }`}
      >
        {task.title}
      </span>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => removeFromDay(dayKey, taskId)}
        className="opacity-0 group-hover:opacity-100 text-[var(--text-dim)] hover:text-[var(--accent)] hover:underline text-xl leading-none shrink-0 cursor-pointer flex items-center -translate-y-1"
        aria-label="Remove from planner"
      >
        ×
      </button>
    </div>
  )
}
