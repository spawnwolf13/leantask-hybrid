export interface Category {
  id: string
  name: string
  orderIndex: number
  createdAt: number
  updatedAt: number
}

export interface Column {
  id: string
  categoryId: string
  name: string
  orderIndex: number
  createdAt: number
  updatedAt: number
}

export interface ImageAttachment {
  id: string
  blob: Blob
  mimeType: string
  width: number
  height: number
  createdAt: number
}

export interface Task {
  id: string
  categoryId: string
  columnId: string
  title: string
  description?: string
  orderIndex: number
  isCompleted: boolean
  startDate?: string
  startTime?: string
  durationMinutes?: number
  images: ImageAttachment[]
  createdAt: number
  updatedAt: number
}

export interface ChecklistItem {
  id: string
  taskId: string
  text: string
  isCompleted: boolean
  durationMinutes?: number
  orderIndex: number
  createdAt: number
  updatedAt: number
}

export type SyncOperation = 'create' | 'update' | 'delete'
export type SyncStatus = 'pending' | 'syncing' | 'failed' | 'done'

export interface SyncQueueItem {
  id: string
  taskId: string
  operation: SyncOperation
  status: SyncStatus
  payload?: unknown
  errorMessage?: string
  createdAt: number
  updatedAt: number
}
