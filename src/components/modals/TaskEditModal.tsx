import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useTask } from '@/hooks/useTask'
import { TaskEditForm } from './TaskEditForm'

interface TaskEditModalProps {
  taskId: string | null
  onClose: () => void
}

export function TaskEditModal({ taskId, onClose }: TaskEditModalProps) {
  const task = useTask(taskId ?? undefined)

  return (
    <Dialog open={taskId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        {task && <TaskEditForm key={task.id} task={task} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
