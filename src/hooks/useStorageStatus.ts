import { useEffect, useState } from 'react'
import { getStorageEstimate, isStoragePersisted } from '@/services/storagePersistence'

export interface StorageStatus {
  isPersisted: boolean
  usageBytes: number
  quotaBytes: number
  isLoading: boolean
}

const POLL_INTERVAL_MS = 30_000

export function useStorageStatus(): StorageStatus {
  const [status, setStatus] = useState<StorageStatus>({
    isPersisted: false,
    usageBytes: 0,
    quotaBytes: 0,
    isLoading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      const [persisted, estimate] = await Promise.all([isStoragePersisted(), getStorageEstimate()])
      if (cancelled) return
      setStatus({
        isPersisted: persisted,
        usageBytes: estimate?.usage ?? 0,
        quotaBytes: estimate?.quota ?? 0,
        isLoading: false,
      })
    }

    void refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return status
}
