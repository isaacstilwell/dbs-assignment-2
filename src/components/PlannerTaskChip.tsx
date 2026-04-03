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
      className="flex items-center gap-1 border border-[var(--border-dim)] hover:border-[var(--accent)] bg-[var(--card-bg)] px-2 py-1 group transition-colors cursor-grab"
    >
      <span
        {...attributes}
        {...listeners}
        className="text-[var(--text-dim)] text-[9px] shrink-0 select-none"
      >
        ⠿
      </span>
      <span
        onClick={() => onEdit(taskId)}
        className={`flex-1 text-[10px] leading-tight truncate cursor-pointer hover:text-[var(--accent-bright)] transition-colors ${
          isDone ? 'line-through opacity-40' : ''
        }`}
      >
        {task.title}
      </span>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => removeFromDay(dayKey, taskId)}
        className="opacity-0 group-hover:opacity-100 text-[var(--text-dim)] hover:text-[var(--accent)] text-xs transition-opacity shrink-0"
        aria-label="Remove from planner"
      >
        ×
      </button>
    </div>
  )
}
