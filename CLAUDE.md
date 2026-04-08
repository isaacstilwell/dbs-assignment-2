@AGENTS.md

# Task List — Project Overview

A personal task manager with a brutalist / military HUD aesthetic. Built with Next.js App Router, TypeScript, Tailwind v4, and Zustand. All data is stored client-side in `localStorage`; there is no backend.

---

## Design System

- **Font**: UAV-OSD-Sans-Mono (monospace, loaded via `globals.css`)
- **Color palette**: Near-black background (`#050f0e`), teal accent (`--accent` / `--accent-bright`), dim borders (`--border-dim`), muted text (`--text-dim`)
- **Aesthetic rules**:
  - No animations or scale transitions — hover effects use `underline` and `cursor-pointer` only
  - No red on destructive buttons — all buttons use teal accent regardless of action type
  - Strikethrough for completed items uses a CSS `.struck` class (centered `::after` pseudo-element, not `text-decoration`)
  - All icons are custom SVGs in `src/components/icons.tsx` with `strokeLinecap="square"` for a hard military edge

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js (App Router, `'use client'` where needed) |
| Language | TypeScript |
| Styling | Tailwind v4 with CSS custom properties |
| State | Zustand + `persist` middleware → `localStorage` |
| Drag & drop | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |

---

## Responsive Breakpoints

Four tiers, all using Tailwind prefix classes (no JS breakpoint detection):

| Breakpoint | Width | Columns shown |
|---|---|---|
| (default mobile) | < 768px | 1 column |
| `md` | ≥ 768px | 3 columns |
| `lg` | ≥ 1024px | 5 columns |
| `xl` | ≥ 1280px | 7 columns (full) |

- Drag handles (`⠿`) are hidden on mobile (`hidden md:inline`)
- Mobile-only fallback buttons replace drag interactions where needed

---

## Pages & Routes

### `/` — Tasks (TaskManagerPage)
The main kanban + weekly planner view. Contains a global `DndContext` that handles all drag-and-drop for the entire page.

- **Top**: `[+ NEW TASK]` button → navigates to `/new`
- **Database section** (`TaskDatabase`): kanban board with TO DO / DOING / DONE columns. Mobile: tab picker + single column. Desktop: 3-column grid.
- **Planner section** (`WeeklyPlanner`): week-at-a-glance grid. Tasks and subtasks can be dragged from the database onto day columns. Mobile: single-day view with prev/next arrows. Responsive: 3/5/7 day columns at md/lg/xl.
- Clicking a task card opens `TaskModal` overlaid on the same page (URL changes to `/edit/[id]` or `/new`)

### `/edit/[id]` — Edit Task (via TaskManagerPage)
Renders `TaskManagerPage` with `initialModal={id}` — same page, modal pre-opened.

### `/new` — New Task (via TaskManagerPage)
Renders `TaskManagerPage` with `initialModal="new"` — same page, empty create modal open.

### `/calendar` — Calendar (CalendarPage)
Monthly calendar view showing tasks with due dates and calendar events.

- **xl (7 col)**: full month grid with Mon–Sun DOW headers, leading/trailing greyed-out days from adjacent months. Prev/next month arrows.
- **lg (5 col) / md (3 col) / mobile (1 col)**: shows columns by day-of-week. Each column lists all occurrences of that weekday in the selected month (e.g., all Tuesdays). Prev/next arrows shift the visible day-of-week window; month is selected via a `<select>` dropdown.
- Clicking any cell opens `EventModal` to create a new event pre-filled with that date.
- Clicking a task chip navigates to `/edit/[id]`.

### `/today` — Today / Focus (TodayPage)
Daily focus view for the current date.

- **Header**: date label + START/STOP SESSION timer button
- **Normal mode** (session stopped):
  - Tab picker: SCHEDULED (tasks from today's planner entries) | EVENTS (today's calendar events)
  - OPEN PLANNER → link at the bottom
- **Session mode** (session running):
  - `DoingZone`: droppable area showing all tasks with `status: 'doing'` as expanded `DoingCard` components (title, notes, subtask checkboxes, due date, DO LATER / DONE buttons)
  - `TodoZone`: list of `TodoRow` items — only tasks that are in today's planner AND have `status: 'todo'`. Draggable to the doing zone on desktop; `→ DOING` button on mobile.
- Edit buttons navigate to `/today/edit/[id]` (overlays `TaskModal` on the Today page, closes back to `/today`)

### `/today/edit/[id]` — Edit Task from Today
Renders `TodayPage` with `initialModal={id}`.

### `/archive` — Archive (ArchivePage)
List of all completed (`status: 'done'`) tasks, sorted by `createdAt` descending.

- Real-time title search filter
- Per-row delete button (hover-revealed)
- CLEAR ALL COMPLETED button with a custom confirm dialog (same aesthetic as modals, no native `window.confirm`)
- Mobile: shows title + delete only. Desktop (`md`+): adds DUE and SUBTASKS columns.
- Edit buttons navigate to `/archive/edit/[id]`

### `/archive/edit/[id]` — Edit Task from Archive
Renders `ArchivePage` with `initialModal={id}`.

---

## Data Model

All types are in `src/types/index.ts`. All IDs are generated with `Math.random().toString(36).slice(2) + Date.now().toString(36)`.

### `Task`
```ts
interface Task {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done'
  dueDate: string | null   // 'YYYY-MM-DD' or null
  notes: string
  subtaskIds: string[]     // ordered list of child Subtask IDs
  createdAt: string        // ISO datetime
}
```

### `Subtask`
```ts
interface Subtask {
  id: string
  title: string
  done: boolean
  parentId: string         // ID of parent Task
}
```

### `PlannerEntry` / `PlannerData`
```ts
interface PlannerEntry {
  taskId: string
  subtaskIds: string[] | null  // null = show all subtasks live; string[] = specific subset
}
type PlannerData = Record<string, PlannerEntry[]>  // key = 'YYYY-MM-DD'
```
When a whole task is dragged to a planner day, `subtaskIds` is `null` (always reflects live subtask list). When individual subtasks are dragged, `subtaskIds` is an explicit array of only those subtask IDs.

### `CalendarEvent`
```ts
interface CalendarEvent {
  id: string
  title: string
  date: string   // 'YYYY-MM-DD'
  notes: string
}
```

---

## State Stores (Zustand + localStorage)

### `useTaskStore` — `localStorage: 'taskmanager-tasks'`
Holds `tasks: Record<string, Task>` and `subtasks: Record<string, Subtask>`.
Actions: `addTask`, `updateTask`, `deleteTask`, `addSubtask`, `updateSubtask`, `deleteSubtask`.
`deleteTask` cascades: removes all child subtasks automatically.

### `usePlannerStore` — `localStorage: 'taskmanager-planner'`
Holds `planner: PlannerData`.
Actions: `addTaskToDay`, `addSubtaskToDay`, `removeFromDay`, `removeSubtaskFromDay`, `moveEntryToDay`.
Enforces constraint: each subtask appears on at most one day. Includes a v0→v1 migration (old format stored `string[]` per day; new format stores `PlannerEntry[]`).

### `useEventStore` — `localStorage: 'taskmanager-events'`
Holds `events: Record<string, CalendarEvent>`.
Actions: `addEvent`, `updateEvent`, `deleteEvent`.

---

## Key Components

| Component | Purpose |
|---|---|
| `Nav` | Site-wide navigation bar (TASKS / CALENDAR / TODAY / ARCHIVE) |
| `TaskModal` | Create/edit task overlay — title, status, due date, notes, subtasks |
| `EventModal` | Create/edit calendar event overlay — title, date, notes |
| `TaskCard` | Draggable kanban card (used in `KanbanColumn`) |
| `KanbanColumn` | Droppable column for a single status |
| `TaskDatabase` | Kanban board — mobile tab view or desktop 3-col grid |
| `WeeklyPlanner` | Week grid with droppable day columns and `PlannerTaskChip` items |
| `PlannerTaskChip` | Draggable planner chip (task or subtask subset) within the planner |
| `CalendarPage` | Monthly calendar with responsive column layout |
| `CalendarCell` | Single day cell — renders task and event chips with overflow toggle |
| `TodayPage` | Daily focus view with optional session mode and DnD |
| `ArchivePage` | Completed task list with search and bulk delete |
| `icons.tsx` | Custom SVG icons: `XIcon`, `EditIcon`, `ArrowRightIcon` |

---

## `src/lib/dates.ts`

Utility functions used across components:
- `toDayKey(date)` → `'YYYY-MM-DD'` string
- `isToday(date)` → boolean
- `formatDueDate(iso)` → human-readable string (e.g., `"07 APR"`)
