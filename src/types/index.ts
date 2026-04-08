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

// Planner: dayKey = 'YYYY-MM-DD'
// subtaskIds: null = whole-task drag (show all subtasks live); string[] = specific subtasks only
export interface PlannerEntry {
  taskId: string
  subtaskIds: string[] | null
}
export type PlannerData = Record<string, PlannerEntry[]>

export interface CalendarEvent {
  id: string
  title: string
  date: string   // 'YYYY-MM-DD'
  notes: string
}
