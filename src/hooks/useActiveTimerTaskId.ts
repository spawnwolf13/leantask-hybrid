import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'

export function useActiveTimerTaskId(): string | null {
  return (
    useLiveQuery(async () => (await db.tasks.filter((task) => task.timerStartedAt !== undefined).first())?.id ?? null, [], null) ??
    null
  )
}
