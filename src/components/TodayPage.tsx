'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore } from '@/store/tasks'
import { usePlannerStore } from '@/store/planner'
import { useEventStore } from '@/store/events'
import EventModal from './EventModal'
import { toDayKey, formatDueDate } from '@/lib/dates'
import { XIcon, ArrowRightIcon } from './icons'
import TaskModal from './TaskModal'
import type { Task, CalendarEvent } from '@/types'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Expanded card for DOING tasks ────────────────────────────────────────────

function DoingCard({ task }: { task: Task }) {
  const { subtasks, updateTask, updateSubtask } = useTaskStore()
  const taskSubtasks = task.subtaskIds.map((id) => subtasks[id]).filter(Boolean)
  const doneCount = taskSubtasks.filter((s) => s.done).length

  return (
    <div className="border border-[var(--border)] bg-[var(--card-bg)] p-4 flex flex-col gap-3">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm leading-snug flex-1">{task.title}</span>
        <div className="flex flex-wrap gap-1 shrink-0">
          <button
            onClick={() => updateTask(task.id, { status: 'todo' })}
            className="text-[10px] tracking-wider text-[var(--text-dim)] hover:text-[var(--accent)] border border-[var(--border-dim)] hover:border-[var(--accent)] px-2 py-1 cursor-pointer"
          >
            DO LATER
          </button>
          <button
            onClick={() => updateTask(task.id, { status: 'done' })}
            className="text-[10px] tracking-wider text-[var(--text-dim)] hover:text-[var(--accent)] border border-[var(--border-dim)] hover:border-[var(--accent)] px-2 py-1 cursor-pointer"
          >
            DONE
          </button>
        </div>
      </div>

      {/* Notes */}
      {task.notes && (
        <p className="text-xs opacity-50 leading-relaxed border-l border-[var(--border-dim)] pl-3">
          {task.notes}
        </p>
      )}

      {/* Subtasks */}
      {taskSubtasks.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-[var(--border-dim)] pt-3">
          <span className="text-[9px] tracking-widest opacity-40 mb-1">
            SUBTASKS {doneCount}/{taskSubtasks.length}
          </span>
          {taskSubtasks.map((sub) => (
            <div key={sub.id} className="flex items-center gap-2">
              <button
                onClick={() => updateSubtask(sub.id, { done: !sub.done })}
                className={`w-3 h-3 border border-[var(--accent)] shrink-0 flex items-center justify-center cursor-pointer ${
                  sub.done ? 'bg-[var(--accent)] hover:opacity-60' : 'hover:bg-[var(--card-bg)]'
                }`}
                style={{ minWidth: '12px' }}
              >
                {sub.done && <XIcon size={7} className="text-black" />}
              </button>
              <span className="text-[var(--text-dim)] text-[10px] shrink-0">└</span>
              <span className={`text-xs leading-tight ${sub.done ? 'opacity-40' : 'opacity-70'}`}>
                <span className={sub.done ? 'struck' : ''}>{sub.title}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Due date */}
      {task.dueDate && (
        <span className="text-[10px] opacity-30 tracking-wider">
          DUE {formatDueDate(task.dueDate)}
        </span>
      )}
    </div>
  )
}

// ── Draggable TODO row ────────────────────────────────────────────────────────

function TodoRow({ task, onMoveToDoing }: { task: Task; onMoveToDoing: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'todo-row', taskId: task.id },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-3 py-2.5 border-b border-[var(--border-dim)] group"
    >
      <span
        {...attributes}
        {...listeners}
        className="hidden md:inline text-[var(--text-dim)] text-base shrink-0 select-none cursor-grab leading-none"
      >
        ⠿
      </span>
      <span className="flex-1 text-xs leading-snug">{task.title}</span>
      {task.dueDate && (
        <span className="text-[10px] opacity-30 shrink-0">{formatDueDate(task.dueDate)}</span>
      )}
      <button
        onClick={onMoveToDoing}
        className="md:hidden flex items-center gap-1.5 text-[9px] tracking-wider px-2 py-1 border border-[var(--border-dim)] text-[var(--text-dim)] hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer shrink-0"
      >
        <ArrowRightIcon size={9} />
        DOING
      </button>
    </div>
  )
}

// ── Droppable DOING zone ──────────────────────────────────────────────────────

function DoingZone({ doingTasks }: { doingTasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'doing-zone' })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] flex flex-col gap-3 p-4 border-2 ${
        isOver
          ? 'border-[var(--accent)] bg-[var(--card-bg)]'
          : 'border-dashed border-[var(--border-dim)]'
      }`}
    >
      {doingTasks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-6">
          <span className="text-[10px] tracking-widest opacity-20">DRAG TASKS HERE TO START WORKING</span>
        </div>
      ) : (
        doingTasks.map((task) => <DoingCard key={task.id} task={task} />)
      )}
    </div>
  )
}

// ── Session view ──────────────────────────────────────────────────────────────

function SessionView({ todayTaskIds }: { todayTaskIds: Set<string> }) {
  const { tasks, updateTask } = useTaskStore()

  const doingTasks = Object.values(tasks).filter((t) => t.status === 'doing')
  const todoTasks = Object.values(tasks).filter(
    (t) => t.status === 'todo' && todayTaskIds.has(t.id)
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over?.id === 'doing-zone') {
      updateTask(active.id as string, { status: 'doing' })
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-6">
        {/* DOING section */}
        <div>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-[10px] tracking-[0.2em] opacity-50 shrink-0">DOING</span>
            <div className="flex-1 border-t border-[var(--border-dim)]" />
            {doingTasks.length > 0 && (
              <span className="text-[9px] opacity-30">{doingTasks.length} IN PROGRESS</span>
            )}
          </div>
          <DoingZone doingTasks={doingTasks} />
        </div>

        {/* TODO section */}
        {todoTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-[10px] tracking-[0.2em] opacity-50 shrink-0">TO DO</span>
              <div className="flex-1 border-t border-[var(--border-dim)]" />
              <span className="text-[9px] opacity-30">{todoTasks.length} REMAINING</span>
            </div>
            <div className="flex flex-col">
              {todoTasks.map((task) => (
                <TodoRow key={task.id} task={task} onMoveToDoing={() => updateTask(task.id, { status: 'doing' })} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DndContext>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TodayPage({ initialModal }: { initialModal?: string }) {
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
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined)

  useEffect(() => {
    if (initialModal) {
      const task = useTaskStore.getState().tasks[initialModal]
      if (task) setModalTask(task)
    }
  }, [initialModal])

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-dim)] pb-4 mb-6">
        <span className="text-sm tracking-[0.25em]">{dateLabel}</span>
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleTimer}
            className="text-[10px] tracking-widest px-3 py-1.5 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--card-bg)] cursor-pointer"
          >
            {running ? 'STOP SESSION' : 'START SESSION'}
          </button>
          <span className="text-sm tracking-widest text-[var(--text-dim)] font-mono tabular-nums min-w-[80px] text-right">
            {formatElapsed(elapsed)}
          </span>
        </div>
      </div>

      {/* Session mode */}
      {running ? (
        <SessionView todayTaskIds={new Set(entries.map((e) => e.taskId))} />
      ) : (
        <>
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
              {/* Scheduled tab */}
              {tab === 'scheduled' && (
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
                      <div key={entry.taskId} className="flex flex-col border-b border-[var(--border-dim)] py-3 group">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateTask(task.id, { status: isDone ? 'todo' : 'done' })}
                            className={`w-4 h-4 border border-[var(--accent)] shrink-0 flex items-center justify-center cursor-pointer ${
                              isDone ? 'bg-[var(--accent)] hover:opacity-60' : 'hover:bg-[var(--card-bg)]'
                            }`}
                            style={{ minWidth: '16px' }}
                          >
                            {isDone && <XIcon size={9} className="text-black" />}
                          </button>
                          <span className={`flex-1 text-sm leading-snug ${isDone ? 'opacity-40' : ''}`}>
                            <span className={isDone ? 'struck' : ''}>{task.title}</span>
                          </span>
                          <button
                            onClick={() => router.push(`/today/edit/${task.id}`)}
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
        </>
      )}

      {modalEvent !== undefined && (
        <EventModal
          event={modalEvent}
          onClose={() => setModalEvent(undefined)}
        />
      )}

      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          onClose={() => { setModalTask(undefined); router.push('/today') }}
        />
      )}
    </div>
  )
}
