'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PlannerData } from '@/types'

interface PlannerStore {
  planner: PlannerData

  addToDay: (dayKey: string, taskId: string) => void
  removeFromDay: (dayKey: string, taskId: string) => void
  moveWithinDay: (dayKey: string, fromIndex: number, toIndex: number) => void
  moveBetweenDays: (fromDay: string, toDay: string, taskId: string) => void
}

export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set) => ({
      planner: {},

      addToDay: (dayKey, taskId) => {
        set((state) => {
          const existing = state.planner[dayKey] ?? []
          // Don't add duplicates
          if (existing.includes(taskId)) return state
          return {
            planner: {
              ...state.planner,
              [dayKey]: [...existing, taskId],
            },
          }
        })
      },

      removeFromDay: (dayKey, taskId) => {
        set((state) => {
          const existing = state.planner[dayKey] ?? []
          return {
            planner: {
              ...state.planner,
              [dayKey]: existing.filter((id) => id !== taskId),
            },
          }
        })
      },

      moveWithinDay: (dayKey, fromIndex, toIndex) => {
        set((state) => {
          const items = [...(state.planner[dayKey] ?? [])]
          const [moved] = items.splice(fromIndex, 1)
          items.splice(toIndex, 0, moved)
          return {
            planner: { ...state.planner, [dayKey]: items },
          }
        })
      },

      moveBetweenDays: (fromDay, toDay, taskId) => {
        set((state) => {
          const fromItems = (state.planner[fromDay] ?? []).filter((id) => id !== taskId)
          const toItems = [...(state.planner[toDay] ?? [])]
          if (!toItems.includes(taskId)) toItems.push(taskId)
          return {
            planner: {
              ...state.planner,
              [fromDay]: fromItems,
              [toDay]: toItems,
            },
          }
        })
      },
    }),
    {
      name: 'taskmanager-planner',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
