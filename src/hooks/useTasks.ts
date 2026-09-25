import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Task } from '@/types/entities'

// isCompleted is a boolean, which IndexedDB cannot use as an index key — Dexie
// silently returns no rows if it's included in a where() object alongside an
// indexed field, so it's always applied as a plain in-memory filter instead.

export function useActiveTasksForCategory(categoryId: string | undefined): Task[] {
  return useLiveQuery(
    (): Promise<Task[]> =>
      categoryId
        ? db.tasks
            .where('categoryId')
            .equals(categoryId)
            .and((task) => !task.isCompleted)
            .sortBy('orderIndex')
        : Promise.resolve([]),
    [categoryId],
    [],
  )
}

export function useCompletedTasks(columnId: string): Task[] {
  return useLiveQuery(
    (): Promise<Task[]> =>
      db.tasks
        .where('columnId')
        .equals(columnId)
        .and((task) => task.isCompleted)
        .sortBy('orderIndex'),
    [columnId],
    [],
  )
}
