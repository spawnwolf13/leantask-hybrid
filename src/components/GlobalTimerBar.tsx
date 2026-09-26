import { ExternalLink, Pause, Play, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { ResetTimerDialog } from '@/components/modals/ResetTimerDialog'
import { pauseTaskTimer, resetTaskTimer, startTaskTimer } from '@/db/tasks'
import { useActiveTimerTaskId } from '@/hooks/useActiveTimerTaskId'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'
import { useTask } from '@/hooks/useTask'
import { formatStopwatch } from '@/utils/stopwatch'
import type { Task } from '@/types/entities'

interface GlobalTimerBarProps {
  onOpenTask: (taskId: string) => void
}

/** Shows the running task's timer; stays visible while paused so it can be resumed, until reset. */
export function GlobalTimerBar({ onOpenTask }: GlobalTimerBarProps) {
  const activeTimerTaskId = useActiveTimerTaskId()
  const [pinnedTaskId, setPinnedTaskId] = useState<string | null>(null)

  // Adjusting state during render (not in an effect) keeps the pinned task in sync with the running one.
  if (activeTimerTaskId !== null && activeTimerTaskId !== pinnedTaskId) setPinnedTaskId(activeTimerTaskId)

  const task = useTask(pinnedTaskId ?? undefined)
  if (!task) return null
  return <TimerPill task={task} onOpenTask={onOpenTask} onDismiss={() => setPinnedTaskId(null)} />
}

interface TimerPillProps {
  task: Task
  onOpenTask: (taskId: string) => void
  onDismiss: () => void
}

function TimerPill({ task, onOpenTask, onDismiss }: TimerPillProps) {
  const elapsedSeconds = useElapsedSeconds(task)
  const isRunning = Boolean(task.timerStartedAt)
  const [isResetOpen, setIsResetOpen] = useState(false)

  // A paused task with nothing logged has no session left to resume.
  if (!isRunning && task.timeSpentSeconds === 0) return null

  const iconButton = 'rounded-full p-1 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white'

  return (
    <>
      <div className="flex items-center gap-3 rounded-full border border-slate-700/60 bg-slate-800/80 px-3 py-1 text-xs text-slate-100">
        <span
          className={`size-2 shrink-0 rounded-full ${isRunning ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'}`}
          aria-hidden
        />
        <span className="max-w-[180px] truncate font-medium" title={task.title}>
          {task.title}
        </span>
        <span className="font-mono tabular-nums">{formatStopwatch(elapsedSeconds)}</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={iconButton}
            title={isRunning ? 'Pause timer' : 'Resume timer'}
            onClick={() => void (isRunning ? pauseTaskTimer(task.id) : startTaskTimer(task.id))}
          >
            {isRunning ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
          {!isRunning && (
            <>
              <button type="button" className={iconButton} title="Reset timer" onClick={() => setIsResetOpen(true)}>
                <RotateCcw className="size-3.5" />
              </button>
              <button type="button" className={iconButton} title="Dismiss (keeps logged time)" onClick={onDismiss}>
                <X className="size-3.5" />
              </button>
            </>
          )}
          <button type="button" className={iconButton} title="Jump to card" onClick={() => onOpenTask(task.id)}>
            <ExternalLink className="size-3.5" />
          </button>
        </div>
      </div>
      <ResetTimerDialog
        open={isResetOpen}
        elapsedSeconds={elapsedSeconds}
        onOpenChange={setIsResetOpen}
        onConfirm={() => {
          void resetTaskTimer(task.id)
          setIsResetOpen(false)
          onDismiss()
        }}
      />
    </>
  )
}
