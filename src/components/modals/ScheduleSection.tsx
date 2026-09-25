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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function ScheduleSection({ task }: ScheduleSectionProps) {
  const [startDate, setStartDate] = useState(task.startDate ?? '')
  const [startTime, setStartTime] = useState(task.startTime ?? '')
  const [hours, setHours] = useState(Math.floor((task.durationMinutes ?? 0) / 60).toString())
  const [minutes, setMinutes] = useState(((task.durationMinutes ?? 0) % 60).toString())

  function commitDuration(nextHours: string, nextMinutes: string) {
    const h = clamp(Number.parseInt(nextHours, 10) || 0, 0, 24)
    const m = clamp(Number.parseInt(nextMinutes, 10) || 0, 0, 59)
    const total = h * 60 + m
    setHours(h.toString())
    setMinutes(m.toString())
    void updateTask(task.id, { durationMinutes: total > 0 ? total : undefined })
  }

  function applyPreset(preset: number) {
    setHours(Math.floor(preset / 60).toString())
    setMinutes((preset % 60).toString())
    void updateTask(task.id, { durationMinutes: preset })
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
              onClick={() => applyPreset(preset)}
            >
              {formatDuration(preset)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={24}
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              onBlur={() => commitDuration(hours, minutes)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  event.currentTarget.blur()
                }
              }}
              className="h-9 w-16"
            />
            <span className="text-sm text-muted-foreground">h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              onBlur={() => commitDuration(hours, minutes)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  event.currentTarget.blur()
                }
              }}
              className="h-9 w-16"
            />
            <span className="text-sm text-muted-foreground">m</span>
          </div>
        </div>
      </div>

      <p className={cn('text-sm', scheduleLabel ? 'text-foreground' : 'text-muted-foreground')}>
        {scheduleLabel ?? 'Set a date, time, and duration to schedule this task.'}
      </p>
    </div>
  )
}
