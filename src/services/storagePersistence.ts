export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false

  const alreadyPersisted = await navigator.storage.persisted()
  if (alreadyPersisted) return true

  return navigator.storage.persist()
}

export async function isStoragePersisted(): Promise<boolean> {
  if (!navigator.storage?.persisted) return false
  return navigator.storage.persisted()
}

export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if (!navigator.storage?.estimate) return null
  return navigator.storage.estimate()
}
