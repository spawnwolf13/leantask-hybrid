import { db } from './db'
import type { ImageAttachment, Task } from '@/types/entities'

export async function createTask(categoryId: string, columnId: string, title: string): Promise<string> {
  const id = crypto.randomUUID()
  const now = Date.now()

  await db.transaction('rw', db.tasks, async () => {
    // isCompleted is boolean and cannot be used as an IndexedDB key, so it's
    // filtered in-memory rather than passed to where() alongside columnId.
    const activeTasks = await db.tasks
      .where('columnId')
      .equals(columnId)
      .and((task) => !task.isCompleted)
      .toArray()
    const maxOrder = activeTasks.reduce((max, task) => Math.max(max, task.orderIndex), -1)

    await db.tasks.add({
      id,
      categoryId,
      columnId,
      title,
      orderIndex: maxOrder + 1,
      isCompleted: false,
      images: [],
      createdAt: now,
      updatedAt: now,
    })
  })

  return id
}

export async function toggleTaskCompletion(taskId: string, isCompleted: boolean): Promise<void> {
  await db.tasks.update(taskId, { isCompleted, updatedAt: Date.now() })
}

type TaskEditableFields = Pick<
  Task,
  'title' | 'description' | 'startDate' | 'startTime' | 'durationMinutes'
>

export async function updateTask(taskId: string, patch: Partial<TaskEditableFields>): Promise<void> {
  await db.tasks.update(taskId, { ...patch, updatedAt: Date.now() })
}

export async function deleteTask(taskId: string): Promise<void> {
  await db.transaction('rw', db.tasks, db.checklistItems, db.syncQueue, async () => {
    await db.checklistItems.where('taskId').equals(taskId).delete()
    await db.syncQueue.where('taskId').equals(taskId).delete()
    await db.tasks.delete(taskId)
  })
}

export async function addTaskImage(taskId: string, image: ImageAttachment): Promise<void> {
  await db.tasks.where('id').equals(taskId).modify((task) => {
    task.images.push(image)
    task.updatedAt = Date.now()
  })
}

export async function removeTaskImage(taskId: string, imageId: string): Promise<void> {
  await db.tasks.where('id').equals(taskId).modify((task) => {
    task.images = task.images.filter((image) => image.id !== imageId)
    task.updatedAt = Date.now()
  })
}

interface MoveTaskParams {
  taskId: string
  destinationColumnId: string
  /** Final ordered active-task ids for the source column, excluding taskId. Empty when source === destination. */
  orderedSourceTaskIds: string[]
  /** Final ordered active-task ids for the destination column, including taskId at its new position. */
  orderedDestinationTaskIds: string[]
}

export async function moveTask({
  taskId,
  destinationColumnId,
  orderedSourceTaskIds,
  orderedDestinationTaskIds,
}: MoveTaskParams): Promise<void> {
  const now = Date.now()

  await db.transaction('rw', db.tasks, async () => {
    await Promise.all([
      ...orderedSourceTaskIds.map((id, index) => db.tasks.update(id, { orderIndex: index, updatedAt: now })),
      ...orderedDestinationTaskIds.map((id, index) =>
        db.tasks.update(id, {
          orderIndex: index,
          updatedAt: now,
          ...(id === taskId ? { columnId: destinationColumnId } : {}),
        }),
      ),
    ])
  })
}
