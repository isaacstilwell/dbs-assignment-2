'use client'

import KanbanColumn from './KanbanColumn'
import { useTaskStore } from '@/store/tasks'
import type { Task, TaskStatus } from '@/types'

const STATUSES: TaskStatus[] = ['todo', 'doing', 'done']

interface TaskDatabaseProps {
  onEdit: (task: Task) => void
}

export default function TaskDatabase({ onEdit }: TaskDatabaseProps) {
  const { tasks } = useTaskStore()

  const tasksByStatus = STATUSES.reduce<Record<TaskStatus, Task[]>>(
    (acc, status) => {
      acc[status] = Object.values(tasks)
        .filter((t) => t.status === status)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      return acc
    },
    { todo: [], doing: [], done: [] }
  )

  return (
    <section className="w-full">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-[10px] tracking-[0.2em] opacity-50">DATABASE</span>
        <div className="flex-1 border-t border-[var(--border-dim)]" />
      </div>

      {/* 3 columns */}
      <div className="grid grid-cols-3 gap-4">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  )
}
