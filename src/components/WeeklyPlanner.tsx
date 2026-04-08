'use client'

import { useState } from 'react'
import DayColumn from './DayColumn'
import { usePlannerStore } from '@/store/planner'
import { getCurrentWeekDays, toDayKey, formatDayLabel } from '@/lib/dates'
import type { Task } from '@/types'

interface WeeklyPlannerProps {
  onEdit: (task: Task) => void
  onEditById: (taskId: string) => void
}

export default function WeeklyPlanner({ onEditById }: WeeklyPlannerProps) {
  const { planner } = usePlannerStore()
  const weekDays = getCurrentWeekDays()

  const todayKey = toDayKey(new Date())
  const todayIndex = weekDays.findIndex((d) => toDayKey(d) === todayKey)
  const [mobileIndex, setMobileIndex] = useState(todayIndex >= 0 ? todayIndex : 0)

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const first = weekDays[0]
  const weekLabel = `WEEK OF ${months[first.getMonth()]} ${first.getDate()}`

  const mobileDay = weekDays[mobileIndex]
  const mobileDayKey = toDayKey(mobileDay)
  const { short, num } = formatDayLabel(mobileDay)

  return (
    <section className="w-full">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-[10px] tracking-[0.2em] opacity-50">{weekLabel}</span>
        <div className="flex-1 border-t border-[var(--border-dim)]" />
      </div>

      {/* Mobile: single day with prev/next (< md) */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setMobileIndex((i) => Math.max(0, i - 1))}
            disabled={mobileIndex === 0}
            className="text-[10px] tracking-widest text-[var(--text-dim)] hover:text-[var(--accent)] disabled:opacity-20 cursor-pointer disabled:cursor-default"
          >
            ← PREV
          </button>
          <span className={`text-xs tracking-widest ${mobileDayKey === todayKey ? 'text-[var(--accent)]' : 'opacity-60'}`}>
            {short} {num}
          </span>
          <button
            onClick={() => setMobileIndex((i) => Math.min(6, i + 1))}
            disabled={mobileIndex === 6}
            className="text-[10px] tracking-widest text-[var(--text-dim)] hover:text-[var(--accent)] disabled:opacity-20 cursor-pointer disabled:cursor-default"
          >
            NEXT →
          </button>
        </div>
        <DayColumn
          date={mobileDay}
          dayKey={mobileDayKey}
          entries={planner[mobileDayKey] ?? []}
          onEdit={onEditById}
        />
      </div>

      {/* Responsive grid: md=3 cols, lg=5 cols, xl=7 cols */}
      {/* Days 0-2 (Mon-Wed): visible at md+  */}
      {/* Days 3-4 (Thu-Fri): visible at lg+  */}
      {/* Days 5-6 (Sat-Sun): visible at xl+  */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-2">
        {weekDays.map((date, idx) => {
          const dayKey = toDayKey(date)
          const visibilityClass =
            idx < 3 ? '' :
            idx < 5 ? 'hidden lg:block' :
            'hidden xl:block'

          return (
            <div key={dayKey} className={visibilityClass}>
              <DayColumn
                date={date}
                dayKey={dayKey}
                entries={planner[dayKey] ?? []}
                onEdit={onEditById}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
