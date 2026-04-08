'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore } from '@/store/tasks'
import { usePlannerStore } from '@/store/planner'
import { XIcon, EditIcon } from './icons'

interface PlannerTaskChipProps {
  taskId: string
  dayKey: string
  subtaskIds: string[] | null
  onEdit: (taskId: string) => void
}

export default function PlannerTaskChip({ taskId, dayKey, subtaskIds, onEdit }: PlannerTaskChipProps) {
  const { tasks, updateTask, updateSubtask, subtasks: allSubtasks } = useTaskStore()
  const { removeFromDay, removeSubtaskFromDay } = usePlannerStore()
  const task = tasks[taskId]

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `planner-${dayKey}-${taskId}`,
    data: { type: 'planner-chip', taskId, dayKey, subtaskIds },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  if (!task) return null

  const isDone = task.status === 'done'
  const taskSubtasks = (subtaskIds === null ? task.subtaskIds : subtaskIds)
    .map((id) => allSubtasks[id])
    .filter(Boolean)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex flex-col border border-[var(--border-dim)] hover:border-[var(--accent)] bg-[var(--card-bg)] px-2 py-2.5 group transition-colors"
    >
      {/* Top-right overlay: ✎ and × — appear on chip hover */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 opacity-0 group-hover:opacity-100 hover:opacity-100 flex items-center gap-1 bg-[var(--bg)] border border-[var(--border-dim)] px-1 py-0.5 z-10">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(taskId)}
          className="text-[var(--text-dim)] hover:text-[var(--accent)] leading-none cursor-pointer flex items-center justify-center"
          aria-label="Edit task"
        >
          <EditIcon size={10} />
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => removeFromDay(dayKey, taskId)}
          className="text-[var(--text-dim)] hover:text-[var(--accent)] leading-none cursor-pointer flex items-center justify-center"
          aria-label="Remove from planner"
        >
          <XIcon size={10} />
        </button>
      </div>

      {/* Main row: drag handle | title | checkbox */}
      <div className="flex items-center gap-2">
        <span
          {...attributes}
          {...listeners}
          className="hidden md:inline text-[var(--text-dim)] text-base shrink-0 select-none leading-none cursor-grab mt-0.5"
        >
          ⠿
        </span>
        <span className="flex-1 text-xs leading-tight truncate mt-0.5">
          <span className={isDone ? 'struck opacity-40' : ''}>{task.title}</span>
        </span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => updateTask(taskId, { status: isDone ? 'todo' : 'done' })}
          className={`w-3 h-3 border border-[var(--accent)] shrink-0 flex items-center justify-center cursor-pointer transition-colors ${isDone ? 'bg-[var(--accent)] hover:opacity-60' : 'hover:bg-[var(--accent)]'}`}
          style={{ minWidth: '12px' }}
          aria-label={isDone ? 'Mark incomplete' : 'Mark done'}
        >
          {isDone && <XIcon size={7} className="text-black" />}
        </button>
      </div>

      {/* Subtask rows: [✎ ×] | └ | title | checkbox */}
      {taskSubtasks.map((sub) => (
        <div key={sub.id} className="flex items-center gap-2 mt-1 group/subrow">
          {/* LHS icon — appears on subtask row hover */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => removeSubtaskFromDay(dayKey, taskId, sub.id, task.subtaskIds)}
            className="opacity-0 group-hover/subrow:opacity-100 text-[var(--text-dim)] hover:text-[var(--accent)] leading-none shrink-0 cursor-pointer flex items-center justify-center"
            aria-label="Remove subtask from planner"
          >
            <XIcon size={10} />
          </button>
          <span className="text-[var(--text-dim)] text-[10px] shrink-0">└</span>
          <span className="flex-1 text-[10px] leading-tight truncate mt-0.5">
            <span className={sub.done ? 'struck opacity-40' : 'opacity-60'}>{sub.title}</span>
          </span>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => updateSubtask(sub.id, { done: !sub.done })}
            className={`w-2.5 h-2.5 border border-[var(--accent)] shrink-0 flex items-center justify-center cursor-pointer transition-colors ${sub.done ? 'bg-[var(--accent)] hover:opacity-60' : 'hover:bg-[var(--accent)]'}`}
            style={{ minWidth: '10px' }}
            aria-label={sub.done ? 'Mark incomplete' : 'Mark complete'}
          >
            {sub.done && <XIcon size={6} className="text-black" />}
          </button>
        </div>
      ))}
    </div>
  )
}
