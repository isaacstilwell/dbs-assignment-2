'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
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

type GCalEvent = { id: string; title: string; date: string; allDay: boolean; url: string }

// Full 7-col grid with leading/trailing days (xl only)
function buildGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells: Date[] = []
  for (let i = startOffset; i > 0; i--) cells.push(new Date(year, month, 1 - i))
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d))
  const remaining = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) cells.push(new Date(year, month + 1, i))
  return cells
}

// All dates in the given month that fall on dowIndex (0=Mon…6=Sun)
function buildDayColumn(year: number, month: number, dowIndex: number): Date[] {
  const lastDay = new Date(year, month + 1, 0).getDate()
  const result: Date[] = []
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d)
    if ((date.getDay() + 6) % 7 === dowIndex) result.push(date)
  }
  return result
}

// Month dropdown for non-xl views
function MonthDropdown({
  viewYear,
  viewMonth,
  setViewYear,
  setViewMonth,
}: {
  viewYear: number
  viewMonth: number
  setViewYear: (y: number) => void
  setViewMonth: (m: number) => void
}) {
  const thisYear = new Date().getFullYear()
  const options: { year: number; month: number }[] = []
  for (let y = thisYear - 2; y <= thisYear + 2; y++) {
    for (let m = 0; m < 12; m++) options.push({ year: y, month: m })
  }
  return (
    <select
      value={`${viewYear}-${viewMonth}`}
      onChange={(e) => {
        const [y, m] = e.target.value.split('-').map(Number)
        setViewYear(y)
        setViewMonth(m)
      }}
      className="bg-transparent text-sm tracking-[0.2em] border-none cursor-pointer text-center"
      style={{ colorScheme: 'dark' }}
    >
      {options.map(({ year, month }) => (
        <option key={`${year}-${month}`} value={`${year}-${month}`}>
          {MONTHS[month]} {year}
        </option>
      ))}
    </select>
  )
}

function CalendarCell({
  date,
  inMonth,
  dayTasks,
  dayEvents,
  dayGcalEvents,
  expanded,
  onToggleExpanded,
  onCellClick,
  onTaskClick,
  onEventClick,
}: {
  date: Date
  inMonth: boolean
  dayTasks: { id: string; title: string; status: string }[]
  dayEvents: CalendarEvent[]
  dayGcalEvents: GCalEvent[]
  expanded: boolean
  onToggleExpanded: () => void
  onCellClick: () => void
  onTaskClick: (id: string) => void
  onEventClick: (ev: CalendarEvent) => void
}) {
  const allChips = [
    ...dayTasks.map((t) => ({ type: 'task' as const, task: t })),
    ...dayEvents.map((e) => ({ type: 'event' as const, event: e })),
    ...dayGcalEvents.map((g) => ({ type: 'gcal' as const, gcal: g })),
  ]
  const LIMIT = 3
  const visible = expanded ? allChips : allChips.slice(0, LIMIT)
  const overflow = allChips.length - LIMIT
  const todayCell = isToday(date)

  return (
    <div
      onClick={onCellClick}
      className={`min-h-[60px] md:min-h-[75px] xl:min-h-[90px] border border-[var(--border-dim)] p-1 flex flex-col gap-0.5 cursor-pointer hover:border-[var(--accent)] ${
        inMonth ? '' : 'opacity-30'
      }`}
    >
      <div className={`text-[10px] leading-none mb-1 px-0.5 self-start ${
        todayCell ? 'text-[var(--accent)] border border-[var(--accent)] px-1' : 'text-[var(--text-dim)]'
      }`}>
        {date.getDate()}
      </div>

      {visible.map((item) =>
        item.type === 'task' ? (
          <button
            key={`task-${item.task.id}`}
            onClick={(e) => { e.stopPropagation(); onTaskClick(item.task.id) }}
            className={`w-full text-left text-[9px] px-1 py-0.5 border border-[var(--accent)] truncate cursor-pointer hover:bg-[var(--card-bg)] ${item.task.status === 'done' ? 'opacity-40' : ''}`}
          >
            <span className={item.task.status === 'done' ? 'struck' : ''}>{item.task.title}</span>
          </button>
        ) : item.type === 'event' ? (
          <button
            key={`event-${item.event.id}`}
            onClick={(e) => { e.stopPropagation(); onEventClick(item.event) }}
            className="w-full text-left text-[9px] px-1 py-0.5 border border-[var(--border-dim)] truncate cursor-pointer hover:border-[var(--accent)]"
          >
            {item.event.title}
          </button>
        ) : (
          <button
            key={`gcal-${item.gcal.id}`}
            onClick={(e) => {
              e.stopPropagation()
              if (item.gcal.url) window.open(item.gcal.url, '_blank', 'noopener,noreferrer')
            }}
            title={`Google Calendar: ${item.gcal.title}`}
            className="w-full text-left text-[9px] px-1 py-0.5 border border-dashed border-[var(--border-dim)] truncate cursor-pointer hover:border-[var(--accent)] opacity-75"
          >
            {item.gcal.title}
          </button>
        )
      )}

      {!expanded && overflow > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onToggleExpanded() }} className="text-[9px] text-[var(--text-dim)] hover:text-[var(--accent)] text-left px-0.5 cursor-pointer">
          +{overflow} more
        </button>
      )}
      {expanded && allChips.length > LIMIT && (
        <button onClick={(e) => { e.stopPropagation(); onToggleExpanded() }} className="text-[9px] text-[var(--text-dim)] hover:text-[var(--accent)] text-left px-0.5 cursor-pointer">
          show less
        </button>
      )}
    </div>
  )
}

export default function CalendarPage() {
  const router = useRouter()
  const { tasks } = useTaskStore()
  const { events } = useEventStore()

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  // dayOffset: index of the leftmost visible DOW column (0=Mon…6=Sun)
  const [dayOffset, setDayOffset] = useState(() => (today.getDay() + 6) % 7)
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null | undefined>(undefined)
  const [newEventDate, setNewEventDate] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Google Calendar state
  const [gcalEvents, setGcalEvents] = useState<GCalEvent[]>([])
  const [gcalConnected, setGcalConnected] = useState<boolean | null>(null)
  const [gcalLoading, setGcalLoading] = useState(false)

  // xl: full grid with leading/trailing days
  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  const tasksByDay = useMemo(() => {
    const map: Record<string, typeof tasks[string][]> = {}
    for (const task of Object.values(tasks)) {
      if (!task.dueDate) continue
      if (!map[task.dueDate]) map[task.dueDate] = []
      map[task.dueDate].push(task)
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

  const gcalByDate = useMemo(() => {
    const map: Record<string, GCalEvent[]> = {}
    for (const ev of gcalEvents) {
      if (!ev.date) continue
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    }
    return map
  }, [gcalEvents])

  const fetchGcalEvents = useCallback(async (year: number, month: number) => {
    setGcalLoading(true)
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    try {
      const res = await fetch(`/api/google-calendar/events?from=${from}&to=${to}`)
      if (res.status === 404) {
        setGcalConnected(false)
        setGcalEvents([])
      } else if (res.ok) {
        const data = await res.json()
        setGcalConnected(true)
        setGcalEvents(data.events ?? [])
      }
    } catch {
      // network error — leave state as-is
    } finally {
      setGcalLoading(false)
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    fetchGcalEvents(viewYear, viewMonth)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch when month changes (only if already connected)
  useEffect(() => {
    if (gcalConnected) {
      fetchGcalEvents(viewYear, viewMonth)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth])

  async function handleDisconnect() {
    await fetch('/api/google-calendar/disconnect', { method: 'DELETE' })
    setGcalConnected(false)
    setGcalEvents([])
  }

  function handleCellClick(dayKey: string) {
    setNewEventDate(dayKey)
    setModalEvent(null)
  }

  function toggleExpanded(dayKey: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(dayKey) ? next.delete(dayKey) : next.add(dayKey)
      return next
    })
  }

  function cellProps(date: Date, inMonth = true) {
    const dayKey = toDayKey(date)
    return {
      date,
      inMonth,
      dayTasks: tasksByDay[dayKey] ?? [],
      dayEvents: eventsByDay[dayKey] ?? [],
      dayGcalEvents: gcalByDate[dayKey] ?? [],
      expanded: expanded.has(dayKey),
      onToggleExpanded: () => toggleExpanded(dayKey),
      onCellClick: () => handleCellClick(dayKey),
      onTaskClick: (id: string) => router.push(`/edit/${id}`),
      onEventClick: (ev: CalendarEvent) => setModalEvent(ev),
    }
  }

  // Renders a single DOW column (header + stacked cells)
  function DowColumn({ dowIndex }: { dowIndex: number }) {
    const dates = buildDayColumn(viewYear, viewMonth, dowIndex)
    return (
      <div className="flex flex-col gap-1">
        {dates.map((date) => (
          <CalendarCell key={toDayKey(date)} {...cellProps(date)} />
        ))}
      </div>
    )
  }

  // Nav bar for non-xl views: DOW arrows + month dropdown
  function SubNav() {
    return (
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setDayOffset((d) => (d + 6) % 7)}
          className="text-[var(--text-dim)] hover:text-[var(--accent)] text-xs tracking-widest cursor-pointer"
        >
          ← PREV
        </button>
        <div className="flex-1 text-center">
          <MonthDropdown
            viewYear={viewYear}
            viewMonth={viewMonth}
            setViewYear={setViewYear}
            setViewMonth={setViewMonth}
          />
        </div>
        <button
          onClick={() => setDayOffset((d) => (d + 1) % 7)}
          className="text-[var(--text-dim)] hover:text-[var(--accent)] text-xs tracking-widest cursor-pointer"
        >
          NEXT →
        </button>
      </div>
    )
  }

  // Google Calendar connection controls
  function GcalControls() {
    if (gcalConnected === null) return null
    if (gcalConnected === false) {
      return (
        <a
          href="/api/google-calendar/auth"
          className="text-[var(--accent)] text-xs tracking-widest border border-[var(--accent)] px-2 py-0.5 hover:underline cursor-pointer"
        >
          + CONNECT GOOGLE CALENDAR
        </a>
      )
    }
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => fetchGcalEvents(viewYear, viewMonth)}
          disabled={gcalLoading}
          className="text-[var(--text-dim)] text-xs tracking-widest hover:text-[var(--accent)] cursor-pointer disabled:opacity-40"
        >
          {gcalLoading ? '...' : '↺ REFRESH'}
        </button>
        <button
          onClick={handleDisconnect}
          className="text-[var(--text-dim)] text-xs tracking-widest hover:text-[var(--accent)] cursor-pointer"
        >
          DISCONNECT GCAL
        </button>
      </div>
    )
  }

  return (
    <div className="px-6 py-6 max-w-[1600px] mx-auto">

      {/* xl: prev/next month arrows + GCal controls */}
      <div className="hidden xl:flex items-center gap-4 mb-6">
        <button onClick={prevMonth} className="text-[var(--text-dim)] hover:text-[var(--accent)] text-xs tracking-widest cursor-pointer">
          ← PREV
        </button>
        <span className="text-sm tracking-[0.2em] min-w-[200px] text-center">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="text-[var(--text-dim)] hover:text-[var(--accent)] text-xs tracking-widest cursor-pointer">
          NEXT →
        </button>
        <div className="ml-auto">
          <GcalControls />
        </div>
      </div>

      {/* Mobile: 1 DOW column */}
      <div className="md:hidden">
        <SubNav />
        <div className="flex justify-end mb-3">
          <GcalControls />
        </div>
        <div className="text-[9px] tracking-widest text-[var(--text-dim)] text-center py-1 mb-1">
          {DOW[dayOffset]}
        </div>
        <DowColumn dowIndex={dayOffset} />
      </div>

      {/* md: 3 DOW columns */}
      <div className="hidden md:block lg:hidden">
        <SubNav />
        <div className="flex justify-end mb-3">
          <GcalControls />
        </div>
        <div className="grid grid-cols-3 gap-1 mb-1">
          {[0, 1, 2].map((offset) => (
            <div key={offset} className="text-[9px] tracking-widest text-[var(--text-dim)] text-center py-1">
              {DOW[(dayOffset + offset) % 7]}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 items-start">
          {[0, 1, 2].map((offset) => (
            <DowColumn key={offset} dowIndex={(dayOffset + offset) % 7} />
          ))}
        </div>
      </div>

      {/* lg: 5 DOW columns */}
      <div className="hidden lg:block xl:hidden">
        <SubNav />
        <div className="flex justify-end mb-3">
          <GcalControls />
        </div>
        <div className="grid grid-cols-5 gap-1 mb-1">
          {[0, 1, 2, 3, 4].map((offset) => (
            <div key={offset} className="text-[9px] tracking-widest text-[var(--text-dim)] text-center py-1">
              {DOW[(dayOffset + offset) % 7]}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-1 items-start">
          {[0, 1, 2, 3, 4].map((offset) => (
            <DowColumn key={offset} dowIndex={(dayOffset + offset) % 7} />
          ))}
        </div>
      </div>

      {/* xl: full 7-col calendar with DOW headers + leading/trailing days */}
      <div className="hidden xl:block">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DOW.map((d) => (
            <div key={d} className="text-[9px] tracking-widest text-[var(--text-dim)] text-center py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((date, i) => (
            <CalendarCell
              key={i}
              {...cellProps(date, date.getMonth() === viewMonth)}
            />
          ))}
        </div>
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
        {gcalConnected && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 border border-dashed border-[var(--border-dim)] opacity-75" />
            <span className="text-[9px] text-[var(--text-dim)] tracking-wider">GOOGLE CALENDAR</span>
          </div>
        )}
        <span className="hidden md:inline text-[9px] text-[var(--text-dim)] tracking-wider ml-2 opacity-50">
          CLICK ANY CELL TO ADD AN EVENT
        </span>
      </div>

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
