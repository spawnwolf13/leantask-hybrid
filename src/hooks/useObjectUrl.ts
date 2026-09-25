import { useEffect, useState } from 'react'

export function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!blob) return

    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
      setUrl(undefined)
    }
  }, [blob])

  return url
}
