'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Task, Subtask, TaskStatus } from '@/types'

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface TaskStore {
  tasks: Record<string, Task>
  subtasks: Record<string, Subtask>

  addTask: (data: { title: string; status: TaskStatus; dueDate: string | null; notes: string }) => string
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt' | 'subtaskIds'>>) => void
  deleteTask: (id: string) => void

  addSubtask: (parentId: string, title: string) => string
  updateSubtask: (id: string, patch: Partial<Pick<Subtask, 'title' | 'done'>>) => void
  deleteSubtask: (id: string) => void
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: {},
      subtasks: {},

      addTask: (data) => {
        const id = generateId()
        set((state) => ({
          tasks: {
            ...state.tasks,
            [id]: {
              id,
              title: data.title,
              status: data.status,
              dueDate: data.dueDate,
              notes: data.notes,
              subtaskIds: [],
              createdAt: new Date().toISOString(),
            },
          },
        }))
        return id
      },

      updateTask: (id, patch) => {
        set((state) => {
          const task = state.tasks[id]
          if (!task) return state
          return {
            tasks: {
              ...state.tasks,
              [id]: { ...task, ...patch },
            },
          }
        })
      },

      deleteTask: (id) => {
        set((state) => {
          const task = state.tasks[id]
          if (!task) return state

          // Remove subtasks belonging to this task
          const newSubtasks = { ...state.subtasks }
          for (const sid of task.subtaskIds) {
            delete newSubtasks[sid]
          }

          const newTasks = { ...state.tasks }
          delete newTasks[id]

          return { tasks: newTasks, subtasks: newSubtasks }
        })
      },

      addSubtask: (parentId, title) => {
        const id = generateId()
        set((state) => {
          const parent = state.tasks[parentId]
          if (!parent) return state
          return {
            subtasks: {
              ...state.subtasks,
              [id]: { id, title, done: false, parentId },
            },
            tasks: {
              ...state.tasks,
              [parentId]: {
                ...parent,
                subtaskIds: [...parent.subtaskIds, id],
              },
            },
          }
        })
        return id
      },

      updateSubtask: (id, patch) => {
        set((state) => {
          const sub = state.subtasks[id]
          if (!sub) return state
          return {
            subtasks: {
              ...state.subtasks,
              [id]: { ...sub, ...patch },
            },
          }
        })
      },

      deleteSubtask: (id) => {
        set((state) => {
          const sub = state.subtasks[id]
          if (!sub) return state

          const parent = state.tasks[sub.parentId]
          const newSubtasks = { ...state.subtasks }
          delete newSubtasks[id]

          const newTasks = parent
            ? {
                ...state.tasks,
                [sub.parentId]: {
                  ...parent,
                  subtaskIds: parent.subtaskIds.filter((s) => s !== id),
                },
              }
            : state.tasks

          return { subtasks: newSubtasks, tasks: newTasks }
        })
      },
    }),
    {
      name: 'taskmanager-tasks',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
