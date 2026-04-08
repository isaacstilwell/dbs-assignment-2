'use client'

import { useState } from 'react'
import KanbanColumn from './KanbanColumn'
import { useTaskStore } from '@/store/tasks'
import type { Task, TaskStatus } from '@/types'

const STATUSES: TaskStatus[] = ['todo', 'doing', 'done']
const LABELS: Record<TaskStatus, string> = { todo: 'TO DO', doing: 'DOING', done: 'DONE' }

interface TaskDatabaseProps {
  onEdit: (task: Task) => void
}

export default function TaskDatabase({ onEdit }: TaskDatabaseProps) {
  const { tasks } = useTaskStore()
  const [activeStatus, setActiveStatus] = useState<TaskStatus>('todo')

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

      {/* Mobile: tab bar + single column */}
      <div className="md:hidden">
        <div className="flex items-center gap-6 border-b border-[var(--border-dim)] mb-4">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`text-[10px] tracking-widest pb-2 cursor-pointer border-b-2 -mb-px ${
                activeStatus === s
                  ? 'text-[var(--accent)] border-[var(--accent)]'
                  : 'text-[var(--text-dim)] border-transparent hover:text-[var(--accent)]'
              }`}
            >
              {LABELS[s]}
              <span className="ml-1.5 opacity-50">{tasksByStatus[s].length}</span>
            </button>
          ))}
        </div>
        <KanbanColumn
          status={activeStatus}
          tasks={tasksByStatus[activeStatus]}
          onEdit={onEdit}
        />
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
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
