'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore } from '@/store/tasks'
import SubtaskRow from './SubtaskRow'
import type { Task } from '@/types'
import { formatDueDate } from '@/lib/dates'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  isDragging?: boolean
}

export default function TaskCard({ task, onEdit, isDragging }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { subtasks } = useTaskStore()

  const taskSubtasks = task.subtaskIds.map((id) => subtasks[id]).filter(Boolean)
  const doneCount = taskSubtasks.filter((s) => s.done).length

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  const isDone = task.status === 'done'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-[var(--border)] bg-[var(--card-bg)] group transition-all duration-150 ${
        isDragging ? 'shadow-[0_0_12px_rgba(109,189,175,0.4)]' : ''
      } ${isSortableDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* Card header — drag handle + title + edit */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-2 px-3 pt-3 pb-2"
      >
        {/* Drag grip */}
        <span className="text-[var(--text-dim)] text-base shrink-0 select-none">⠿</span>

        {/* Title */}
        <span
          className={`flex-1 text-sm leading-snug mt-0.5 ${
            isDone ? 'line-through opacity-40' : ''
          }`}
        >
          {task.title}
        </span>

        {/* Edit button */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onEdit(task)
          }}
          className="opacity-0 group-hover:opacity-100 text-[var(--text-dim)] hover:underline text-base shrink-0 px-1 cursor-pointer"
          aria-label="Edit task"
        >
          ✎
        </button>
      </div>

      {/* Meta row: due date + subtask toggle */}
      <div
        className="flex items-center gap-3 px-3 pb-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {task.dueDate && (
          <span className="text-[var(--text-dim)] text-[10px]">
            due {formatDueDate(task.dueDate)}
          </span>
        )}
        {taskSubtasks.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[var(--text-dim)] hover:text-[var(--accent)] text-[10px] transition-colors"
          >
            {expanded ? '▼' : '▶'} {doneCount}/{taskSubtasks.length} subtasks
          </button>
        )}
      </div>

      {/* Subtasks (expanded) */}
      {expanded && taskSubtasks.length > 0 && (
        <div className="border-t border-[var(--border-dim)] pb-1">
          {taskSubtasks.map((sub) => (
            <SubtaskRow key={sub.id} subtask={sub} />
          ))}
        </div>
      )}
    </div>
  )
}
