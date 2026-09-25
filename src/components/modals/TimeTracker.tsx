import { Pause, Play, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { pauseTaskTimer, resetTaskTimer, startTaskTimer } from '@/db/tasks'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/utils/schedule'
import { formatStopwatch } from '@/utils/stopwatch'
import type { Task } from '@/types/entities'

interface TimeTrackerProps {
  task: Task
}

export function TimeTracker({ task }: TimeTrackerProps) {
  const elapsedSeconds = useElapsedSeconds(task)
  const isRunning = Boolean(task.timerStartedAt)
  const [isResetOpen, setIsResetOpen] = useState(false)

  const elapsedMinutes = elapsedSeconds / 60
  const isOverBudget = task.durationMinutes !== undefined && elapsedMinutes > task.durationMinutes
  const percent = task.durationMinutes ? Math.round((elapsedMinutes / task.durationMinutes) * 100) : null

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
      <Button
        type="button"
        size="icon"
        className={cn(
          'size-9 shrink-0 rounded-full text-white',
          isRunning ? 'animate-pulse bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600',
        )}
        onClick={() => void (isRunning ? pauseTaskTimer(task.id) : startTaskTimer(task.id))}
      >
        {isRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
      </Button>

      <span className="font-mono text-lg tabular-nums">{formatStopwatch(elapsedSeconds)}</span>

      <button
        type="button"
        onClick={() => setIsResetOpen(true)}
        className="shrink-0 text-muted-foreground hover:text-destructive"
        title="Reset time tracker"
      >
        <RotateCcw className="size-4" />
      </button>

      <span
        className={cn(
          'ml-auto text-sm',
          isOverBudget ? 'font-medium text-amber-700 dark:text-amber-400' : 'text-muted-foreground',
        )}
      >
        Worked: {formatDuration(Math.round(elapsedMinutes))}
        {task.durationMinutes !== undefined && (
          <>
            {' '}
            / Est: {formatDuration(task.durationMinutes)} ({percent}%)
          </>
        )}
        {isOverBudget && ' ⚠️ over budget'}
      </span>

      <AlertDialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset time tracker?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently clear the {formatStopwatch(elapsedSeconds)} logged for this task. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => {
                void resetTaskTimer(task.id)
                setIsResetOpen(false)
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
