import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Task } from '@/types/entities'

export function useScheduledTasks(): Task[] {
  return useLiveQuery(
    async (): Promise<Task[]> => (await db.tasks.toArray()).filter((task) => Boolean(task.startDate)),
    [],
    [],
  )
}
