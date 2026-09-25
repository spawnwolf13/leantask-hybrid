import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Task } from '@/types/entities'

export function useTask(taskId: string | undefined): Task | undefined {
  return useLiveQuery((): Promise<Task | undefined> => (taskId ? db.tasks.get(taskId) : Promise.resolve(undefined)), [
    taskId,
  ])
}
