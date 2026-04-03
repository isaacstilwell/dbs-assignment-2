'use client'

import { useTaskStore } from '@/store/tasks'
import type { Subtask } from '@/types'

interface SubtaskRowProps {
  subtask: Subtask
}

export default function SubtaskRow({ subtask }: SubtaskRowProps) {
  const { updateSubtask, deleteSubtask } = useTaskStore()

  return (
    <div className="flex items-center gap-2 py-1 px-2 group">
      <span className="text-[var(--text-dim)] text-xs shrink-0">└</span>
      <button
        onClick={() => updateSubtask(subtask.id, { done: !subtask.done })}
        className="w-3 h-3 border border-[var(--accent)] shrink-0 flex items-center justify-center hover:bg-[var(--accent)] transition-colors"
        style={{ minWidth: '12px' }}
        aria-label={subtask.done ? 'Mark incomplete' : 'Mark complete'}
      >
        {subtask.done && (
          <span className="text-black text-[8px] leading-none">×</span>
        )}
      </button>
      <span
        className={`text-xs flex-1 leading-tight ${
          subtask.done ? 'line-through opacity-40' : ''
        }`}
      >
        {subtask.title}
      </span>
      <button
        onClick={() => deleteSubtask(subtask.id)}
        className="opacity-0 group-hover:opacity-100 text-[var(--text-dim)] hover:text-[var(--accent)] text-xs transition-opacity px-1"
        aria-label="Delete subtask"
      >
        ×
      </button>
    </div>
  )
}
