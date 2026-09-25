import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { CalendarDays, Clock, GripVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toggleTaskCompletion } from '@/db/tasks'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/entities'

interface TaskCardProps {
  task: Task
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  isDragging?: boolean
}

export function TaskCard({ task, dragHandleProps, isDragging }: TaskCardProps) {
  return (
    <Card
      className={cn(
        'p-3 transition-shadow',
        isDragging && 'shadow-lg ring-2 ring-ring',
        task.isCompleted && 'bg-muted/50',
      )}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          checked={task.isCompleted}
          onCheckedChange={(checked) => void toggleTaskCompletion(task.id, checked === true)}
          className="mt-0.5"
        />
        <span
          className={cn(
            'flex-1 text-sm leading-snug',
            task.isCompleted && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </span>
        {dragHandleProps && (
          <span {...dragHandleProps} className="cursor-grab text-muted-foreground active:cursor-grabbing">
            <GripVertical className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-2 flex gap-1.5">
        <Badge variant="outline" className="gap-1 text-[11px] font-normal text-muted-foreground">
          <CalendarDays className="size-3" />
          No date
        </Badge>
        <Badge variant="outline" className="gap-1 text-[11px] font-normal text-muted-foreground">
          <Clock className="size-3" />—
        </Badge>
      </div>
    </Card>
  )
}
