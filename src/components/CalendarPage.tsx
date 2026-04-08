'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTaskStore } from '@/store/tasks'
import { useEventStore } from '@/store/events'
import EventModal from './EventModal'
import type { CalendarEvent } from '@/types'
import { toDayKey, isToday } from '@/lib/dates'

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]
const DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function buildGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Monday-based offset (Mon=0 … Sun=6)
  const firstDow = firstDay.getDay()
  const startOffset = (firstDow + 6) % 7

  const cells: Date[] = []

  // Leading days from previous month
  for (let i = startOffset; i > 0; i--) {
    cells.push(new Date(year, month, 1 - i))
  }
  // Days of this month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month, d))
  }
  // Trailing days to fill last row
  const remaining = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    cells.push(new Date(year, month + 1, i))
  }

  return cells
}

export default function CalendarPage() {
  const router = useRouter()
  const { tasks } = useTaskStore()
  const { events } = useEventStore()

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  // undefined = closed, null = create new, CalendarEvent = edit existing
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null | undefined>(undefined)
  const [newEventDate, setNewEventDate] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth])

  // Build per-day maps
  const tasksByDay = useMemo(() => {
    const map: Record<string, typeof tasks[string][]> = {}
    for (const task of Object.values(tasks)) {
      if (!task.dueDate) continue
      const key = task.dueDate
      if (!map[key]) map[key] = []
      map[key].push(task)
    }
    return map
  }, [tasks])

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const ev of Object.values(events)) {
      if (!ev.date) continue
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    }
    return map
  }, [events])

  function handleCellClick(dayKey: string) {
    setNewEventDate(dayKey)
    setModalEvent(null)
  }

  function toggleExpanded(dayKey: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(dayKey) ? next.delete(dayKey) : next.add(dayKey)
      return next
    })
  }

  const isCurrentMonth = (date: Date) => date.getMonth() === viewMonth

  return (
    <div className="px-6 py-6 max-w-[1600px] mx-auto">
      {/* Month navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={prevMonth}
          className="text-[var(--text-dim)] hover:text-[var(--accent)] text-xs tracking-widest cursor-pointer"
        >
          ← PREV
        </button>
        <span className="text-sm tracking-[0.2em] min-w-[200px] text-center">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="text-[var(--text-dim)] hover:text-[var(--accent)] text-xs tracking-widest cursor-pointer"
        >
          NEXT →
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW.map(d => (
          <div key={d} className="text-[9px] tracking-widest text-[var(--text-dim)] text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((date, i) => {
          const dayKey = toDayKey(date)
          const dayTasks = tasksByDay[dayKey] ?? []
          const dayEvents = eventsByDay[dayKey] ?? []
          const allChips = [...dayTasks.map(t => ({ type: 'task' as const, task: t })),
                           ...dayEvents.map(e => ({ type: 'event' as const, event: e }))]
          const isExp = expanded.has(dayKey)
          const LIMIT = 3
          const visibleChips = isExp ? allChips : allChips.slice(0, LIMIT)
          const overflow = allChips.length - LIMIT
          const inMonth = isCurrentMonth(date)
          const todayCell = isToday(date)

          return (
            <div
              key={i}
              onClick={() => handleCellClick(dayKey)}
              className={`min-h-[90px] border border-[var(--border-dim)] p-1 flex flex-col gap-0.5 cursor-pointer hover:border-[var(--accent)] ${
                inMonth ? '' : 'opacity-30'
              }`}
            >
              {/* Date number */}
              <div className={`text-[10px] leading-none mb-1 px-0.5 self-start ${
                todayCell
                  ? 'text-[var(--accent)] border border-[var(--accent)] px-1'
                  : 'text-[var(--text-dim)]'
              }`}>
                {date.getDate()}
              </div>

              {/* Chips */}
              {visibleChips.map((item, idx) => {
                if (item.type === 'task') {
                  const isDone = item.task.status === 'done'
                  return (
                    <button
                      key={`task-${item.task.id}`}
                      onClick={(e) => { e.stopPropagation(); router.push(`/edit/${item.task.id}`) }}
                      className={`w-full text-left text-[9px] px-1 py-0.5 border border-[var(--accent)] truncate cursor-pointer hover:bg-[var(--card-bg)] ${isDone ? 'opacity-40' : ''}`}
                    >
                      <span className={isDone ? 'struck' : ''}>{item.task.title}</span>
                    </button>
                  )
                } else {
                  return (
                    <button
                      key={`event-${item.event.id}`}
                      onClick={(e) => { e.stopPropagation(); setModalEvent(item.event) }}
                      className="w-full text-left text-[9px] px-1 py-0.5 border border-[var(--border-dim)] truncate cursor-pointer hover:border-[var(--accent)]"
                    >
                      {item.event.title}
                    </button>
                  )
                }
              })}

              {/* Overflow toggle */}
              {!isExp && overflow > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleExpanded(dayKey) }}
                  className="text-[9px] text-[var(--text-dim)] hover:text-[var(--accent)] text-left px-0.5 cursor-pointer"
                >
                  +{overflow} more
                </button>
              )}
              {isExp && allChips.length > LIMIT && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleExpanded(dayKey) }}
                  className="text-[9px] text-[var(--text-dim)] hover:text-[var(--accent)] text-left px-0.5 cursor-pointer"
                >
                  show less
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 border border-[var(--accent)]" />
          <span className="text-[9px] text-[var(--text-dim)] tracking-wider">TASK DUE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 border border-[var(--border-dim)]" />
          <span className="text-[9px] text-[var(--text-dim)] tracking-wider">EVENT</span>
        </div>
        <span className="text-[9px] text-[var(--text-dim)] tracking-wider ml-2 opacity-50">
          CLICK ANY CELL TO ADD AN EVENT
        </span>
      </div>

      {/* Modal */}
      {modalEvent !== undefined && (
        <EventModal
          event={modalEvent}
          defaultDate={newEventDate}
          onClose={() => setModalEvent(undefined)}
        />
      )}
    </div>
  )
}
