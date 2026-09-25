import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { Draggable, Droppable } from '@hello-pangea/dnd'
import { useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useCompletedTasks } from '@/hooks/useTasks'
import type { Column, Task } from '@/types/entities'
import { AddTaskInline } from './AddTaskInline'
import { ColumnHeader } from './ColumnHeader'
import { DeleteColumnDialog } from './DeleteColumnDialog'
import { TaskCard } from './TaskCard'

interface ColumnContainerProps {
  column: Column
  activeTasks: Task[]
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  onOpenTask: (taskId: string) => void
}

export function ColumnContainer({ column, activeTasks, dragHandleProps, onOpenTask }: ColumnContainerProps) {
  const completedTasks = useCompletedTasks(column.id)
  const [deleteTarget, setDeleteTarget] = useState<Column | null>(null)

  return (
    <div className="flex w-72 shrink-0 flex-col gap-2 rounded-lg border bg-muted/30 p-2">
      <ColumnHeader column={column} dragHandleProps={dragHandleProps} onRequestDelete={() => setDeleteTarget(column)} />

      <Droppable droppableId={column.id} type="TASK">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex min-h-[8px] flex-col gap-2">
            {activeTasks.map((task, index) => (
              <Draggable draggableId={task.id} index={index} key={task.id}>
                {(dragProvided, dragSnapshot) => (
                  <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                    <TaskCard
                      task={task}
                      dragHandleProps={dragProvided.dragHandleProps}
                      isDragging={dragSnapshot.isDragging}
                      onOpen={() => onOpenTask(task.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <AddTaskInline categoryId={column.categoryId} columnId={column.id} />

      <Accordion type="single" collapsible>
        <AccordionItem value="done" className="border-none">
          <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
            Done ({completedTasks.length})
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2 pb-0">
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} onOpen={() => onOpenTask(task.id)} />
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <DeleteColumnDialog column={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  )
}
