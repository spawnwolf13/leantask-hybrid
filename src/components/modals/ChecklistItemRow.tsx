import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { GripVertical, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { deleteChecklistItem, updateChecklistItem } from '@/db/checklistItems'
import { cn } from '@/lib/utils'
import type { ChecklistItem } from '@/types/entities'

interface ChecklistItemRowProps {
  item: ChecklistItem
  dragHandleProps?: DraggableProvidedDragHandleProps | null
}

export function ChecklistItemRow({ item, dragHandleProps }: ChecklistItemRowProps) {
  const [text, setText] = useState(item.text)
  const [duration, setDuration] = useState(item.durationMinutes?.toString() ?? '')

  function commitText() {
    const trimmed = text.trim()
    if (trimmed && trimmed !== item.text) {
      void updateChecklistItem(item.id, { text: trimmed })
    } else {
      setText(item.text)
    }
  }

  function commitDuration() {
    const parsed = Number.parseInt(duration, 10)
    const nextValue = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
    if (nextValue !== item.durationMinutes) {
      void updateChecklistItem(item.id, { durationMinutes: nextValue })
    }
    setDuration(nextValue?.toString() ?? '')
  }

  return (
    <div className="flex items-center gap-2">
      <span {...dragHandleProps} className="cursor-grab text-muted-foreground active:cursor-grabbing">
        <GripVertical className="size-4" />
      </span>
      <Checkbox
        checked={item.isCompleted}
        onCheckedChange={(checked) => void updateChecklistItem(item.id, { isCompleted: checked === true })}
      />
      <Input
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commitText}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          }
        }}
        className={cn('h-8 flex-1', item.isCompleted && 'text-muted-foreground line-through')}
      />
      <Input
        type="number"
        min={0}
        value={duration}
        placeholder="min"
        onChange={(event) => setDuration(event.target.value)}
        onBlur={commitDuration}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          }
        }}
        className="h-8 w-16 shrink-0"
      />
      <button
        type="button"
        onClick={() => void deleteChecklistItem(item.id)}
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}
