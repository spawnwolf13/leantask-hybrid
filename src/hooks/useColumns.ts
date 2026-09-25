import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Column } from '@/types/entities'

export function useColumns(categoryId: string | undefined): Column[] {
  return useLiveQuery(
    (): Promise<Column[]> =>
      categoryId
        ? db.columns.where('categoryId').equals(categoryId).sortBy('orderIndex')
        : Promise.resolve([]),
    [categoryId],
    [],
  )
}
