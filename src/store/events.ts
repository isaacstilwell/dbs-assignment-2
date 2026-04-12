'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CalendarEvent } from '@/types'

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface EventStore {
  events: Record<string, CalendarEvent>
  addEvent: (e: Omit<CalendarEvent, 'id'>) => string
  updateEvent: (id: string, patch: Partial<Omit<CalendarEvent, 'id'>>) => void
  deleteEvent: (id: string) => void
  setEvents: (events: Record<string, CalendarEvent>) => void
  clearEventStore: () => void
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
        return id
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

      setEvents: (events) => set({ events }),
      clearEventStore: () => set({ events: {} }),
    }),
    {
      name: 'taskmanager-events',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
