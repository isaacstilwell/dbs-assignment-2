'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import TaskDatabase from '@/components/TaskDatabase'
import WeeklyPlanner from '@/components/WeeklyPlanner'
import TaskModal from '@/components/TaskModal'
import { useTaskStore } from '@/store/tasks'
import { usePlannerStore } from '@/store/planner'
import type { Task, TaskStatus } from '@/types'

interface TaskManagerPageProps {
  initialModal?: 'new' | string // 'new' = create, string = task ID to edit
}

export default function TaskManagerPage({ initialModal }: TaskManagerPageProps) {
  const router = useRouter()
  const { tasks, updateTask } = useTaskStore()
  const { addTaskToDay, addSubtaskToDay, moveEntryToDay, removeFromDay } = usePlannerStore()

  const [modalTask, setModalTask] = useState<Task | null | undefined>(
    initialModal === 'new' ? null : undefined
  )

  // Resolve task ID → Task object on mount (after Zustand localStorage hydration)
  useEffect(() => {
    if (initialModal && initialModal !== 'new') {
      const task = useTaskStore.getState().tasks[initialModal]
      if (task) setModalTask(task)
    }
  }, [initialModal])

  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const openCreate = useCallback(() => router.push('/new'), [router])
  const openEdit = useCallback((task: Task) => router.push(`/edit/${task.id}`), [router])
  const openEditById = useCallback((taskId: string) => router.push(`/edit/${taskId}`), [router])
  const closeModal = useCallback(() => router.push('/'), [router])

  function handleDragStart(event: DragStartEvent) {
    const { data } = event.active
    if (data.current?.type === 'task') {
      setActiveTask(data.current.task as Task)
    } else if (data.current?.type === 'planner-chip') {
      const t = tasks[data.current.taskId as string]
      setActiveTask(t ?? null)
    } else if (data.current?.type === 'subtask') {
      const t = tasks[data.current.taskId as string]
      setActiveTask(t ?? null)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    // ── Task card dropped ──
    if (activeData?.type === 'task') {
      const taskId = active.id as string
      const task = tasks[taskId]
      if (!task) return

      if (overData?.type === 'day') {
        addTaskToDay(overData.dayKey as string, taskId)
        return
      }

      let targetStatus: TaskStatus | null = null
      if (overData?.type === 'column') {
        targetStatus = overData.status as TaskStatus
      } else if (overData?.type === 'task') {
        targetStatus = (overData.task as Task).status
      }

      if (targetStatus && targetStatus !== task.status) {
        updateTask(taskId, { status: targetStatus })
      }
      return
    }

    // ── Subtask dragged from database ──
    if (activeData?.type === 'subtask') {
      const { subtaskId, taskId } = activeData as { subtaskId: string; taskId: string }
      if (overData?.type === 'day') {
        addSubtaskToDay(
          overData.dayKey as string,
          taskId,
          subtaskId,
          tasks[taskId]?.subtaskIds ?? []
        )
      }
      return
    }

    // ── Planner chip moved ──
    if (activeData?.type === 'planner-chip') {
      const taskId = activeData.taskId as string
      const fromDay = activeData.dayKey as string
      const chipSubtaskIds = activeData.subtaskIds as string[] | null

      if (overData?.type === 'day') {
        const toDay = overData.dayKey as string
        if (toDay !== fromDay) {
          moveEntryToDay(fromDay, toDay, taskId, chipSubtaskIds, tasks[taskId]?.subtaskIds ?? [])
        }
        return
      }

      if (overData?.type === 'planner-chip') {
        const toDay = overData.dayKey as string
        if (toDay !== fromDay) {
          moveEntryToDay(fromDay, toDay, taskId, chipSubtaskIds, tasks[taskId]?.subtaskIds ?? [])
        }
        return
      }

      if (overData?.type === 'column') {
        removeFromDay(fromDay, taskId)
        updateTask(taskId, { status: overData.status as TaskStatus })
      } else if (overData?.type === 'task') {
        removeFromDay(fromDay, taskId)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen px-6 py-6 flex flex-col gap-10 max-w-[1600px] mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b-2 border-[var(--border)] pb-4">
          <span className="text-sm tracking-[0.3em]">TASK LIST</span>
          <button
            onClick={openCreate}
            className="text-[10px] tracking-widest px-3 py-1.5 border border-[var(--accent)] text-[var(--accent)] cursor-pointer hover:bg-[var(--card-bg)] hover:underline hover:shadow-[0_0_12px_rgba(110,204,216,0.4)]"
          >
            + NEW TASK
          </button>
        </div>

        {/* Database */}
        <TaskDatabase onEdit={openEdit} />

        {/* Divider */}
        <div className="border-t border-[var(--border-dim)]" />

        {/* Planner */}
        <WeeklyPlanner onEdit={openEdit} onEditById={openEditById} />
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeTask && (
          <div className="border border-[var(--accent-bright)] bg-[var(--card-bg)] px-3 py-2 text-sm shadow-[0_0_16px_rgba(109,189,175,0.5)] opacity-90 pointer-events-none">
            {activeTask.title}
          </div>
        )}
      </DragOverlay>

      {/* Modal */}
      {modalTask !== undefined && (
        <TaskModal task={modalTask} onClose={closeModal} />
      )}
    </DndContext>
  )
}
