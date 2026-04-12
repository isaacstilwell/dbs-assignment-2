'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { loadAllUserData } from '@/lib/db'
import { useTaskStore } from '@/store/tasks'
import { useEventStore } from '@/store/events'
import { usePlannerStore } from '@/store/planner'

export default function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const prevUserIdRef = useRef<string | null>(null)

  const { setTasks, setSubtasks, clearTaskStore } = useTaskStore()
  const { setEvents, clearEventStore } = useEventStore()
  const { setPlanner, clearPlannerStore } = usePlannerStore()

  useEffect(() => {
    const userId = user?.id ?? null

    if (userId === prevUserIdRef.current) return
    prevUserIdRef.current = userId

    if (!userId) {
      clearTaskStore()
      clearEventStore()
      clearPlannerStore()
      return
    }

    loadAllUserData(supabase, userId).then(({ tasks, subtasks, events, planner }) => {
      setTasks(tasks)
      setSubtasks(subtasks)
      setEvents(events)
      setPlanner(planner)
    })
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}
