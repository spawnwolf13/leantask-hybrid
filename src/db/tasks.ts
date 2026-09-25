import { db } from './db'
import { addDays, format, parseISO } from 'date-fns'
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
      timeSpentSeconds: 0,
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
  'title' | 'description' | 'startDate' | 'dueDate' | 'startTime' | 'durationMinutes' | 'color' | 'recurrence'
>

export async function updateTask(taskId: string, patch: Partial<TaskEditableFields>): Promise<void> {
  await db.tasks.update(taskId, { ...patch, updatedAt: Date.now() })
}

async function commitElapsedTime(task: Task): Promise<void> {
  if (!task.timerStartedAt) return
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000))
  await db.tasks.update(task.id, {
    timeSpentSeconds: task.timeSpentSeconds + elapsedSeconds,
    timerStartedAt: undefined,
    updatedAt: Date.now(),
  })
}

export async function startTaskTimer(taskId: string): Promise<void> {
  await db.transaction('rw', db.tasks, async () => {
    // Only one task may run at a time — pause any other currently-running task first.
    const otherRunningTasks = await db.tasks
      .filter((task) => task.id !== taskId && task.timerStartedAt !== undefined)
      .toArray()
    await Promise.all(otherRunningTasks.map((task) => commitElapsedTime(task)))

    await db.tasks.update(taskId, { timerStartedAt: new Date().toISOString(), updatedAt: Date.now() })
  })
}

export async function pauseTaskTimer(taskId: string): Promise<void> {
  const task = await db.tasks.get(taskId)
  if (!task) return
  await commitElapsedTime(task)
}

export async function resetTaskTimer(taskId: string): Promise<void> {
  await db.tasks.update(taskId, { timeSpentSeconds: 0, timerStartedAt: undefined, updatedAt: Date.now() })
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

function shiftDateByOneDay(date: string): string {
  return format(addDays(parseISO(date), 1), 'yyyy-MM-dd')
}

/** Clones a task (and its subtasks, unchecked) directly below the source in the same column. */
export async function duplicateTask(taskId: string): Promise<string | undefined> {
  const cloneId = crypto.randomUUID()
  const now = Date.now()

  await db.transaction('rw', db.tasks, db.checklistItems, async () => {
    const source = await db.tasks.get(taskId)
    if (!source) return

    const columnTasks = await db.tasks
      .where('columnId')
      .equals(source.columnId)
      .and((task) => !task.isCompleted)
      .toArray()

    // A completed source lives in the Done zone; its clone starts active, at the end of the column.
    const insertIndex = source.isCompleted
      ? columnTasks.reduce((max, task) => Math.max(max, task.orderIndex), -1) + 1
      : source.orderIndex + 1
    await Promise.all(
      columnTasks
        .filter((task) => task.orderIndex >= insertIndex)
        .map((task) => db.tasks.update(task.id, { orderIndex: task.orderIndex + 1, updatedAt: now })),
    )

    const [cover] = source.images
    await db.tasks.add({
      id: cloneId,
      categoryId: source.categoryId,
      columnId: source.columnId,
      title: `${source.title} (Copy)`,
      description: source.description,
      color: source.color,
      durationMinutes: source.durationMinutes,
      startTime: source.startTime,
      recurrence: source.recurrence,
      // Shift the deadline with the start so the clone never ends up due before it starts.
      startDate: source.startDate ? shiftDateByOneDay(source.startDate) : undefined,
      dueDate: source.startDate && source.dueDate ? shiftDateByOneDay(source.dueDate) : source.dueDate,
      orderIndex: insertIndex,
      isCompleted: false,
      timeSpentSeconds: 0,
      images: cover ? [{ ...cover, id: crypto.randomUUID(), createdAt: now }] : [],
      createdAt: now,
      updatedAt: now,
    })

    const items = await db.checklistItems.where('taskId').equals(taskId).sortBy('orderIndex')
    await db.checklistItems.bulkAdd(
      items.map((item, index) => ({
        ...item,
        id: crypto.randomUUID(),
        taskId: cloneId,
        isCompleted: false,
        orderIndex: index,
        createdAt: now,
        updatedAt: now,
      })),
    )
  })

  return cloneId
}
