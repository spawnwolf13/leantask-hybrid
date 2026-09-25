import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useObjectUrl } from '@/hooks/useObjectUrl'
import type { ImageAttachment } from '@/types/entities'

interface ImageThumbnailProps {
  image: ImageAttachment
  onRemove: () => void
}

export function ImageThumbnail({ image, onRemove }: ImageThumbnailProps) {
  const url = useObjectUrl(image.blob)

  return (
    <div className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onRemove}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
