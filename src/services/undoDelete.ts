import { toast } from 'sonner'
import { captureTaskSnapshot, deleteTask, restoreTaskSnapshot, type TaskDeletionSnapshot } from '@/db/tasks'

const UNDO_TOAST_ID = 'task-delete-undo'
const UNDO_WINDOW_MS = 7000

let pendingDeletion: TaskDeletionSnapshot | null = null
let pendingTimeoutId: ReturnType<typeof setTimeout> | null = null

function finalizePendingDeletion(): void {
  if (pendingTimeoutId) clearTimeout(pendingTimeoutId)
  pendingTimeoutId = null
  pendingDeletion = null
}

async function undoPendingDeletion(): Promise<void> {
  if (!pendingDeletion) return
  const snapshot = pendingDeletion
  finalizePendingDeletion()
  await restoreTaskSnapshot(snapshot)
  toast.dismiss(UNDO_TOAST_ID)
}

/** Deletes a task immediately, but keeps a snapshot for a few seconds so the delete can be undone. */
export async function deleteTaskWithUndo(taskId: string): Promise<void> {
  const snapshot = await captureTaskSnapshot(taskId)
  if (!snapshot) return

  await deleteTask(taskId)
  finalizePendingDeletion()
  pendingDeletion = snapshot
  pendingTimeoutId = setTimeout(finalizePendingDeletion, UNDO_WINDOW_MS)

  toast(`Task "${snapshot.task.title}" deleted.`, {
    id: UNDO_TOAST_ID,
    position: 'bottom-center',
    duration: UNDO_WINDOW_MS,
    action: { label: 'Undo', onClick: () => void undoPendingDeletion() },
  })
}

// Global Ctrl/Cmd+Z: undo the pending deletion if its toast is still showing.
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (event) => {
    if (!pendingDeletion) return
    const isUndoShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z'
    if (!isUndoShortcut) return
    event.preventDefault()
    void undoPendingDeletion()
  })
}
