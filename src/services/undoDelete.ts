import { toast } from 'sonner'
import {
  captureColumnSnapshot,
  deleteColumn,
  restoreColumnSnapshot,
  type ColumnDeletionSnapshot,
} from '@/db/columns'
import { captureTaskSnapshot, deleteTask, restoreTaskSnapshot, type TaskDeletionSnapshot } from '@/db/tasks'

const UNDO_TOAST_ID = 'task-delete-undo'
const UNDO_WINDOW_MS = 7000

type PendingDeletion =
  | { kind: 'task'; snapshot: TaskDeletionSnapshot }
  | { kind: 'column'; snapshot: ColumnDeletionSnapshot }

let pendingDeletion: PendingDeletion | null = null
let pendingTimeoutId: ReturnType<typeof setTimeout> | null = null

function finalizePendingDeletion(): void {
  if (pendingTimeoutId) clearTimeout(pendingTimeoutId)
  pendingTimeoutId = null
  pendingDeletion = null
}

async function undoPendingDeletion(): Promise<void> {
  if (!pendingDeletion) return
  const deletion = pendingDeletion
  finalizePendingDeletion()
  if (deletion.kind === 'task') {
    await restoreTaskSnapshot(deletion.snapshot)
  } else {
    await restoreColumnSnapshot(deletion.snapshot)
  }
  toast.dismiss(UNDO_TOAST_ID)
}

function showUndoToast(message: string): void {
  toast(message, {
    id: UNDO_TOAST_ID,
    position: 'bottom-center',
    duration: UNDO_WINDOW_MS,
    action: { label: 'Undo', onClick: () => void undoPendingDeletion() },
  })
}

/** Deletes a task immediately, but keeps a snapshot for a few seconds so the delete can be undone. */
export async function deleteTaskWithUndo(taskId: string): Promise<void> {
  const snapshot = await captureTaskSnapshot(taskId)
  if (!snapshot) return

  await deleteTask(taskId)
  finalizePendingDeletion()
  pendingDeletion = { kind: 'task', snapshot }
  pendingTimeoutId = setTimeout(finalizePendingDeletion, UNDO_WINDOW_MS)

  showUndoToast(`Task "${snapshot.task.title}" deleted.`)
}

/** Deletes a column and its tasks immediately, keeping a snapshot for a few seconds so it can be undone. */
export async function deleteColumnWithUndo(columnId: string): Promise<void> {
  const snapshot = await captureColumnSnapshot(columnId)
  if (!snapshot) return

  await deleteColumn(columnId)
  finalizePendingDeletion()
  pendingDeletion = { kind: 'column', snapshot }
  pendingTimeoutId = setTimeout(finalizePendingDeletion, UNDO_WINDOW_MS)

  const count = snapshot.tasks.length
  showUndoToast(`Column "${snapshot.column.name}" and ${count} task${count === 1 ? '' : 's'} deleted.`)
}

// Global Ctrl/Cmd+Z: undo the pending task or column deletion if its toast is still showing.
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (event) => {
    if (!pendingDeletion) return
    const isUndoShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z'
    if (!isUndoShortcut) return
    event.preventDefault()
    void undoPendingDeletion()
  })
}
