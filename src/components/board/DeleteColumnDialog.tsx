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
import { getColumnTaskCount } from '@/db/columns'
import { deleteColumnWithUndo } from '@/services/undoDelete'
import type { Column } from '@/types/entities'

interface DeleteColumnDialogProps {
  column: Column | null
  onClose: () => void
}

export function DeleteColumnDialog({ column, onClose }: DeleteColumnDialogProps) {
  const [taskCount, setTaskCount] = useState(0)

  useEffect(() => {
    if (!column) return
    void getColumnTaskCount(column.id).then(setTaskCount)
  }, [column])

  return (
    <AlertDialog open={column !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{column?.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            {taskCount > 0
              ? `This column contains ${taskCount} task${taskCount === 1 ? '' : 's'}. Deleting it will permanently remove all tasks and their logged time. Are you sure?`
              : 'This will permanently delete the column. You can undo this from the toast for a few seconds after deleting.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive' })}
            onClick={() => {
              if (!column) return
              onClose()
              void deleteColumnWithUndo(column.id)
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
