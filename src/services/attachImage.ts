import { addTaskImage } from '@/db/tasks'
import { downscaleImage } from './imageDownscaler'

export async function attachImageToTask(taskId: string, source: Blob): Promise<void> {
  const { blob, mimeType, width, height } = await downscaleImage(source)
  await addTaskImage(taskId, {
    id: crypto.randomUUID(),
    blob,
    mimeType,
    width,
    height,
    createdAt: Date.now(),
  })
}
