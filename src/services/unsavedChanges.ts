import { useEffect } from 'react'

const dirtyKeys = new Set<string>()

export function hasUnsavedChanges(): boolean {
  return dirtyKeys.size > 0
}

/** Registers a form field as having local input that hasn't been saved yet. */
export function useDirtyFlag(key: string, isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return
    dirtyKeys.add(key)
    return () => {
      dirtyKeys.delete(key)
    }
  }, [key, isDirty])
}
