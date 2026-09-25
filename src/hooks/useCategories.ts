import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Category } from '@/types/entities'

export function useCategories(): Category[] {
  return useLiveQuery(() => db.categories.orderBy('orderIndex').toArray(), [], [])
}
