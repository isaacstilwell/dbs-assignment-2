'use client'

import { useState, useEffect, useRef } from 'react'
import { useEventStore } from '@/store/events'
import type { CalendarEvent } from '@/types'

interface EventModalProps {
  event: CalendarEvent | null  // null = create mode
  defaultDate?: string
  onClose: () => void
}

export default function EventModal({ event, defaultDate, onClose }: EventModalProps) {
  const { addEvent, updateEvent, deleteEvent } = useEventStore()

  const [title, setTitle] = useState(event?.title ?? '')
  const [date, setDate] = useState(event?.date ?? defaultDate ?? '')
  const [notes, setNotes] = useState(event?.notes ?? '')

  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleSave() {
    if (!title.trim()) return
    if (event) {
      updateEvent(event.id, { title: title.trim(), date, notes })
    } else {
      addEvent({ title: title.trim(), date, notes })
    }
    onClose()
  }

  function handleDelete() {
    if (!event) return
    deleteEvent(event.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md mx-4 md:mx-auto border border-[var(--border)] bg-[var(--bg)]"
        style={{ backgroundColor: '#050f0e' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <span className="text-xs tracking-widest opacity-70">
            {event ? 'EDIT EVENT' : 'NEW EVENT'}
          </span>
          <button
            onClick={onClose}
            className="text-[var(--text-dim)] hover:text-[var(--accent)] leading-none cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest opacity-50">TITLE</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              className="border-b border-[var(--border-dim)] focus:border-[var(--accent)] bg-transparent py-1 text-sm w-full"
              placeholder="Event title..."
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest opacity-50">DATE</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-b border-[var(--border-dim)] focus:border-[var(--accent)] bg-transparent py-1 text-sm w-full cursor-text"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest opacity-50">NOTES</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="border border-[var(--border-dim)] focus:border-[var(--accent)] bg-transparent p-2 text-xs resize-none w-full leading-relaxed"
              placeholder="Add notes..."
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-1 border-t border-[var(--border-dim)]">
            {event ? (
              <button
                onClick={handleDelete}
                className="text-[10px] tracking-wider text-[var(--text-dim)] hover:text-red-400 cursor-pointer"
              >
                DELETE
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="text-[10px] tracking-wider text-[var(--text-dim)] hover:text-[var(--accent)] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="text-[10px] tracking-wider px-3 py-1.5 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--card-bg)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
