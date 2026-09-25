import { db } from './db'

export async function createCategory(name: string): Promise<string> {
  const id = crypto.randomUUID()
  const now = Date.now()

  await db.transaction('rw', db.categories, async () => {
    const categories = await db.categories.toArray()
    const maxOrder = categories.reduce((max, category) => Math.max(max, category.orderIndex), -1)
    await db.categories.add({ id, name, orderIndex: maxOrder + 1, createdAt: now, updatedAt: now })
  })

  return id
}

export async function renameCategory(id: string, name: string): Promise<void> {
  await db.categories.update(id, { name, updatedAt: Date.now() })
}

export async function getCategoryChildCounts(categoryId: string): Promise<{ columns: number; tasks: number }> {
  const [columns, tasks] = await Promise.all([
    db.columns.where({ categoryId }).count(),
    db.tasks.where({ categoryId }).count(),
  ])
  return { columns, tasks }
}

export async function deleteCategory(id: string): Promise<void> {
  await db.transaction('rw', db.categories, db.columns, db.tasks, db.checklistItems, db.syncQueue, async () => {
    const columnIds = await db.columns.where({ categoryId: id }).primaryKeys()
    const taskIds = await db.tasks.where('columnId').anyOf(columnIds).primaryKeys()

    await db.checklistItems.where('taskId').anyOf(taskIds).delete()
    await db.syncQueue.where('taskId').anyOf(taskIds).delete()
    await db.tasks.bulkDelete(taskIds)
    await db.columns.bulkDelete(columnIds)
    await db.categories.delete(id)
  })
}
