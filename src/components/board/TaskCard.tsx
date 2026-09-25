import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { CalendarDays, CheckSquare, GripVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toggleTaskCompletion } from '@/db/tasks'
import { useChecklistItems } from '@/hooks/useChecklistItems'
import { useObjectUrl } from '@/hooks/useObjectUrl'
import { cn } from '@/lib/utils'
import { formatScheduleBadge } from '@/utils/schedule'
import type { Task } from '@/types/entities'

interface TaskCardProps {
  task: Task
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  isDragging?: boolean
  onOpen: () => void
}

export function TaskCard({ task, dragHandleProps, isDragging, onOpen }: TaskCardProps) {
  const checklistItems = useChecklistItems(task.id)
  const thumbnailUrl = useObjectUrl(task.images[0]?.blob)

  const completedCount = checklistItems.filter((item) => item.isCompleted).length
  const checklistMinutes = checklistItems.reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0)
  const scheduleLabel = task.startDate && task.startTime ? formatScheduleBadge(task.startDate, task.startTime, task.durationMinutes) : null

  return (
    <Card
      onClick={onOpen}
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

      {thumbnailUrl && (
        <img src={thumbnailUrl} alt="" className="mt-2 h-16 w-full rounded object-cover" />
      )}

      {(scheduleLabel || checklistItems.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {scheduleLabel && (
            <Badge variant="outline" className="gap-1 text-[11px] font-normal text-muted-foreground">
              <CalendarDays className="size-3" />
              {scheduleLabel}
            </Badge>
          )}
          {checklistItems.length > 0 && (
            <Badge variant="outline" className="gap-1 text-[11px] font-normal text-muted-foreground">
              <CheckSquare className="size-3" />✓ {completedCount}/{checklistItems.length}
              {checklistMinutes > 0 && ` (${checklistMinutes}m)`}
            </Badge>
          )}
        </div>
      )}
    </Card>
  )
}
