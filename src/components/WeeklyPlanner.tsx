'use client'

import DayColumn from './DayColumn'
import { usePlannerStore } from '@/store/planner'
import { getCurrentWeekDays, toDayKey } from '@/lib/dates'
import type { Task } from '@/types'

interface WeeklyPlannerProps {
  onEdit: (task: Task) => void
  onEditById: (taskId: string) => void
}

export default function WeeklyPlanner({ onEditById }: WeeklyPlannerProps) {
  const { planner } = usePlannerStore()
  const weekDays = getCurrentWeekDays()

  // Format week range label
  const first = weekDays[0]
  const last = weekDays[6]
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const weekLabel = `WEEK OF ${months[first.getMonth()]} ${first.getDate()}`

  return (
    <section className="w-full">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-[10px] tracking-[0.2em] opacity-50">{weekLabel}</span>
        <div className="flex-1 border-t border-[var(--border-dim)]" />
      </div>

      {/* 7 day columns */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date) => {
          const dayKey = toDayKey(date)
          return (
            <DayColumn
              key={dayKey}
              date={date}
              dayKey={dayKey}
              taskIds={planner[dayKey] ?? []}
              onEdit={onEditById}
            />
          )
        })}
      </div>
    </section>
  )
}
