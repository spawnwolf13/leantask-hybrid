import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { ChecklistItem } from '@/types/entities'

export function useChecklistItems(taskId: string): ChecklistItem[] {
  return useLiveQuery(
    (): Promise<ChecklistItem[]> => db.checklistItems.where('taskId').equals(taskId).sortBy('orderIndex'),
    [taskId],
    [],
  )
}
