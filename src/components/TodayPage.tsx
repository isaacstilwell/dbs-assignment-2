'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTaskStore } from '@/store/tasks'
import { usePlannerStore } from '@/store/planner'
import { useEventStore } from '@/store/events'
import EventModal from './EventModal'
import { toDayKey } from '@/lib/dates'
import { XIcon } from './icons'
import type { CalendarEvent } from '@/types'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}


export default function TodayPage() {
  const router = useRouter()
  const { tasks, subtasks, updateTask, updateSubtask } = useTaskStore()
  const { planner } = usePlannerStore()
  const { events } = useEventStore()

  const today = new Date()
  const todayKey = toDayKey(today)
  const dateLabel = `${DAYS[today.getDay()]} ${String(today.getDate()).padStart(2, '0')} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`

  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [tab, setTab] = useState<'scheduled' | 'events'>('scheduled')
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null | undefined>(undefined)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  function handleToggleTimer() {
    if (running) {
      setRunning(false)
      setElapsed(0)
    } else {
      setElapsed(0)
      setRunning(true)
    }
  }

  const entries = planner[todayKey] ?? []
  const todayEvents = Object.values(events).filter((e) => e.date === todayKey)
  const isEmpty = entries.length === 0 && todayEvents.length === 0

  return (
    <div className="px-6 py-6 max-w-[900px] mx-auto">
      {/* Header row: date + timer */}
      <div className="flex items-center justify-between border-b border-[var(--border-dim)] pb-4 mb-6">
        <span className="text-sm tracking-[0.25em]">{dateLabel}</span>
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleTimer}
            className={`text-[10px] tracking-widest px-3 py-1.5 border cursor-pointer ${
              running
                ? 'border-[var(--accent)] text-[var(--accent)] hover:opacity-60'
                : 'border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--card-bg)]'
            }`}
          >
            {running ? 'STOP' : 'START SESSION'}
          </button>
          <span className="text-sm tracking-widest text-[var(--text-dim)] font-mono tabular-nums min-w-[80px] text-right">
            {formatElapsed(elapsed)}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-6 border-b border-[var(--border-dim)] mb-6">
        {(['scheduled', 'events'] as const).map((t) => {
          const count = t === 'scheduled' ? entries.length : todayEvents.length
          const active = tab === t
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[10px] tracking-widest pb-2 cursor-pointer border-b-2 -mb-px ${
                active
                  ? 'text-[var(--accent)] border-[var(--accent)]'
                  : 'text-[var(--text-dim)] border-transparent hover:text-[var(--accent)]'
              }`}
            >
              {t.toUpperCase()}
              {count > 0 && <span className="ml-1.5 opacity-50">{count}</span>}
            </button>
          )
        })}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <span className="text-xs tracking-[0.3em] opacity-30">NOTHING SCHEDULED TODAY</span>
          <button
            onClick={() => router.push('/')}
            className="text-[10px] tracking-widest text-[var(--text-dim)] hover:text-[var(--accent)] border border-[var(--border-dim)] hover:border-[var(--accent)] px-3 py-1.5 cursor-pointer"
          >
            OPEN PLANNER →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Tasks tab */}
          {tab === 'scheduled' && (
            <div>
              <div className="flex flex-col">
                {entries.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-12">
                    <span className="text-xs tracking-[0.3em] opacity-30">NO TASKS SCHEDULED</span>
                    <button
                      onClick={() => router.push('/')}
                      className="text-[10px] tracking-widest text-[var(--text-dim)] hover:text-[var(--accent)] border border-[var(--border-dim)] hover:border-[var(--accent)] px-3 py-1.5 cursor-pointer"
                    >
                      OPEN PLANNER →
                    </button>
                  </div>
                ) : entries.map((entry) => {
                  const task = tasks[entry.taskId]
                  if (!task) return null
                  const isDone = task.status === 'done'

                  const displaySubtasks = (entry.subtaskIds === null ? task.subtaskIds : entry.subtaskIds)
                    .map((id) => subtasks[id])
                    .filter(Boolean)

                  return (
                    <div
                      key={entry.taskId}
                      className="flex flex-col border-b border-[var(--border-dim)] py-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateTask(task.id, { status: isDone ? 'todo' : 'done' })}
                          className={`w-4 h-4 border border-[var(--accent)] shrink-0 flex items-center justify-center cursor-pointer ${
                            isDone ? 'bg-[var(--accent)] hover:opacity-60' : 'hover:bg-[var(--card-bg)]'
                          }`}
                          style={{ minWidth: '16px' }}
                          aria-label={isDone ? 'Mark incomplete' : 'Mark done'}
                        >
                          {isDone && <XIcon size={9} className="text-black" />}
                        </button>
                        <span className={`flex-1 text-sm leading-snug ${isDone ? 'opacity-40' : ''}`}>
                          <span className={isDone ? 'struck' : ''}>{task.title}</span>
                        </span>
                        <button
                          onClick={() => router.push(`/edit/${task.id}`)}
                          className="opacity-0 group-hover:opacity-100 text-[10px] tracking-wider text-[var(--text-dim)] hover:text-[var(--accent)] cursor-pointer"
                        >
                          EDIT
                        </button>
                      </div>

                      {displaySubtasks.map((sub) => {
                        const subDone = sub.done
                        return (
                          <div key={sub.id} className="flex items-center gap-3 mt-1.5 pl-7">
                            <button
                              onClick={() => updateSubtask(sub.id, { done: !subDone })}
                              className={`w-3 h-3 border border-[var(--accent)] shrink-0 flex items-center justify-center cursor-pointer ${
                                subDone ? 'bg-[var(--accent)] hover:opacity-60' : 'hover:bg-[var(--card-bg)]'
                              }`}
                              style={{ minWidth: '12px' }}
                              aria-label={subDone ? 'Mark incomplete' : 'Mark complete'}
                            >
                              {subDone && <XIcon size={7} className="text-black" />}
                            </button>
                            <span className="text-[var(--text-dim)] text-xs shrink-0">└</span>
                            <span className={`text-xs leading-tight ${subDone ? 'opacity-40' : 'opacity-70'}`}>
                              <span className={subDone ? 'struck' : ''}>{sub.title}</span>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Events tab */}
          {tab === 'events' && (
            <div className="flex flex-col">
              {todayEvents.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <span className="text-xs tracking-[0.3em] opacity-30">NO EVENTS TODAY</span>
                  <button
                    onClick={() => router.push('/calendar')}
                    className="text-[10px] tracking-widest text-[var(--text-dim)] hover:text-[var(--accent)] border border-[var(--border-dim)] hover:border-[var(--accent)] px-3 py-1.5 cursor-pointer"
                  >
                    OPEN CALENDAR →
                  </button>
                </div>
              ) : todayEvents.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setModalEvent(ev)}
                  className="flex flex-col text-left border-b border-[var(--border-dim)] py-3 hover:bg-[var(--card-bg)] px-1 cursor-pointer"
                >
                  <span className="text-sm">{ev.title}</span>
                  {ev.notes && (
                    <span className="text-xs opacity-40 mt-0.5 leading-snug">{ev.notes}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end">
            <button
              onClick={() => router.push('/')}
              className="text-[10px] tracking-widest text-[var(--text-dim)] hover:text-[var(--accent)] cursor-pointer"
            >
              OPEN PLANNER →
            </button>
          </div>
        </div>
      )}

      {modalEvent !== undefined && (
        <EventModal
          event={modalEvent}
          onClose={() => setModalEvent(undefined)}
        />
      )}
    </div>
  )
}
