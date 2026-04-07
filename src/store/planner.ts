'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PlannerData, PlannerEntry } from '@/types'

interface PlannerStore {
  planner: PlannerData

  // Drag whole task to a day — removes task from all other days
  addTaskToDay: (dayKey: string, taskId: string) => void

  // Drag one subtask to a day — enforces each subtask on at most one day
  addSubtaskToDay: (dayKey: string, taskId: string, subtaskId: string, allSubtaskIds: string[]) => void

  // Remove an entire entry (task chip) from a day
  removeFromDay: (dayKey: string, taskId: string) => void

  // Remove one subtask from a chip (converts null→explicit; removes chip if empty)
  removeSubtaskFromDay: (dayKey: string, taskId: string, subtaskId: string, allSubtaskIds: string[]) => void

  // Move a planner chip to a different day
  moveEntryToDay: (fromDay: string, toDay: string, taskId: string, subtaskIds: string[] | null, allSubtaskIds: string[]) => void
}

/** Remove subtaskId from a PlannerEntry, converting null→explicit as needed. Returns null if entry should be dropped. */
function stripSubtask(entry: PlannerEntry, subtaskId: string, allSubtaskIds: string[]): PlannerEntry | null {
  const current = entry.subtaskIds === null ? allSubtaskIds : entry.subtaskIds
  const remaining = current.filter((id) => id !== subtaskId)
  if (remaining.length === 0) return null
  return { taskId: entry.taskId, subtaskIds: remaining }
}

export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set) => ({
      planner: {},

      addTaskToDay: (dayKey, taskId) => {
        set((state) => {
          const newPlanner: PlannerData = {}
          for (const key of Object.keys(state.planner)) {
            newPlanner[key] = state.planner[key].filter((e) => e.taskId !== taskId)
          }
          newPlanner[dayKey] = [
            ...(newPlanner[dayKey] ?? []).filter((e) => e.taskId !== taskId),
            { taskId, subtaskIds: null },
          ]
          return { planner: newPlanner }
        })
      },

      addSubtaskToDay: (dayKey, taskId, subtaskId, allSubtaskIds) => {
        set((state) => {
          const newPlanner: PlannerData = {}

          // Pass 1: remove subtaskId from every day except the target
          for (const key of Object.keys(state.planner)) {
            if (key === dayKey) continue
            newPlanner[key] = state.planner[key].flatMap((entry) => {
              if (entry.taskId !== taskId) return [entry]
              const updated = stripSubtask(entry, subtaskId, allSubtaskIds)
              return updated ? [updated] : []
            })
          }

          // Pass 2: handle target day
          const existing = (state.planner[dayKey] ?? []).find((e) => e.taskId === taskId)
          let targetEntry: PlannerEntry

          if (existing) {
            if (existing.subtaskIds === null) {
              // Already showing all subtasks — keep null, subtask removed from other days above
              targetEntry = existing
            } else if (existing.subtaskIds.includes(subtaskId)) {
              targetEntry = existing
            } else {
              targetEntry = { taskId, subtaskIds: [...existing.subtaskIds, subtaskId] }
            }
          } else {
            targetEntry = { taskId, subtaskIds: [subtaskId] }
          }

          newPlanner[dayKey] = [
            ...(newPlanner[dayKey] ?? (state.planner[dayKey] ?? []).filter((e) => e.taskId !== taskId)),
            targetEntry,
          ]

          return { planner: newPlanner }
        })
      },

      removeFromDay: (dayKey, taskId) => {
        set((state) => ({
          planner: {
            ...state.planner,
            [dayKey]: (state.planner[dayKey] ?? []).filter((e) => e.taskId !== taskId),
          },
        }))
      },

      removeSubtaskFromDay: (dayKey, taskId, subtaskId, allSubtaskIds) => {
        set((state) => {
          const entries = state.planner[dayKey] ?? []
          const newEntries = entries.flatMap((entry) => {
            if (entry.taskId !== taskId) return [entry]
            const updated = stripSubtask(entry, subtaskId, allSubtaskIds)
            return updated ? [updated] : []
          })
          return { planner: { ...state.planner, [dayKey]: newEntries } }
        })
      },

      moveEntryToDay: (fromDay, toDay, taskId, subtaskIds, allSubtaskIds) => {
        if (fromDay === toDay) return
        set((state) => {
          const newPlanner: PlannerData = {}

          for (const key of Object.keys(state.planner)) {
            if (key === fromDay) {
              // Remove the entry being moved
              newPlanner[key] = state.planner[key].filter((e) => e.taskId !== taskId)
            } else if (key === toDay) {
              newPlanner[key] = [...state.planner[key]] // handled below
            } else if (subtaskIds !== null) {
              // Strip the specific moved subtasks from other days
              newPlanner[key] = state.planner[key].flatMap((entry) => {
                if (entry.taskId !== taskId) return [entry]
                const currentIds = entry.subtaskIds === null ? allSubtaskIds : entry.subtaskIds
                const remaining = currentIds.filter((id) => !subtaskIds.includes(id))
                return remaining.length > 0 ? [{ taskId, subtaskIds: remaining }] : []
              })
            } else {
              // Moving whole task — remove all entries for this task from other days
              newPlanner[key] = state.planner[key].filter((e) => e.taskId !== taskId)
            }
          }

          // Merge onto target day
          if (!newPlanner[toDay]) newPlanner[toDay] = []
          const existingOnTarget = (state.planner[toDay] ?? []).find((e) => e.taskId === taskId)

          let targetEntry: PlannerEntry
          if (existingOnTarget) {
            if (subtaskIds === null || existingOnTarget.subtaskIds === null) {
              targetEntry = { taskId, subtaskIds: null }
            } else {
              const merged = [...new Set([...existingOnTarget.subtaskIds, ...subtaskIds])]
              targetEntry = { taskId, subtaskIds: merged }
            }
          } else {
            targetEntry = { taskId, subtaskIds }
          }

          // Replace or append on target day
          const targetIdx = newPlanner[toDay].findIndex((e) => e.taskId === taskId)
          if (targetIdx >= 0) {
            newPlanner[toDay][targetIdx] = targetEntry
          } else {
            newPlanner[toDay].push(targetEntry)
          }

          return { planner: newPlanner }
        })
      },
    }),
    {
      name: 'taskmanager-planner',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          // Migrate old format: { [dayKey]: string[] } → { [dayKey]: PlannerEntry[] }
          const old = persistedState as { planner?: Record<string, unknown[]> }
          const newPlanner: PlannerData = {}
          for (const dayKey of Object.keys(old.planner ?? {})) {
            const entries = old.planner![dayKey]
            if (Array.isArray(entries) && entries.length > 0 && typeof entries[0] === 'string') {
              newPlanner[dayKey] = (entries as string[]).map((taskId) => ({ taskId, subtaskIds: null }))
            } else {
              newPlanner[dayKey] = entries as PlannerEntry[]
            }
          }
          return { planner: newPlanner }
        }
        return persistedState as { planner: PlannerData }
      },
    }
  )
)
