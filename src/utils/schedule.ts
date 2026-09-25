import { addMinutes, format, isToday, isTomorrow, parseISO } from 'date-fns'

export const DURATION_PRESETS = [15, 30, 45, 60, 90, 120]

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours === 0) return `${remainder}m`
  if (remainder === 0) return `${hours}h`
  return `${hours}h ${remainder}m`
}

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'MMM d')
}

/** "Today, 14:00 - 15:30 (1h 30m)" — used in the task edit modal. */
export function formatScheduleRange(startDate: string, startTime: string, durationMinutes: number): string {
  const start = parseISO(`${startDate}T${startTime}`)
  const end = addMinutes(start, durationMinutes)
  return `${dayLabel(start)}, ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')} (${formatDuration(durationMinutes)})`
}

/** "Tomorrow 10:00 AM (1h)" — used on the board's task card badge. */
export function formatScheduleBadge(startDate: string, startTime: string, durationMinutes?: number): string {
  const start = parseISO(`${startDate}T${startTime}`)
  const timeLabel = format(start, 'h:mm a')
  return durationMinutes ? `${dayLabel(start)} ${timeLabel} (${formatDuration(durationMinutes)})` : `${dayLabel(start)} ${timeLabel}`
}
