import type { TaskRecurrence } from '@/types/entities'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function getRecurrenceDaysOfWeek(recurrence: TaskRecurrence): number[] {
  if (recurrence.frequency === 'daily') return [0, 1, 2, 3, 4, 5, 6]
  if (recurrence.frequency === 'weekdays') return [1, 2, 3, 4, 5]
  return recurrence.daysOfWeek ?? []
}

export function describeRecurrence(recurrence: TaskRecurrence): string {
  if (recurrence.frequency === 'daily') return 'Daily'
  if (recurrence.frequency === 'weekdays') return 'Weekdays'
  const days = recurrence.daysOfWeek ?? []
  return days.length > 0 ? days.map((day) => DAY_LABELS[day]).join(', ') : 'Custom'
}

export function isRecurringToday(recurrence: TaskRecurrence, dayOfWeek: number): boolean {
  return getRecurrenceDaysOfWeek(recurrence).includes(dayOfWeek)
}
