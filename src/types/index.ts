export type TaskStatus = 'todo' | 'doing' | 'done'

export interface Subtask {
  id: string
  title: string
  done: boolean
  parentId: string
}

export interface Task {
  id: string
  title: string
  status: TaskStatus
  dueDate: string | null   // ISO date string e.g. '2025-04-10'
  notes: string
  subtaskIds: string[]
  createdAt: string        // ISO datetime string
}

// Planner: dayKey = 'YYYY-MM-DD', value = ordered list of taskIds for that day
export type PlannerDay = string[]
export type PlannerData = Record<string, PlannerDay>
