import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { format, parseISO } from 'date-fns'
import { CalendarDays, CheckSquare, Copy, Flag, GripVertical, MoreHorizontal, Repeat, Timer, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteTaskDialog } from '@/components/modals/DeleteTaskDialog'
import { deleteTask, duplicateTask, toggleTaskCompletion } from '@/db/tasks'
import { useChecklistItems } from '@/hooks/useChecklistItems'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'
import { useObjectUrl } from '@/hooks/useObjectUrl'
import { cn } from '@/lib/utils'
import { describeRecurrence } from '@/utils/recurrence'
import { formatDuration, formatScheduleBadge } from '@/utils/schedule'
import { stripMarkdown } from '@/utils/stripMarkdown'
import type { Task } from '@/types/entities'

interface TaskCardProps {
  task: Task
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  isDragging?: boolean
  onOpen: () => void
}

export function TaskCard({ task, dragHandleProps, isDragging, onOpen }: TaskCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const checklistItems = useChecklistItems(task.id)
  const thumbnailUrl = useObjectUrl(task.images[0]?.blob)
  const elapsedSeconds = useElapsedSeconds(task)
  const isTimerRunning = Boolean(task.timerStartedAt)

  const completedCount = checklistItems.filter((item) => item.isCompleted).length
  const checklistMinutes = checklistItems.reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0)
  const scheduleLabel = task.startDate && task.startTime ? formatScheduleBadge(task.startDate, task.startTime, task.durationMinutes) : null
  const descriptionSnippet = task.description ? stripMarkdown(task.description) : null
  const showTimerBadge = elapsedSeconds > 0 || isTimerRunning

  return (
    <>
    <Card
      onClick={onOpen}
      style={task.color ? { borderLeftColor: task.color, borderLeftWidth: 4 } : undefined}
      className={cn(
        'cursor-pointer p-3 transition-shadow hover:shadow-md',
        isDragging && 'shadow-lg ring-2 ring-ring',
        task.isCompleted && 'bg-muted/50',
      )}
    >
      <div className="flex items-start gap-2">
        <span onClick={(event) => event.stopPropagation()} className="mt-0.5">
          <Checkbox
            checked={task.isCompleted}
            onCheckedChange={(checked) => void toggleTaskCompletion(task.id, checked === true)}
          />
        </span>
        <span
          className={cn(
            'flex-1 text-sm leading-snug',
            task.isCompleted && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Task actions"
              onClick={(event) => event.stopPropagation()}
              className="rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenuItem onSelect={() => void duplicateTask(task.id)}>
              <Copy className="size-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {dragHandleProps && (
          <span
            {...dragHandleProps}
            onClick={(event) => event.stopPropagation()}
            className="cursor-grab text-muted-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </span>
        )}
      </div>

      {descriptionSnippet && (
        <p className="mt-1 line-clamp-2 pl-6 text-xs text-muted-foreground">{descriptionSnippet}</p>
      )}

      {thumbnailUrl && (
        <img src={thumbnailUrl} alt="" className="mt-2 h-16 w-full rounded object-cover" />
      )}

      {(scheduleLabel || task.dueDate || task.recurrence || checklistItems.length > 0 || showTimerBadge) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {scheduleLabel && (
            <Badge variant="outline" className="gap-1 text-[11px] font-normal text-muted-foreground">
              <CalendarDays className="size-3" />
              {scheduleLabel}
            </Badge>
          )}
          {task.dueDate && (
            <Badge variant="outline" className="gap-1 text-[11px] font-normal text-muted-foreground">
              <Flag className="size-3" />
              Due {format(parseISO(task.dueDate), 'MMM d')}
            </Badge>
          )}
          {task.recurrence && (
            <Badge variant="outline" className="gap-1 text-[11px] font-normal text-muted-foreground">
              <Repeat className="size-3" />
              {describeRecurrence(task.recurrence)}
            </Badge>
          )}
          {checklistItems.length > 0 && (
            <Badge variant="outline" className="gap-1 text-[11px] font-normal text-muted-foreground">
              <CheckSquare className="size-3" />✓ {completedCount}/{checklistItems.length}
              {checklistMinutes > 0 && ` (${checklistMinutes}m)`}
            </Badge>
          )}
          {showTimerBadge && (
            <Badge
              variant="outline"
              className={cn(
                'gap-1 text-[11px] font-normal',
                isTimerRunning ? 'border-emerald-400 text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
              )}
            >
              {isTimerRunning ? (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
              ) : (
                <Timer className="size-3" />
              )}
              {formatDuration(Math.round(elapsedSeconds / 60))}
            </Badge>
          )}
        </div>
      )}
    </Card>
    <DeleteTaskDialog
      open={isDeleteOpen}
      taskTitle={task.title}
      onCancel={() => setIsDeleteOpen(false)}
      onConfirm={() => {
        setIsDeleteOpen(false)
        void deleteTask(task.id)
      }}
    />
    </>
  )
}
