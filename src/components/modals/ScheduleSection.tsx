import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateTask } from '@/db/tasks'
import { cn } from '@/lib/utils'
import { DURATION_PRESETS, formatDuration, formatScheduleRange } from '@/utils/schedule'
import type { Task } from '@/types/entities'

interface ScheduleSectionProps {
  task: Task
}

export function ScheduleSection({ task }: ScheduleSectionProps) {
  const [startDate, setStartDate] = useState(task.startDate ?? '')
  const [startTime, setStartTime] = useState(task.startTime ?? '')
  const [customDuration, setCustomDuration] = useState(task.durationMinutes?.toString() ?? '')

  function commitCustomDuration() {
    const parsed = Number.parseInt(customDuration, 10)
    const durationMinutes = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
    void updateTask(task.id, { durationMinutes })
    setCustomDuration(durationMinutes?.toString() ?? '')
  }

  const scheduleLabel =
    task.startDate && task.startTime && task.durationMinutes
      ? formatScheduleRange(task.startDate, task.startTime, task.durationMinutes)
      : null

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="task-start-date">Start date</Label>
          <Input
            id="task-start-date"
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value)
              void updateTask(task.id, { startDate: event.target.value || undefined })
            }}
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="task-start-time">Start time</Label>
          <Input
            id="task-start-time"
            type="time"
            value={startTime}
            onChange={(event) => {
              setStartTime(event.target.value)
              void updateTask(task.id, { startTime: event.target.value || undefined })
            }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Duration</Label>
        <div className="flex flex-wrap items-center gap-2">
          {DURATION_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant={task.durationMinutes === preset ? 'default' : 'outline'}
              onClick={() => void updateTask(task.id, { durationMinutes: preset })}
            >
              {formatDuration(preset)}
            </Button>
          ))}
          <Input
            type="number"
            min={0}
            value={customDuration}
            placeholder="Custom (min)"
            onChange={(event) => setCustomDuration(event.target.value)}
            onBlur={commitCustomDuration}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
              }
            }}
            className="h-9 w-28"
          />
        </div>
      </div>

      <p className={cn('text-sm', scheduleLabel ? 'text-foreground' : 'text-muted-foreground')}>
        {scheduleLabel ?? 'Set a date, time, and duration to schedule this task.'}
      </p>
    </div>
  )
}
