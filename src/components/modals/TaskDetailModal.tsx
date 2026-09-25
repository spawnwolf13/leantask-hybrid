import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useTask } from '@/hooks/useTask'
import { TaskEditForm } from './TaskEditForm'

export type TaskModalTab = 'edit' | 'preview'

interface TaskDetailModalProps {
  taskId: string | null
  defaultTab: TaskModalTab
  onClose: () => void
}

export function TaskDetailModal({ taskId, defaultTab, onClose }: TaskDetailModalProps) {
  const task = useTask(taskId ?? undefined)

  return (
    <Dialog open={taskId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        {task && <TaskEditForm key={task.id} task={task} defaultTab={defaultTab} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
