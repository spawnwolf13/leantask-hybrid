import { useEffect, useState } from 'react'
import type { Task } from '@/types/entities'

type TimerFields = Pick<Task, 'timeSpentSeconds' | 'timerStartedAt'>

function computeElapsed(task: TimerFields): number {
  if (!task.timerStartedAt) return task.timeSpentSeconds
  const elapsed = Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000)
  return task.timeSpentSeconds + Math.max(0, elapsed)
}

/**
 * Derives live elapsed seconds purely from timerStartedAt + timeSpentSeconds.
 * Recomputed from real timestamps on every tick (never incremented in place),
 * so a throttled/suspended tab can never drift — the next tick just recomputes
 * the true elapsed time from Date.now() - timerStartedAt.
 */
export function useElapsedSeconds({ timeSpentSeconds, timerStartedAt }: TimerFields): number {
  const [elapsed, setElapsed] = useState(() => computeElapsed({ timeSpentSeconds, timerStartedAt }))

  useEffect(() => {
    setElapsed(computeElapsed({ timeSpentSeconds, timerStartedAt }))
    if (!timerStartedAt) return
    const interval = setInterval(() => setElapsed(computeElapsed({ timeSpentSeconds, timerStartedAt })), 1000)
    return () => clearInterval(interval)
  }, [timerStartedAt, timeSpentSeconds])

  return elapsed
}
