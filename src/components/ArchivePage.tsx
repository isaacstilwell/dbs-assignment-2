'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTaskStore } from '@/store/tasks'
import { useDB } from '@/hooks/useDB'
import {
  deleteTask as dbDeleteTask,
  deleteSubtasksByTask,
} from '@/lib/db'
import { XIcon } from './icons'
import TaskModal from './TaskModal'
import type { Task } from '@/types'

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function formatDue(iso: string | null): string {
  if (!iso) return '—'
  const [, m, d] = iso.split('-')
  return `${d} ${MONTHS[parseInt(m, 10) - 1]}`
}

export default function ArchivePage({ initialModal }: { initialModal?: string }) {
  const router = useRouter()
  const { tasks, subtasks, deleteTask } = useTaskStore()
  const { client, userId } = useDB()
  const [query, setQuery] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined)

  useEffect(() => {
    if (initialModal) {
      const task = useTaskStore.getState().tasks[initialModal]
      if (task) setModalTask(task)
    }
  }, [initialModal])

  const completedTasks = useMemo(() =>
    Object.values(tasks)
      .filter((t) => t.status === 'done')
      .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [tasks, query]
  )

  function handleClearAll() {
    for (const task of completedTasks) {
      deleteTask(task.id)
      if (userId) {
        dbDeleteTask(client, task.id)
        deleteSubtasksByTask(client, task.id)
      }
    }
    setConfirming(false)
  }

  return (
    <div className="px-6 py-6 max-w-[900px] mx-auto">
      {/* Controls row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-dim)] flex-1 max-w-xs">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title..."
            className="bg-transparent text-xs py-1 flex-1 focus:outline-none"
          />
        </div>
        {completedTasks.length > 0 && (
          <button
            onClick={() => setConfirming(true)}
            className="text-[10px] tracking-widest text-[var(--text-dim)] hover:text-[var(--accent)] border border-[var(--border-dim)] hover:border-[var(--accent)] px-3 py-1.5 cursor-pointer"
          >
            CLEAR ALL COMPLETED
          </button>
        )}
      </div>

      {/* Table header */}
      {completedTasks.length > 0 && (
        <div className="grid grid-cols-[1fr_24px] md:grid-cols-[1fr_80px_80px_24px] gap-3 px-2 pb-1 border-b border-[var(--border-dim)]">
          <span className="text-[9px] tracking-widest opacity-40">TITLE</span>
          <span className="hidden md:block text-[9px] tracking-widest opacity-40">DUE</span>
          <span className="hidden md:block text-[9px] tracking-widest opacity-40">SUBTASKS</span>
          <span />
        </div>
      )}

      {/* Rows */}
      {completedTasks.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <span className="text-xs tracking-[0.3em] opacity-30">
            {query ? 'NO MATCHING TASKS' : 'NO COMPLETED TASKS'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col">
          {completedTasks.map((task) => {
            const taskSubtasks = task.subtaskIds.map((id) => subtasks[id]).filter(Boolean)
            const doneCount = taskSubtasks.filter((s) => s.done).length

            return (
              <div
                key={task.id}
                className="grid grid-cols-[1fr_24px] md:grid-cols-[1fr_80px_80px_24px] gap-3 items-center px-2 py-2 border-b border-[var(--border-dim)] group hover:bg-[var(--card-bg)]"
              >
                <button
                  onClick={() => router.push(`/archive/edit/${task.id}`)}
                  className="text-xs text-left truncate cursor-pointer hover:text-[var(--accent)]"
                >
                  <span className="struck opacity-40">{task.title}</span>
                </button>
                <span className="hidden md:block text-[10px] text-[var(--text-dim)]">{formatDue(task.dueDate)}</span>
                <span className="hidden md:block text-[10px] text-[var(--text-dim)]">
                  {taskSubtasks.length > 0 ? `${doneCount}/${taskSubtasks.length}` : '—'}
                </span>
                <button
                  onClick={() => {
                    deleteTask(task.id)
                    if (userId) {
                      dbDeleteTask(client, task.id)
                      deleteSubtasksByTask(client, task.id)
                    }
                  }}
                  className="text-[var(--text-dim)] hover:text-red-400 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100"
                  aria-label="Delete task"
                >
                  <XIcon size={9} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer count */}
      {completedTasks.length > 0 && (
        <div className="pt-4">
          <span className="text-[10px] tracking-wider opacity-40">
            {completedTasks.length} {completedTasks.length === 1 ? 'TASK' : 'TASKS'} COMPLETED
            {query && ' (FILTERED)'}
          </span>
        </div>
      )}
      {/* Confirm clear-all dialog */}
      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setConfirming(false)}
        >
          <div
            className="w-full max-w-sm mx-4 md:mx-auto border border-[var(--border)] bg-[var(--bg)] p-6 flex flex-col gap-4"
            style={{ backgroundColor: '#050f0e' }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs tracking-widest opacity-70">CONFIRM DELETE</span>
            <p className="text-sm leading-relaxed">
              Delete{' '}
              <span className="text-[var(--accent)]">
                {completedTasks.length} completed {completedTasks.length === 1 ? 'task' : 'tasks'}
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-1 border-t border-[var(--border-dim)]">
              <button
                onClick={() => setConfirming(false)}
                className="text-[10px] tracking-wider text-[var(--text-dim)] hover:text-[var(--accent)] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleClearAll}
                className="text-[10px] tracking-wider px-3 py-1.5 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--card-bg)] cursor-pointer"
              >
                DELETE ALL
              </button>
            </div>
          </div>
        </div>
      )}

      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          onClose={() => { setModalTask(undefined); router.push('/archive') }}
        />
      )}
    </div>
  )
}
