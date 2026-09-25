import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { deleteCategory, getCategoryChildCounts } from '@/db/categories'
import type { Category } from '@/types/entities'

interface DeleteCategoryDialogProps {
  category: Category | null
  onClose: () => void
  onDeleted: (id: string) => void
}

export function DeleteCategoryDialog({ category, onClose, onDeleted }: DeleteCategoryDialogProps) {
  const [counts, setCounts] = useState({ columns: 0, tasks: 0 })

  useEffect(() => {
    if (!category) return
    void getCategoryChildCounts(category.id).then(setCounts)
  }, [category])

  return (
    <AlertDialog open={category !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{category?.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            {counts.columns > 0
              ? `This category has ${counts.columns} column${counts.columns === 1 ? '' : 's'} and ${counts.tasks} task${counts.tasks === 1 ? '' : 's'}. Deleting it will permanently remove them all. This cannot be undone.`
              : 'This will permanently delete the category. This cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive' })}
            onClick={() => {
              if (!category) return
              void deleteCategory(category.id)
              onDeleted(category.id)
              onClose()
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
