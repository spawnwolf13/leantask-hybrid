import Dexie, { type EntityTable } from 'dexie'
import type { Category, ChecklistItem, Column, SyncQueueItem, Task } from '@/types/entities'

export class LeanTaskDB extends Dexie {
  categories!: EntityTable<Category, 'id'>
  columns!: EntityTable<Column, 'id'>
  tasks!: EntityTable<Task, 'id'>
  checklistItems!: EntityTable<ChecklistItem, 'id'>
  syncQueue!: EntityTable<SyncQueueItem, 'id'>

  constructor() {
    super('LeanTaskHybridDB')

    // Note: isCompleted is a boolean, which IndexedDB cannot use inside a compound
    // index key range — queries filtering on it alongside categoryId/columnId use
    // this single-field index plus an in-memory filter, which Dexie handles cleanly.
    this.version(1).stores({
      categories: 'id, orderIndex',
      columns: 'id, categoryId, orderIndex',
      tasks: 'id, categoryId, columnId, orderIndex, startDate, isCompleted',
      checklistItems: 'id, taskId',
      syncQueue: 'id, taskId, status, createdAt',
    })

    // No index changes — backfills timeSpentSeconds (non-optional) on tasks
    // created before the time-tracker feature existed.
    this.version(2)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table('tasks')
          .toCollection()
          .modify((task) => {
            if (task.timeSpentSeconds === undefined) task.timeSpentSeconds = 0
          })
      })
  }
}

export const db = new LeanTaskDB()
