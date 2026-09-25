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

export type RecurrenceFrequency = 'daily' | 'weekdays' | 'custom'

export interface TaskRecurrence {
  frequency: RecurrenceFrequency
  /** 0 = Sun, 1 = Mon, ..., 6 = Sat. Only used when frequency is 'custom'. */
  daysOfWeek?: number[]
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
  dueDate?: string
  startTime?: string
  /** Estimated work effort — not the span between start and due date. */
  durationMinutes?: number
  color?: string
  timeSpentSeconds: number
  timerStartedAt?: string
  recurrence?: TaskRecurrence
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
