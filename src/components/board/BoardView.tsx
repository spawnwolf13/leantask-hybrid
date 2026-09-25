import type { DropResult } from '@hello-pangea/dnd'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { useMemo, useState } from 'react'
import { reorderColumns } from '@/db/columns'
import { moveTask } from '@/db/tasks'
import { useCategories } from '@/hooks/useCategories'
import { useColumns } from '@/hooks/useColumns'
import { useActiveTasksForCategory } from '@/hooks/useTasks'
import type { Task } from '@/types/entities'
import { AddColumnButton } from './AddColumnButton'
import { CategoryBar } from './CategoryBar'
import { ColumnContainer } from './ColumnContainer'

export function BoardView() {
  const categories = useCategories()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined)

  // Derived during render rather than synced via effect: falls back to the
  // first category whenever the selection is unset or its category was deleted.
  const activeCategoryId = categories.some((category) => category.id === selectedCategoryId)
    ? selectedCategoryId
    : categories[0]?.id

  const columns = useColumns(activeCategoryId)
  const activeTasks = useActiveTasksForCategory(activeCategoryId)

  const activeTasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of activeTasks) {
      const list = map.get(task.columnId)
      if (list) list.push(task)
      else map.set(task.columnId, [task])
    }
    return map
  }, [activeTasks])

  function handleDragEnd(result: DropResult) {
    const { source, destination, type, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    if (type === 'COLUMN') {
      const reordered = columns.map((column) => column.id)
      const [moved] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, moved)
      void reorderColumns(reordered)
      return
    }

    const sourceColumnId = source.droppableId
    const destinationColumnId = destination.droppableId
    const sourceTasks = activeTasksByColumn.get(sourceColumnId) ?? []

    if (sourceColumnId === destinationColumnId) {
      const reordered = Array.from(sourceTasks)
      const [moved] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, moved)
      void moveTask({
        taskId: draggableId,
        destinationColumnId,
        orderedSourceTaskIds: [],
        orderedDestinationTaskIds: reordered.map((task) => task.id),
      })
      return
    }

    const destinationTasks = activeTasksByColumn.get(destinationColumnId) ?? []
    const newSource = Array.from(sourceTasks)
    const [moved] = newSource.splice(source.index, 1)
    const newDestination = Array.from(destinationTasks)
    newDestination.splice(destination.index, 0, moved)

    void moveTask({
      taskId: draggableId,
      destinationColumnId,
      orderedSourceTaskIds: newSource.map((task) => task.id),
      orderedDestinationTaskIds: newDestination.map((task) => task.id),
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <CategoryBar
        activeCategoryId={activeCategoryId}
        onSelect={setSelectedCategoryId}
        onDeleted={() => setSelectedCategoryId(undefined)}
      />

      {!activeCategoryId ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Create a category to get started.
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="COLUMN">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-1 items-start gap-3 overflow-x-auto p-3"
              >
                {columns.map((column, index) => (
                  <Draggable draggableId={column.id} index={index} key={column.id}>
                    {(dragProvided) => (
                      <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                        <ColumnContainer
                          column={column}
                          activeTasks={activeTasksByColumn.get(column.id) ?? []}
                          dragHandleProps={dragProvided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <AddColumnButton categoryId={activeCategoryId} />
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  )
}
