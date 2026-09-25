import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCategory, renameCategory } from '@/db/categories'
import { useCategories } from '@/hooks/useCategories'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/entities'
import { DeleteCategoryDialog } from './DeleteCategoryDialog'

interface CategoryBarProps {
  activeCategoryId: string | undefined
  onSelect: (categoryId: string) => void
  onDeleted: (categoryId: string) => void
}

export function CategoryBar({ activeCategoryId, onSelect, onDeleted }: CategoryBarProps) {
  const categories = useCategories()
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  async function commitNewCategory() {
    const trimmed = newName.trim()
    setIsAdding(false)
    setNewName('')
    if (trimmed) {
      const id = await createCategory(trimmed)
      onSelect(id)
    }
  }

  async function commitRename(category: Category) {
    const trimmed = editingName.trim()
    setEditingId(null)
    if (trimmed && trimmed !== category.name) {
      await renameCategory(category.id, trimmed)
    }
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b bg-background p-2">
      {categories.map((category) => (
        <div
          key={category.id}
          className={cn(
            'group flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5',
            category.id === activeCategoryId ? 'bg-secondary' : 'hover:bg-secondary/50',
          )}
        >
          {editingId === category.id ? (
            <input
              autoFocus
              value={editingName}
              onChange={(event) => setEditingName(event.target.value)}
              onBlur={() => void commitRename(category)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void commitRename(category)
                } else if (event.key === 'Escape') {
                  setEditingId(null)
                }
              }}
              className="w-32 rounded-sm bg-transparent text-sm font-medium outline-none ring-1 ring-ring"
            />
          ) : (
            <button
              type="button"
              onClick={() => onSelect(category.id)}
              onDoubleClick={() => {
                setEditingId(category.id)
                setEditingName(category.name)
              }}
              className="text-sm font-medium"
            >
              {category.name}
            </button>
          )}

          {category.id === activeCategoryId && (
            <button
              type="button"
              onClick={() => setDeleteTarget(category)}
              className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      ))}

      {isAdding ? (
        <Input
          autoFocus
          value={newName}
          placeholder="Category name…"
          onChange={(event) => setNewName(event.target.value)}
          onBlur={() => void commitNewCategory()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void commitNewCategory()
            } else if (event.key === 'Escape') {
              setIsAdding(false)
              setNewName('')
            }
          }}
          className="h-8 w-40"
        />
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="size-4" />
          Add category
        </Button>
      )}

      <DeleteCategoryDialog category={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={onDeleted} />
    </div>
  )
}
