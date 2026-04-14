'use client'

import { useState, useEffect, useRef } from 'react'
import { useEventStore } from '@/store/events'
import { useDB } from '@/hooks/useDB'
import { upsertEvent } from '@/lib/db'

type EventbriteResult = {
  id: string
  title: string
  date: string
  time: string
  location: string
  url: string
  description: string
}

interface EventbriteModalProps {
  onClose: () => void
}

export default function EventbriteModal({ onClose }: EventbriteModalProps) {
  const { addEvent } = useEventStore()
  const { client, userId } = useDB()

  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [results, setResults] = useState<EventbriteResult[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [saved, setSaved] = useState<Set<string>>(new Set())

  const queryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    queryRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSearch() {
    const q = query.trim()
    if (!q) return
    setStatus('loading')
    setResults([])
    try {
      const params = new URLSearchParams({ q })
      if (location.trim()) params.set('location', location.trim())
      const res = await fetch(`/api/eventbrite/search?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unknown error')
      setResults(data.events ?? [])
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  function handleSave(event: EventbriteResult) {
    const notes = [
      event.description,
      event.description ? '' : null,
      event.url,
    ].filter((s) => s !== null).join('\n').trim()

    const newId = addEvent({ title: event.title, date: event.date, notes })
    if (userId) upsertEvent(client, { id: newId, title: event.title, date: event.date, notes }, userId)
    setSaved((prev) => new Set(prev).add(event.id))
  }

  function formatDate(date: string, time: string) {
    if (!date) return '—'
    const [year, month, day] = date.split('-')
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
    const label = `${day} ${months[parseInt(month) - 1]} ${year}`
    return time ? `${label} · ${time}` : label
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xl mx-4 md:mx-auto border border-[var(--border)] flex flex-col"
        style={{ backgroundColor: '#050f0e', maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 shrink-0">
          <span className="text-xs tracking-widest opacity-70">SEARCH EVENTBRITE</span>
          <button
            onClick={onClose}
            className="text-[var(--text-dim)] hover:text-[var(--accent)] leading-none cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Search inputs */}
        <div className="px-4 pt-4 pb-3 flex flex-col gap-3 border-b border-[var(--border-dim)] shrink-0">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest opacity-50">KEYWORD</label>
            <input
              ref={queryRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. tech conference, workshop, hackathon..."
              className="border-b border-[var(--border-dim)] focus:border-[var(--accent)] bg-transparent py-1 text-sm w-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest opacity-50">LOCATION (OPTIONAL)</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Chicago, New York, London..."
              className="border-b border-[var(--border-dim)] focus:border-[var(--accent)] bg-transparent py-1 text-sm w-full"
            />
          </div>
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSearch}
              disabled={!query.trim() || status === 'loading'}
              className="text-[10px] tracking-wider px-3 py-1.5 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--card-bg)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {status === 'loading' ? 'SEARCHING...' : 'SEARCH'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {status === 'idle' && (
            <p className="text-[10px] text-[var(--text-dim)] tracking-wider text-center py-8 opacity-50">
              ENTER A KEYWORD TO FIND EVENTS
            </p>
          )}

          {status === 'error' && (
            <p className="text-[10px] text-[var(--text-dim)] tracking-wider text-center py-8">
              SEARCH FAILED — CHECK YOUR CONNECTION AND TRY AGAIN
            </p>
          )}

          {status === 'done' && results.length === 0 && (
            <p className="text-[10px] text-[var(--text-dim)] tracking-wider text-center py-8">
              NO RESULTS FOUND
            </p>
          )}

          {results.map((event) => (
            <div
              key={event.id}
              className="px-4 py-3 border-b border-[var(--border-dim)] flex items-start justify-between gap-3"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-xs leading-snug">{event.title}</span>
                <span className="text-[10px] text-[var(--accent)] tracking-wider">
                  {formatDate(event.date, event.time)}
                </span>
                <span className="text-[10px] text-[var(--text-dim)] tracking-wider truncate">
                  {event.location}
                </span>
                {event.description && (
                  <span className="text-[10px] text-[var(--text-dim)] opacity-60 leading-relaxed line-clamp-2">
                    {event.description}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleSave(event)}
                disabled={saved.has(event.id)}
                className="shrink-0 text-[10px] tracking-wider px-2 py-1 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--card-bg)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                {saved.has(event.id) ? 'SAVED' : 'SAVE'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
