import { db } from './db'
import type { ChecklistItem, Column, Task } from '@/types/entities'

export async function createColumn(categoryId: string, name: string): Promise<string> {
  const id = crypto.randomUUID()
  const now = Date.now()

  await db.transaction('rw', db.columns, async () => {
    const columns = await db.columns.where({ categoryId }).toArray()
    const maxOrder = columns.reduce((max, column) => Math.max(max, column.orderIndex), -1)
    await db.columns.add({ id, categoryId, name, orderIndex: maxOrder + 1, createdAt: now, updatedAt: now })
  })

  return id
}

export async function renameColumn(id: string, name: string): Promise<void> {
  await db.columns.update(id, { name, updatedAt: Date.now() })
}

export async function reorderColumns(orderedColumnIds: string[]): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.columns, async () => {
    await Promise.all(
      orderedColumnIds.map((id, index) => db.columns.update(id, { orderIndex: index, updatedAt: now })),
    )
  })
}

export async function getColumnTaskCount(columnId: string): Promise<number> {
  return db.tasks.where({ columnId }).count()
}

export async function deleteColumn(id: string): Promise<void> {
  await db.transaction('rw', db.columns, db.tasks, db.checklistItems, db.syncQueue, async () => {
    const taskIds = await db.tasks.where({ columnId: id }).primaryKeys()

    await db.checklistItems.where('taskId').anyOf(taskIds).delete()
    await db.syncQueue.where('taskId').anyOf(taskIds).delete()
    await db.tasks.bulkDelete(taskIds)
    await db.columns.delete(id)
  })
}

export interface ColumnDeletionSnapshot {
  column: Column
  tasks: Task[]
  checklistItems: ChecklistItem[]
}

/** Captures a column, its tasks, and their checklists exactly as stored, for a verbatim undo. */
export async function captureColumnSnapshot(columnId: string): Promise<ColumnDeletionSnapshot | undefined> {
  const column = await db.columns.get(columnId)
  if (!column) return undefined
  const tasks = await db.tasks.where({ columnId }).toArray()
  const taskIds = tasks.map((task) => task.id)
  const checklistItems = taskIds.length > 0 ? await db.checklistItems.where('taskId').anyOf(taskIds).toArray() : []
  return { column, tasks, checklistItems }
}

/** Re-inserts a captured column and its tasks/checklists with their original ids, order, and timer state. */
export async function restoreColumnSnapshot(snapshot: ColumnDeletionSnapshot): Promise<void> {
  await db.transaction('rw', db.columns, db.tasks, db.checklistItems, async () => {
    await db.columns.add(snapshot.column)
    if (snapshot.tasks.length > 0) await db.tasks.bulkAdd(snapshot.tasks)
    if (snapshot.checklistItems.length > 0) await db.checklistItems.bulkAdd(snapshot.checklistItems)
  })
}
