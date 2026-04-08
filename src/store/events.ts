'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CalendarEvent } from '@/types'

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface EventStore {
  events: Record<string, CalendarEvent>
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void
  updateEvent: (id: string, patch: Partial<Omit<CalendarEvent, 'id'>>) => void
  deleteEvent: (id: string) => void
}

export const useEventStore = create<EventStore>()(
  persist(
    (set) => ({
      events: {},

      addEvent: (e) => {
        const id = generateId()
        set((state) => ({
          events: { ...state.events, [id]: { ...e, id } },
        }))
      },

      updateEvent: (id, patch) => {
        set((state) => ({
          events: {
            ...state.events,
            [id]: { ...state.events[id], ...patch },
          },
        }))
      },

      deleteEvent: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.events
          return { events: rest }
        })
      },
    }),
    {
      name: 'taskmanager-events',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
