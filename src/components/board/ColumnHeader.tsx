import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { GripVertical, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { renameColumn } from '@/db/columns'
import type { Column } from '@/types/entities'

interface ColumnHeaderProps {
  column: Column
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  onRequestDelete: () => void
}

export function ColumnHeader({ column, dragHandleProps, onRequestDelete }: ColumnHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(column.name)

  function startEditing() {
    setName(column.name)
    setIsEditing(true)
  }

  async function commit() {
    const trimmed = name.trim()
    setIsEditing(false)
    if (trimmed && trimmed !== column.name) {
      await renameColumn(column.id, trimmed)
    }
  }

  function cancel() {
    setName(column.name)
    setIsEditing(false)
  }

  return (
    <div className="flex items-center gap-1 px-1">
      <span {...dragHandleProps} className="cursor-grab text-muted-foreground active:cursor-grabbing">
        <GripVertical className="size-4" />
      </span>

      {isEditing ? (
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void commit()
            } else if (event.key === 'Escape') {
              cancel()
            }
          }}
          className="flex-1 rounded-sm bg-transparent px-1 text-sm font-semibold outline-none ring-1 ring-ring"
        />
      ) : (
        <button
          type="button"
          onDoubleClick={startEditing}
          className="flex-1 truncate px-1 text-left text-sm font-semibold"
        >
          {column.name}
        </button>
      )}

      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onRequestDelete}>
        <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  )
}
