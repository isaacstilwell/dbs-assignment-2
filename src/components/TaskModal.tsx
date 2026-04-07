'use client'

import { useState, useEffect, useRef } from 'react'
import { useTaskStore } from '@/store/tasks'
import type { Task, TaskStatus } from '@/types'

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'TO DO',
  doing: 'DOING',
  done: 'DONE',
}
const STATUSES: TaskStatus[] = ['todo', 'doing', 'done']

interface TaskModalProps {
  task: Task | null          // null = create mode
  onClose: () => void
}

export default function TaskModal({ task, onClose }: TaskModalProps) {
  const { addTask, updateTask, deleteTask, addSubtask, updateSubtask, deleteSubtask, tasks, subtasks: allSubtasks } = useTaskStore()

  const [title, setTitle] = useState(task?.title ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [newSubtask, setNewSubtask] = useState('')
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('')

  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const liveTask = task ? tasks[task.id] : null
  const taskSubtasks = liveTask
    ? liveTask.subtaskIds.map((id) => allSubtasks[id]).filter(Boolean)
    : []

  function handleSave() {
    if (!title.trim()) return
    if (task) {
      updateTask(task.id, {
        title: title.trim(),
        status,
        dueDate: dueDate || null,
        notes,
      })
    } else {
      addTask({
        title: title.trim(),
        status,
        dueDate: dueDate || null,
        notes,
      })
    }
    onClose()
  }

  function handleDelete() {
    if (!task) return
    deleteTask(task.id)
    onClose()
  }

  function handleAddSubtask() {
    if (!newSubtask.trim() || !task) return
    addSubtask(task.id, newSubtask.trim())
    setNewSubtask('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg border border-[var(--border)] bg-[var(--bg)]"
        style={{ backgroundColor: '#050f0e' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <span className="text-xs tracking-widest opacity-70">
            {task ? 'EDIT TASK' : 'NEW TASK'}
          </span>
          <button
            onClick={onClose}
            className="text-[var(--text-dim)] hover:text-[var(--accent)] text-lg leading-none transition-colors cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest opacity-50">TITLE</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              className="border-b border-[var(--border-dim)] focus:border-[var(--accent)] bg-transparent py-1 text-sm transition-colors w-full"
              placeholder="Task title..."
            />
          </div>

          {/* Status + Due date row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] tracking-widest opacity-50">STATUS</label>
              <div className="flex gap-2 flex-wrap">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`text-[10px] tracking-wider px-2 py-1 border transition-colors cursor-pointer ${
                      status === s
                        ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--card-bg)]'
                        : 'border-[var(--border-dim)] text-[var(--text-dim)] hover:border-[var(--accent)]'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] tracking-widest opacity-50">DUE DATE</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border-b border-[var(--border-dim)] focus:border-[var(--accent)] bg-transparent py-1 text-sm transition-colors w-full cursor-text"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest opacity-50">NOTES</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="border border-[var(--border-dim)] focus:border-[var(--accent)] bg-transparent p-2 text-xs resize-none transition-colors w-full leading-relaxed"
              placeholder="Add notes..."
            />
          </div>

          {/* Subtasks (only in edit mode) */}
          {task && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] tracking-widest opacity-50">SUBTASKS</label>
              <div className="border border-[var(--border-dim)] flex flex-col">
                {taskSubtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-2 px-2 py-1.5 border-b border-[var(--border-dim)] last:border-b-0 group/sub"
                  >
                    <span className="text-[var(--text-dim)] text-xs">└</span>
                    {editingSubtaskId === sub.id ? (
                      <>
                        <input
                          autoFocus
                          value={editingSubtaskTitle}
                          onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (editingSubtaskTitle.trim()) updateSubtask(sub.id, { title: editingSubtaskTitle.trim() })
                              setEditingSubtaskId(null)
                            }
                            if (e.key === 'Escape') setEditingSubtaskId(null)
                          }}
                          onBlur={() => {
                            if (editingSubtaskTitle.trim()) updateSubtask(sub.id, { title: editingSubtaskTitle.trim() })
                            setEditingSubtaskId(null)
                          }}
                          className="flex-1 bg-transparent text-xs border-b border-[var(--accent)] cursor-text"
                        />
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault()
                            if (editingSubtaskTitle.trim()) updateSubtask(sub.id, { title: editingSubtaskTitle.trim() })
                            setEditingSubtaskId(null)
                          }}
                          className="text-[var(--accent)] hover:underline text-xs leading-none cursor-pointer shrink-0"
                          aria-label="Save subtask"
                        >
                          ✓
                        </button>
                      </>
                    ) : (
                      <span className="flex-1 text-xs">
                        <span className={sub.done ? 'struck opacity-40' : ''}>{sub.title}</span>
                      </span>
                    )}
                    {editingSubtaskId !== sub.id && (
                      <button
                        onClick={() => { setEditingSubtaskId(sub.id); setEditingSubtaskTitle(sub.title) }}
                        className="opacity-0 group-hover/sub:opacity-100 text-[var(--text-dim)] hover:text-[var(--accent)] hover:underline text-xs leading-none cursor-pointer"
                        aria-label="Edit subtask"
                      >
                        ✎
                      </button>
                    )}
                    {editingSubtaskId !== sub.id && (
                      <button
                        onClick={() => deleteSubtask(sub.id)}
                        className="opacity-0 group-hover/sub:opacity-100 text-[var(--text-dim)] hover:text-[var(--accent)] hover:underline text-base leading-none cursor-pointer"
                        aria-label="Delete subtask"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {/* Add subtask input */}
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <span className="text-[var(--text-dim)] text-xs">+</span>
                  <input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask() }
                    }}
                    className="flex-1 bg-transparent text-xs"
                    placeholder="Add subtask..."
                  />
                  {newSubtask.trim() && (
                    <button
                      onClick={handleAddSubtask}
                      className="text-[10px] text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      ADD
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-between items-center pt-1 border-t border-[var(--border-dim)]">
            {task ? (
              <button
                onClick={handleDelete}
                className="text-[10px] tracking-wider text-[var(--text-dim)] hover:text-red-400 cursor-pointer"
              >
                DELETE
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="text-[10px] tracking-wider text-[var(--text-dim)] hover:text-[var(--accent)] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="text-[10px] tracking-wider px-3 py-1.5 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--card-bg)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
