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
import { formatStopwatch } from '@/utils/stopwatch'

interface ResetTimerDialogProps {
  open: boolean
  elapsedSeconds: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ResetTimerDialog({ open, elapsedSeconds, onOpenChange, onConfirm }: ResetTimerDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset time tracker?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently clear the {formatStopwatch(elapsedSeconds)} logged for this task. This cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={onConfirm}>
            Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
