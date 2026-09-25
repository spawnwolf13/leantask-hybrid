import { requestPersistentStorage } from '@/services/storagePersistence'
import { seedDatabaseIfEmpty } from './seed'

export async function bootstrapApp(): Promise<void> {
  await Promise.all([requestPersistentStorage(), seedDatabaseIfEmpty()])
}
