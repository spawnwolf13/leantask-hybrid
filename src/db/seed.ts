import { db } from './db'

const DEFAULT_COLUMN_NAMES = ['To Do', 'In Progress', 'Done']

export async function seedDatabaseIfEmpty(): Promise<void> {
  const categoryCount = await db.categories.count()
  if (categoryCount > 0) return

  const now = Date.now()
  const categoryId = crypto.randomUUID()

  await db.transaction('rw', db.categories, db.columns, async () => {
    await db.categories.add({
      id: categoryId,
      name: 'Personal',
      orderIndex: 0,
      createdAt: now,
      updatedAt: now,
    })

    await db.columns.bulkAdd(
      DEFAULT_COLUMN_NAMES.map((name, orderIndex) => ({
        id: crypto.randomUUID(),
        categoryId,
        name,
        orderIndex,
        createdAt: now,
        updatedAt: now,
      })),
    )
  })
}
