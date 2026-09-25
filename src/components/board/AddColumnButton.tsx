import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createColumn } from '@/db/columns'

interface AddColumnButtonProps {
  categoryId: string
}

export function AddColumnButton({ categoryId }: AddColumnButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')

  async function commit() {
    const trimmed = name.trim()
    setIsAdding(false)
    setName('')
    if (trimmed) {
      await createColumn(categoryId, trimmed)
    }
  }

  if (!isAdding) {
    return (
      <Button
        variant="outline"
        className="h-10 w-72 shrink-0 justify-start text-muted-foreground"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="size-4" />
        Add column
      </Button>
    )
  }

  return (
    <Input
      autoFocus
      value={name}
      placeholder="Column name…"
      onChange={(event) => setName(event.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          void commit()
        } else if (event.key === 'Escape') {
          setIsAdding(false)
          setName('')
        }
      }}
      className="h-10 w-72 shrink-0"
    />
  )
}
