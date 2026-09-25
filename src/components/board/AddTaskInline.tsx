import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTask } from '@/db/tasks'

interface AddTaskInlineProps {
  categoryId: string
  columnId: string
}

export function AddTaskInline({ categoryId, columnId }: AddTaskInlineProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')

  function reset() {
    setTitle('')
    setIsAdding(false)
  }

  async function commit() {
    const trimmed = title.trim()
    if (!trimmed) {
      reset()
      return
    }
    await createTask(categoryId, columnId, trimmed)
    setTitle('')
  }

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="justify-start text-muted-foreground"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="size-4" />
        Add task
      </Button>
    )
  }

  return (
    <Input
      autoFocus
      value={title}
      placeholder="Task title…"
      onChange={(event) => setTitle(event.target.value)}
      onBlur={() => void commit().then(() => setIsAdding(false))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          void commit()
        } else if (event.key === 'Escape') {
          reset()
        }
      }}
    />
  )
}
