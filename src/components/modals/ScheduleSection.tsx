import { useLiveQuery } from 'dexie-react-hooks'
import { addDays, addMinutes, format, parseISO } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { db } from '@/db/db'
import { updateTask } from '@/db/tasks'
import { cn } from '@/lib/utils'
import { useDirtyFlag } from '@/services/unsavedChanges'
import { DURATION_PRESETS, formatDuration, formatScheduleRange } from '@/utils/schedule'
import type { RecurrenceFrequency, Task, TaskScheduleBlock } from '@/types/entities'

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function fromMinutes(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`
}

const DAY_PILLS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const REPEAT_OPTIONS: { value: RecurrenceFrequency | 'none'; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays (Mon-Fri)' },
  { value: 'custom', label: 'Custom Days' },
]

interface ScheduleSectionProps {
  task: Task
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function ScheduleSection({ task }: ScheduleSectionProps) {
  const [startDate, setStartDate] = useState(task.startDate ?? '')
  const [dueDate, setDueDate] = useState(task.dueDate ?? '')
  const [dateError, setDateError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState(task.startTime ?? '')
  const [hours, setHours] = useState(Math.floor((task.durationMinutes ?? 0) / 60).toString())
  const [minutes, setMinutes] = useState(((task.durationMinutes ?? 0) % 60).toString())
  const [customDays, setCustomDays] = useState<number[]>(task.recurrence?.daysOfWeek ?? [])
  const [blocks, setBlocks] = useState<TaskScheduleBlock[]>(task.scheduleBlocks ?? [])
  const hasBlocks = blocks.length > 0
  const totalBlockMinutes = blocks.reduce((sum, block) => sum + block.durationMinutes, 0)

  // A block "overflows" if it starts after the deadline, or starts on the deadline day but its
  // end time (date + startTime + durationMinutes) spills past midnight into the next day.
  const overflowingBlockIds = new Set(
    dueDate
      ? blocks
          .filter((block) => {
            if (block.date > dueDate) return true
            if (block.date < dueDate) return false
            const end = addMinutes(parseISO(`${block.date}T${block.startTime}`), block.durationMinutes)
            return format(end, 'yyyy-MM-dd') > dueDate
          })
          .map((block) => block.id)
      : [],
  )
  const hasOverflow = overflowingBlockIds.size > 0

  const savedMinutes = task.durationMinutes ?? 0
  useDirtyFlag(
    'schedule',
    startDate !== (task.startDate ?? '') ||
      dueDate !== (task.dueDate ?? '') ||
      startTime !== (task.startTime ?? '') ||
      (Number.parseInt(hours, 10) || 0) * 60 + (Number.parseInt(minutes, 10) || 0) !== savedMinutes ||
      JSON.stringify(blocks) !== JSON.stringify(task.scheduleBlocks ?? []),
  )

  function persistBlocks(nextBlocks: TaskScheduleBlock[]) {
    setBlocks(nextBlocks)
    if (nextBlocks.length === 0) {
      void updateTask(task.id, { scheduleBlocks: [] })
      return
    }
    const earliestDate = nextBlocks.map((block) => block.date).sort()[0]
    const totalMinutes = nextBlocks.reduce((sum, block) => sum + block.durationMinutes, 0)
    setStartDate(earliestDate)
    void updateTask(task.id, { scheduleBlocks: nextBlocks, startDate: earliestDate, durationMinutes: totalMinutes })
  }

  function addBlock() {
    const last = blocks[blocks.length - 1]
    const date = last
      ? format(addDays(parseISO(last.date), 1), 'yyyy-MM-dd')
      : startDate || format(new Date(), 'yyyy-MM-dd')
    persistBlocks([
      ...blocks,
      {
        id: crypto.randomUUID(),
        date,
        startTime: last?.startTime ?? startTime ?? '09:00',
        durationMinutes: last?.durationMinutes || effortMinutes || 60,
      },
    ])
  }

  function updateBlock(id: string, patch: Partial<Omit<TaskScheduleBlock, 'id'>>) {
    persistBlocks(blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)))
  }

  function removeBlock(id: string) {
    persistBlocks(blocks.filter((block) => block.id !== id))
  }

  function changeStartDate(value: string) {
    setStartDate(value)
    if (value && dueDate && dueDate < value) {
      setDateError('Due date cannot be earlier than the start date.')
      return
    }
    setDateError(null)
    void updateTask(task.id, { startDate: value || undefined })
  }

  function changeDueDate(value: string) {
    setDueDate(value)
    if (value && startDate && value < startDate) {
      setDateError('Due date cannot be earlier than the start date.')
      return
    }
    setDateError(null)
    void updateTask(task.id, { dueDate: value || undefined })
  }

  const sameDayTasks = useLiveQuery(
    (): Promise<Task[]> => (startDate ? db.tasks.where('startDate').equals(startDate).toArray() : Promise.resolve([])),
    [startDate],
    [],
  )
  const effortMinutes = (Number.parseInt(hours, 10) || 0) * 60 + (Number.parseInt(minutes, 10) || 0)
  const overlaps =
    !hasBlocks && startTime && effortMinutes > 0
      ? sameDayTasks.filter((other) => {
          if (other.id === task.id || other.isCompleted || !other.startTime || !other.durationMinutes) return false
          const aStart = toMinutes(startTime)
          const aEnd = aStart + effortMinutes
          const bStart = toMinutes(other.startTime)
          const bEnd = bStart + other.durationMinutes
          return aStart < bEnd && aEnd > bStart
        })
      : []

  const repeatValue: RecurrenceFrequency | 'none' = task.recurrence?.frequency ?? 'none'

  function applyRepeat(next: RecurrenceFrequency | 'none') {
    if (next === 'none') {
      void updateTask(task.id, { recurrence: undefined })
    } else if (next === 'custom') {
      void updateTask(task.id, { recurrence: { frequency: 'custom', daysOfWeek: customDays } })
    } else {
      void updateTask(task.id, { recurrence: { frequency: next } })
    }
  }

  function toggleCustomDay(day: number) {
    const next = customDays.includes(day) ? customDays.filter((d) => d !== day) : [...customDays, day].sort()
    setCustomDays(next)
    void updateTask(task.id, { recurrence: { frequency: 'custom', daysOfWeek: next } })
  }

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
      <div className="flex flex-wrap gap-2">
        {!hasBlocks && (
          <div className="min-w-[9rem] flex-1 space-y-1">
            <Label htmlFor="task-start-date">Start Date</Label>
            <Input
              id="task-start-date"
              type="date"
              value={startDate}
              max={dueDate || undefined}
              onChange={(event) => changeStartDate(event.target.value)}
            />
          </div>
        )}
        <div className="min-w-[9rem] flex-1 space-y-1">
          <Label htmlFor="task-due-date">Due Date (Deadline)</Label>
          <Input
            id="task-due-date"
            type="date"
            value={dueDate}
            min={startDate || undefined}
            onChange={(event) => changeDueDate(event.target.value)}
          />
        </div>
        {!hasBlocks && (
          <div className="min-w-[9rem] flex-1 space-y-1">
            <Label htmlFor="task-start-time">Start Time</Label>
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
        )}
      </div>
      {dateError && (
        <p role="alert" className="text-sm text-destructive">
          {dateError}
        </p>
      )}
      {overlaps.map((other) => (
        <div
          key={other.id}
          data-testid="overlap-warning"
          className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300"
        >
          ⚠️ Warning: Overlaps with '{other.title}' ({other.startTime} –{' '}
          {fromMinutes(toMinutes(other.startTime!) + other.durationMinutes!)}). Consider adding a 10–15 min buffer to
          protect your focus.
        </div>
      ))}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Work Sessions</Label>
          <Button type="button" size="sm" variant="outline" onClick={addBlock}>
            <Plus className="size-3.5" />
            {hasBlocks ? 'Add Work Session' : 'Split into Multiple Sessions'}
          </Button>
        </div>
        {hasBlocks && (
          <div className="space-y-2">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className={cn(
                  'flex flex-wrap items-end gap-2 rounded-md border p-2',
                  overflowingBlockIds.has(block.id) && 'border-destructive ring-1 ring-destructive/50',
                )}
              >
                <div className="space-y-1">
                  <Label htmlFor={`block-date-${block.id}`} className="text-xs text-muted-foreground">
                    Session {index + 1} date
                  </Label>
                  <Input
                    id={`block-date-${block.id}`}
                    type="date"
                    value={block.date}
                    max={dueDate || undefined}
                    onChange={(event) => updateBlock(block.id, { date: event.target.value })}
                    className="h-9 w-36"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`block-time-${block.id}`} className="text-xs text-muted-foreground">
                    Start
                  </Label>
                  <Input
                    id={`block-time-${block.id}`}
                    type="time"
                    value={block.startTime}
                    onChange={(event) => updateBlock(block.id, { startTime: event.target.value })}
                    className="h-9 w-28"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Duration</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      value={Math.floor(block.durationMinutes / 60)}
                      onChange={(event) => {
                        const h = clamp(Number.parseInt(event.target.value, 10) || 0, 0, 24)
                        updateBlock(block.id, { durationMinutes: h * 60 + (block.durationMinutes % 60) })
                      }}
                      className="h-9 w-14"
                    />
                    <span className="text-xs text-muted-foreground">h</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={block.durationMinutes % 60}
                      onChange={(event) => {
                        const m = clamp(Number.parseInt(event.target.value, 10) || 0, 0, 59)
                        updateBlock(block.id, {
                          durationMinutes: Math.floor(block.durationMinutes / 60) * 60 + m,
                        })
                      }}
                      className="h-9 w-14"
                    />
                    <span className="text-xs text-muted-foreground">m</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="ml-auto shrink-0 text-muted-foreground hover:text-destructive"
                  title="Remove session"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <p className="text-sm font-medium">
              Σ {formatDuration(totalBlockMinutes)} across {blocks.length} session{blocks.length === 1 ? '' : 's'}
            </p>
            {hasOverflow && (
              <div
                role="alert"
                className="rounded border border-destructive/40 bg-destructive/10 p-2.5 text-xs font-medium text-destructive"
              >
                ⚠️ Deadline Exceeded: Work sessions extend past your deadline (
                {format(parseISO(dueDate), 'MMM d, yyyy')}). Adjust session durations or extend the due date.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label>Estimated Work Effort</Label>
        {hasBlocks ? (
          <p className="text-sm text-muted-foreground">
            Σ {formatDuration(totalBlockMinutes)} across {blocks.length} session{blocks.length === 1 ? '' : 's'} —
            edit individual sessions above to change this.
          </p>
        ) : (
          <>
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
          </>
        )}
      </div>

      <div className="space-y-1">
        <Label>Repeat</Label>
        <div className="flex flex-wrap gap-2">
          {REPEAT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={repeatValue === option.value ? 'default' : 'outline'}
              onClick={() => applyRepeat(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        {repeatValue === 'custom' && (
          <div className="flex gap-1.5 pt-1">
            {DAY_PILLS.map((label, day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleCustomDay(day)}
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                  customDays.includes(day)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!hasBlocks && (
        <p className={cn('text-sm', scheduleLabel ? 'text-foreground' : 'text-muted-foreground')}>
          {scheduleLabel ?? 'Set a date, time, and duration to schedule this task.'}
        </p>
      )}
    </div>
  )
}
