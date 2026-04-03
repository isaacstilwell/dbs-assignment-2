/**
 * Returns the Monday-through-Sunday dates for the week containing `date`.
 */
export function getCurrentWeekDays(date: Date = new Date()): Date[] {
  const day = date.getDay() // 0=Sun, 1=Mon, ...
  const monday = new Date(date)
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(date.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function toDayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDayLabel(date: Date): { short: string; num: string } {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return {
    short: days[date.getDay()],
    num: String(date.getDate()).padStart(2, '0'),
  }
}

export function formatDueDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${m}.${d}`
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}
