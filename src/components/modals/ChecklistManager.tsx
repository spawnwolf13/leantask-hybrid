import type { DropResult } from '@hello-pangea/dnd'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createChecklistItem, reorderChecklistItems } from '@/db/checklistItems'
import { updateTask } from '@/db/tasks'
import { useChecklistItems } from '@/hooks/useChecklistItems'
import { formatDuration } from '@/utils/schedule'
import type { Task } from '@/types/entities'
import { ChecklistItemRow } from './ChecklistItemRow'

interface ChecklistManagerProps {
  task: Task
}

export function ChecklistManager({ task }: ChecklistManagerProps) {
  const items = useChecklistItems(task.id)
  const [newText, setNewText] = useState('')
  const [newDuration, setNewDuration] = useState('')

  const totalMinutes = items.reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0)
  const exceedsTaskDuration = task.durationMinutes !== undefined && totalMinutes > task.durationMinutes

  async function handleAdd() {
    const trimmed = newText.trim()
    if (!trimmed) return
    const parsed = Number.parseInt(newDuration, 10)
    const durationMinutes = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
    await createChecklistItem(task.id, trimmed, durationMinutes)
    setNewText('')
    setNewDuration('')
  }

  function handleDragEnd(result: DropResult) {
    const { source, destination } = result
    if (!destination || source.index === destination.index) return
    const reordered = Array.from(items)
    const [moved] = reordered.splice(source.index, 1)
    reordered.splice(destination.index, 0, moved)
    void reorderChecklistItems(reordered.map((item) => item.id))
  }

  return (
    <div className="space-y-2">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="checklist" type="CHECKLIST_ITEM">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-1.5">
              {items.map((item, index) => (
                <Draggable draggableId={item.id} index={index} key={item.id}>
                  {(dragProvided, dragSnapshot) => {
                    const row = (
                      <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                        <ChecklistItemRow item={item} dragHandleProps={dragProvided.dragHandleProps} />
                      </div>
                    )
                    // Escape the Dialog's translate(-50%,-50%) transform while dragging —
                    // that transform breaks @hello-pangea/dnd's coordinate math, offsetting
                    // the dragged clone far from the cursor. Portaling to body fixes it.
                    return dragSnapshot.isDragging ? createPortal(row, document.body) : row
                  }}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex items-center gap-2">
        <Input
          value={newText}
          placeholder="Add checklist item…"
          onChange={(event) => setNewText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void handleAdd()
            }
          }}
          className="h-8 flex-1"
        />
        <Input
          type="number"
          min={0}
          value={newDuration}
          placeholder="min"
          onChange={(event) => setNewDuration(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void handleAdd()
            }
          }}
          className="h-8 w-16 shrink-0"
        />
        <Button type="button" size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => void handleAdd()}>
          <Plus className="size-4" />
        </Button>
      </div>

      {exceedsTaskDuration && task.durationMinutes !== undefined && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <span>
            ⚠️ Checklist items total ({totalMinutes}m) exceed task duration ({task.durationMinutes}m)
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 border-amber-400 text-amber-800 hover:bg-amber-100 dark:text-amber-200"
            onClick={() => void updateTask(task.id, { durationMinutes: totalMinutes })}
          >
            Adjust task duration to match checklist ({totalMinutes}m)
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {items.filter((item) => item.isCompleted).length}/{items.length} complete
          {totalMinutes > 0 && ` · ${formatDuration(totalMinutes)} total`}
        </p>
      )}
    </div>
  )
}
