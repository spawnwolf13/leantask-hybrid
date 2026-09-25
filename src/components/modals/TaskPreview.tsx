import { format, parseISO } from 'date-fns'
import { CalendarClock, CalendarDays, Flag, Hourglass, Repeat } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DialogTitle } from '@/components/ui/dialog'
import { useChecklistItems } from '@/hooks/useChecklistItems'
import { useObjectUrl } from '@/hooks/useObjectUrl'
import { describeRecurrence } from '@/utils/recurrence'
import { formatDuration } from '@/utils/schedule'
import type { Task } from '@/types/entities'

function formatDate(date: string): string {
  return format(parseISO(date), 'EEE, MMM d, yyyy')
}

function endTimeLabel(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const total = (hours * 60 + minutes + durationMinutes) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function CoverImage({ blob }: { blob: Blob }) {
  const url = useObjectUrl(blob)
  if (!url) return null
  return <img src={url} alt="" className="max-h-64 w-full rounded-lg object-cover" />
}

export function TaskPreview({ task }: { task: Task }) {
  const checklistItems = useChecklistItems(task.id)
  const completedCount = checklistItems.filter((item) => item.isCompleted).length
  const progress = checklistItems.length > 0 ? Math.round((completedCount / checklistItems.length) * 100) : 0
  const cover = task.images[0]

  const timeLabel = task.startTime
    ? task.durationMinutes
      ? `${task.startTime} - ${endTimeLabel(task.startTime, task.durationMinutes)}`
      : task.startTime
    : null

  const hasMeta = task.startDate || task.dueDate || timeLabel || task.durationMinutes || task.recurrence

  return (
    <div className="max-h-[65vh] space-y-4 overflow-y-auto py-2">
      {cover && <CoverImage blob={cover.blob} />}

      <DialogTitle
        className={task.isCompleted ? 'text-2xl font-bold leading-tight line-through opacity-70' : 'text-2xl font-bold leading-tight'}
        style={task.color ? { color: task.color } : undefined}
      >
        {task.title}
      </DialogTitle>

      {task.description?.trim() ? (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.description}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No description.</p>
      )}

      {hasMeta && (
        <div className="flex flex-wrap gap-2">
          {task.startDate && (
            <Badge variant="secondary" className="gap-1.5 font-medium">
              <CalendarDays className="size-3.5" />
              Start: {formatDate(task.startDate)}
            </Badge>
          )}
          {task.dueDate && (
            <Badge variant="secondary" className="gap-1.5 font-medium">
              <Flag className="size-3.5" />
              Due: {formatDate(task.dueDate)}
            </Badge>
          )}
          {timeLabel && (
            <Badge variant="secondary" className="gap-1.5 font-medium">
              <CalendarClock className="size-3.5" />
              {timeLabel}
            </Badge>
          )}
          {task.durationMinutes && (
            <Badge variant="secondary" className="gap-1.5 font-medium">
              <Hourglass className="size-3.5" />
              Effort: {formatDuration(task.durationMinutes)}
            </Badge>
          )}
          {task.recurrence && (
            <Badge variant="secondary" className="gap-1.5 font-medium">
              <Repeat className="size-3.5" />
              {describeRecurrence(task.recurrence)}
            </Badge>
          )}
        </div>
      )}

      {checklistItems.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <h3 className="font-medium">Subtasks</h3>
            <span className="text-muted-foreground">
              {completedCount}/{checklistItems.length} done
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%`, ...(task.color ? { backgroundColor: task.color } : {}) }}
            />
          </div>
          <ul className="space-y-1.5">
            {checklistItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={item.isCompleted} disabled aria-label={item.text} />
                <span className={item.isCompleted ? 'text-muted-foreground line-through' : ''}>{item.text}</span>
                {item.durationMinutes && (
                  <span className="ml-auto text-xs text-muted-foreground">{formatDuration(item.durationMinutes)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
