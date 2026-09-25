import { db } from './db'

export async function createChecklistItem(
  taskId: string,
  text: string,
  durationMinutes?: number,
): Promise<string> {
  const id = crypto.randomUUID()
  const now = Date.now()

  await db.transaction('rw', db.checklistItems, async () => {
    const items = await db.checklistItems.where('taskId').equals(taskId).toArray()
    const maxOrder = items.reduce((max, item) => Math.max(max, item.orderIndex), -1)

    await db.checklistItems.add({
      id,
      taskId,
      text,
      durationMinutes,
      isCompleted: false,
      orderIndex: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    })
  })

  return id
}

interface ChecklistItemPatch {
  text?: string
  durationMinutes?: number
  isCompleted?: boolean
}

export async function updateChecklistItem(id: string, patch: ChecklistItemPatch): Promise<void> {
  await db.checklistItems.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteChecklistItem(id: string): Promise<void> {
  await db.checklistItems.delete(id)
}

export async function reorderChecklistItems(orderedIds: string[]): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.checklistItems, async () => {
    await Promise.all(
      orderedIds.map((id, index) => db.checklistItems.update(id, { orderIndex: index, updatedAt: now })),
    )
  })
}
