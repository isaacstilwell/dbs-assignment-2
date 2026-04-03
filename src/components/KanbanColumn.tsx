'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import type { Task, TaskStatus } from '@/types'

const COLUMN_LABELS: Record<TaskStatus, string> = {
  todo: 'TO DO',
  doing: 'DOING',
  done: 'DONE',
}

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onEdit: (task: Task) => void
}

export default function KanbanColumn({ status, tasks, onEdit }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${status}`,
    data: { type: 'column', status },
  })

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Column header */}
      <div
        className={`border-b-2 pb-2 mb-3 transition-colors ${
          isOver
            ? 'border-[var(--accent-bright)]'
            : 'border-[var(--border)]'
        }`}
      >
        <span className="text-xs tracking-widest opacity-70">{COLUMN_LABELS[status]}</span>
        <span className="text-[var(--text-dim)] text-xs ml-2">({tasks.length})</span>
      </div>

      {/* Drop zone + task list */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 flex-1 min-h-24 transition-colors rounded-none p-1 ${
          isOver ? 'bg-[rgba(109,189,175,0.05)]' : ''
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-[var(--text-dim)] text-xs text-center py-4 opacity-40 select-none">
            — empty —
          </div>
        )}
      </div>
    </div>
  )
}
