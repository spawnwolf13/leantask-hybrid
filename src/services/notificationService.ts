import { toast } from 'sonner'
import { db } from '@/db/db'
import type { Task } from '@/types/entities'
import { getRecurrenceDaysOfWeek } from '@/utils/recurrence'
import { playChime } from './chime'

const NOTIFICATIONS_ENABLED_KEY = 'leantask-notifications-enabled'
const POLL_INTERVAL_MS = 20_000
/** Poll cadence means we can't catch the exact second — fire within this window after the target time. */
const FIRE_WINDOW_SECONDS = 60
const END_WARNING_MINUTES = 5

// Session-only: cleared on reload, which is fine — alarms just re-arm for the day.
const triggeredKeys = new Set<string>()

export function areNotificationsEnabled(): boolean {
  return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === 'true'
}

export function setNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false')
}

function todayDateString(now: Date): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isScheduledToday(task: Task, now: Date, todayStr: string): boolean {
  if (!task.startTime) return false
  if (task.recurrence) return getRecurrenceDaysOfWeek(task.recurrence).includes(now.getDay())
  return task.startDate === todayStr
}

function fireAlarm(title: string, body: string): void {
  playChime()
  toast(title, { description: body })
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}

async function checkTasks(): Promise<void> {
  if (!areNotificationsEnabled()) return

  const now = new Date()
  const todayStr = todayDateString(now)
  const tasks = await db.tasks.toArray()

  for (const task of tasks) {
    if (task.isCompleted || !isScheduledToday(task, now, todayStr)) continue

    const [hours, minutes] = task.startTime!.split(':').map(Number)
    const start = new Date(now)
    start.setHours(hours, minutes, 0, 0)

    const startKey = `${task.id}:start:${todayStr}`
    const startDiffSeconds = (now.getTime() - start.getTime()) / 1000
    if (startDiffSeconds >= 0 && startDiffSeconds <= FIRE_WINDOW_SECONDS && !triggeredKeys.has(startKey)) {
      triggeredKeys.add(startKey)
      fireAlarm(`Starting now: ${task.title}`, 'Your scheduled task is starting.')
    }

    if (task.durationMinutes) {
      const end = new Date(start.getTime() + task.durationMinutes * 60_000)
      const warnAt = new Date(end.getTime() - END_WARNING_MINUTES * 60_000)
      const endKey = `${task.id}:end:${todayStr}`
      const endDiffSeconds = (now.getTime() - warnAt.getTime()) / 1000
      if (endDiffSeconds >= 0 && endDiffSeconds <= FIRE_WINDOW_SECONDS && !triggeredKeys.has(endKey)) {
        triggeredKeys.add(endKey)
        fireAlarm(`Ending soon: ${task.title}`, 'Wraps up in 5 minutes.')
      }
    }
  }
}

/** Starts the alarm poller. Returns a cleanup function to stop it. */
export function startNotificationScheduler(): () => void {
  void checkTasks()
  const interval = setInterval(() => void checkTasks(), POLL_INTERVAL_MS)
  return () => clearInterval(interval)
}
