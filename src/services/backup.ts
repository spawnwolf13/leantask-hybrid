import { format } from 'date-fns'
import { db } from '@/db/db'
import type { Category, ChecklistItem, Column, ImageAttachment, Task } from '@/types/entities'

interface SerializedImage extends Omit<ImageAttachment, 'blob'> {
  blobBase64: string
}

interface SerializedTask extends Omit<Task, 'images'> {
  images: SerializedImage[]
}

export interface WorkspaceBackup {
  version: 1
  exportedAt: string
  categories: Category[]
  columns: Column[]
  tasks: SerializedTask[]
  checklistItems: ChecklistItem[]
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function base64ToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

export async function exportWorkspace(): Promise<WorkspaceBackup> {
  const [categories, columns, tasks, checklistItems] = await Promise.all([
    db.categories.toArray(),
    db.columns.toArray(),
    db.tasks.toArray(),
    db.checklistItems.toArray(),
  ])

  const serializedTasks: SerializedTask[] = await Promise.all(
    tasks.map(async (task) => {
      const { images, ...rest } = task
      const serializedImages = await Promise.all(
        images.map(async (image) => {
          const { blob, ...imageRest } = image
          return { ...imageRest, blobBase64: await blobToBase64(blob) }
        }),
      )
      return { ...rest, images: serializedImages }
    }),
  )

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    columns,
    tasks: serializedTasks,
    checklistItems,
  }
}

export function downloadWorkspaceBackup(backup: WorkspaceBackup): void {
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `leantask-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function isValidWorkspaceBackup(data: unknown): data is WorkspaceBackup {
  if (!data || typeof data !== 'object') return false
  const candidate = data as Record<string, unknown>
  return (
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.columns) &&
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.checklistItems)
  )
}

export async function restoreWorkspace(backup: WorkspaceBackup): Promise<void> {
  const tasks: Task[] = await Promise.all(
    backup.tasks.map(async (task) => {
      const { images, ...rest } = task
      const restoredImages: ImageAttachment[] = await Promise.all(
        images.map(async (image) => {
          const { blobBase64, ...imageRest } = image
          return { ...imageRest, blob: await base64ToBlob(blobBase64) }
        }),
      )
      return { ...rest, images: restoredImages }
    }),
  )

  await db.transaction('rw', db.categories, db.columns, db.tasks, db.checklistItems, async () => {
    await Promise.all([
      db.categories.clear(),
      db.columns.clear(),
      db.tasks.clear(),
      db.checklistItems.clear(),
    ])
    await db.categories.bulkAdd(backup.categories)
    await db.columns.bulkAdd(backup.columns)
    await db.tasks.bulkAdd(tasks)
    await db.checklistItems.bulkAdd(backup.checklistItems)
  })
}
