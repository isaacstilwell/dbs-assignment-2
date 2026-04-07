'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore } from '@/store/tasks'
import type { Subtask } from '@/types'
import { XIcon } from './icons'

interface SubtaskRowProps {
  subtask: Subtask
}

export default function SubtaskRow({ subtask }: SubtaskRowProps) {
  const { updateSubtask, deleteSubtask } = useTaskStore()

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `subtask-${subtask.id}`,
    data: { type: 'subtask', subtaskId: subtask.id, taskId: subtask.parentId },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-1 px-2 group">
      <span
        {...attributes}
        {...listeners}
        className="text-[var(--text-dim)] text-xs shrink-0 cursor-grab select-none"
      >
        └
      </span>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => updateSubtask(subtask.id, { done: !subtask.done })}
        className={`w-3 h-3 border border-[var(--accent)] shrink-0 flex items-center justify-center cursor-pointer transition-colors ${subtask.done ? 'bg-[var(--accent)] hover:opacity-60' : 'hover:bg-[var(--accent)]'}`}
        style={{ minWidth: '12px' }}
        aria-label={subtask.done ? 'Mark incomplete' : 'Mark complete'}
      >
        {subtask.done && <XIcon size={7} className="text-black" />}
      </button>
      <span className="text-xs flex-1 leading-tight">
        <span className={subtask.done ? 'struck opacity-40' : ''}>{subtask.title}</span>
      </span>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => deleteSubtask(subtask.id)}
        className="opacity-0 group-hover:opacity-100 text-[var(--text-dim)] hover:text-[var(--accent)] transition-opacity px-1 cursor-pointer flex items-center justify-center"
        aria-label="Delete subtask"
      >
        <XIcon size={10} />
      </button>
    </div>
  )
}
