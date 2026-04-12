import type { SupabaseClient } from '@supabase/supabase-js'
import type { Task, Subtask, CalendarEvent, PlannerData } from '@/types'

// ── Type mappers ────────────────────────────────────────────────────────────

function dbToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    status: row.status as Task['status'],
    dueDate: (row.due_date as string | null) ?? null,
    notes: (row.notes as string) ?? '',
    subtaskIds: (row.subtask_ids as string[] | null) ?? [],
    createdAt: row.created_at as string,
  }
}

function taskToDb(task: Task, userId: string) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    status: task.status,
    due_date: task.dueDate,
    notes: task.notes,
    subtask_ids: task.subtaskIds,
    created_at: task.createdAt,
  }
}

function dbToSubtask(row: Record<string, unknown>): Subtask {
  return {
    id: row.id as string,
    title: row.title as string,
    done: (row.done as boolean) ?? false,
    parentId: row.parent_id as string,
  }
}

function subtaskToDb(subtask: Subtask, userId: string) {
  return {
    id: subtask.id,
    user_id: userId,
    title: subtask.title,
    done: subtask.done,
    parent_id: subtask.parentId,
  }
}

function dbToEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    notes: (row.notes as string) ?? '',
  }
}

function eventToDb(event: CalendarEvent, userId: string) {
  return {
    id: event.id,
    user_id: userId,
    title: event.title,
    date: event.date,
    notes: event.notes,
  }
}

// ── Load all user data ──────────────────────────────────────────────────────

export async function loadAllUserData(client: SupabaseClient, userId: string) {
  const [tasksRes, subtasksRes, eventsRes, plannerRes] = await Promise.all([
    client.from('tasks').select('*').eq('user_id', userId),
    client.from('subtasks').select('*').eq('user_id', userId),
    client.from('calendar_events').select('*').eq('user_id', userId),
    client.from('planner_entries').select('*').eq('user_id', userId),
  ])

  const tasks: Record<string, Task> = {}
  for (const row of tasksRes.data ?? []) {
    const t = dbToTask(row)
    tasks[t.id] = t
  }

  const subtasks: Record<string, Subtask> = {}
  for (const row of subtasksRes.data ?? []) {
    const s = dbToSubtask(row)
    subtasks[s.id] = s
  }

  const events: Record<string, CalendarEvent> = {}
  for (const row of eventsRes.data ?? []) {
    const e = dbToEvent(row)
    events[e.id] = e
  }

  const planner: PlannerData = {}
  for (const row of plannerRes.data ?? []) {
    const dayKey = row.day_key as string
    if (!planner[dayKey]) planner[dayKey] = []
    planner[dayKey].push({
      taskId: row.task_id as string,
      subtaskIds: (row.subtask_ids as string[] | null) ?? null,
    })
  }

  return { tasks, subtasks, events, planner }
}

// ── Tasks ───────────────────────────────────────────────────────────────────

export async function upsertTask(client: SupabaseClient, task: Task, userId: string) {
  await client.from('tasks').upsert(taskToDb(task, userId))
}

export async function deleteTask(client: SupabaseClient, taskId: string) {
  await client.from('tasks').delete().eq('id', taskId)
}

// ── Subtasks ─────────────────────────────────────────────────────────────────

export async function upsertSubtask(client: SupabaseClient, subtask: Subtask, userId: string) {
  await client.from('subtasks').upsert(subtaskToDb(subtask, userId))
}

export async function deleteSubtask(client: SupabaseClient, subtaskId: string) {
  await client.from('subtasks').delete().eq('id', subtaskId)
}

export async function deleteSubtasksByTask(client: SupabaseClient, taskId: string) {
  await client.from('subtasks').delete().eq('parent_id', taskId)
}

// ── Calendar events ──────────────────────────────────────────────────────────

export async function upsertEvent(client: SupabaseClient, event: CalendarEvent, userId: string) {
  await client.from('calendar_events').upsert(eventToDb(event, userId))
}

export async function deleteEvent(client: SupabaseClient, eventId: string) {
  await client.from('calendar_events').delete().eq('id', eventId)
}

// ── Planner entries ──────────────────────────────────────────────────────────

export async function upsertPlannerEntry(
  client: SupabaseClient,
  dayKey: string,
  taskId: string,
  subtaskIds: string[] | null,
  userId: string
) {
  await client.from('planner_entries').upsert({
    user_id: userId,
    day_key: dayKey,
    task_id: taskId,
    subtask_ids: subtaskIds,
  })
}

export async function deletePlannerEntry(
  client: SupabaseClient,
  dayKey: string,
  taskId: string,
  userId: string
) {
  await client
    .from('planner_entries')
    .delete()
    .eq('user_id', userId)
    .eq('day_key', dayKey)
    .eq('task_id', taskId)
}

export async function deletePlannerEntriesByTask(
  client: SupabaseClient,
  taskId: string,
  userId: string
) {
  await client
    .from('planner_entries')
    .delete()
    .eq('user_id', userId)
    .eq('task_id', taskId)
}

/** Sync an entire planner day — deletes old entries then inserts new ones. */
export async function syncPlannerDay(
  client: SupabaseClient,
  dayKey: string,
  entries: Array<{ taskId: string; subtaskIds: string[] | null }>,
  userId: string
) {
  await client
    .from('planner_entries')
    .delete()
    .eq('user_id', userId)
    .eq('day_key', dayKey)

  if (entries.length > 0) {
    await client.from('planner_entries').insert(
      entries.map((e) => ({
        user_id: userId,
        day_key: dayKey,
        task_id: e.taskId,
        subtask_ids: e.subtaskIds,
      }))
    )
  }
}
