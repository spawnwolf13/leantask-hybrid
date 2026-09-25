import { addMinutes, format, parseISO } from 'date-fns'
import { db } from '@/db/db'
import type { ChecklistItem } from '@/types/entities'

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/** RFC 5545 line folding: continuation lines start with a single leading space. */
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  let rest = line
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75))
    rest = ` ${rest.slice(75)}`
  }
  chunks.push(rest)
  return chunks.join('\r\n')
}

/** Floating local time (no timezone) — the app has no stored IANA timezone per task. */
function formatFloatingDateTime(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss")
}

function formatDateOnly(date: Date): string {
  return format(date, 'yyyyMMdd')
}

function formatUtcStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
}

function buildChecklistSummary(items: ChecklistItem[]): string {
  if (items.length === 0) return ''
  const lines = items.map((item) => {
    const check = item.isCompleted ? '[x]' : '[ ]'
    const duration = item.durationMinutes ? ` (${item.durationMinutes}m)` : ''
    return `${check} ${item.text}${duration}`
  })
  return `\n\nChecklist:\n${lines.join('\n')}`
}

export async function buildIcsCalendar(): Promise<string> {
  const [tasks, checklistItems] = await Promise.all([db.tasks.toArray(), db.checklistItems.toArray()])
  const scheduledTasks = tasks.filter((task) => task.startDate)

  const checklistByTask = new Map<string, ChecklistItem[]>()
  for (const item of checklistItems) {
    const list = checklistByTask.get(item.taskId)
    if (list) list.push(item)
    else checklistByTask.set(item.taskId, [item])
  }

  const dtStamp = formatUtcStamp(new Date())
  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LeanTask Hybrid//EN', 'CALSCALE:GREGORIAN']

  for (const task of scheduledTasks) {
    const checklist = checklistByTask.get(task.id) ?? []
    const description = escapeIcsText(
      [task.description ?? '', buildChecklistSummary(checklist)].filter(Boolean).join('\n'),
    )
    const summary = escapeIcsText(task.isCompleted ? `[DONE] ${task.title}` : task.title)

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${task.id}@leantask-hybrid`)
    lines.push(`DTSTAMP:${dtStamp}`)

    if (task.startTime && task.durationMinutes) {
      const start = parseISO(`${task.startDate}T${task.startTime}`)
      const end = addMinutes(start, task.durationMinutes)
      lines.push(`DTSTART:${formatFloatingDateTime(start)}`)
      lines.push(`DTEND:${formatFloatingDateTime(end)}`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(parseISO(task.startDate as string))}`)
    }

    lines.push(foldLine(`SUMMARY:${summary}`))
    if (description) lines.push(foldLine(`DESCRIPTION:${description}`))
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcsCalendar(ics: string): void {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'leantask-schedule.ics'
  anchor.click()
  URL.revokeObjectURL(url)
}
