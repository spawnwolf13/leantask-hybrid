import { ImagePlus } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { removeTaskImage } from '@/db/tasks'
import { attachImageToTask } from '@/services/attachImage'
import type { ImageAttachment } from '@/types/entities'
import { ImageThumbnail } from './ImageThumbnail'

interface ImageAttachmentsProps {
  taskId: string
  images: ImageAttachment[]
}

export function ImageAttachments({ taskId, images }: ImageAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files) return
    await Promise.all(Array.from(files).map((file) => attachImageToTask(taskId, file)))
    event.target.value = ''
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((image) => (
          <ImageThumbnail key={image.id} image={image} onRemove={() => void removeTaskImage(taskId, image.id)} />
        ))}
        <Button
          type="button"
          variant="outline"
          className="h-24 w-24 flex-col gap-1 text-muted-foreground"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="size-5" />
          <span className="text-xs">Upload</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Paste an image anywhere in this dialog to attach it.</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => void handleFileChange(event)}
      />
    </div>
  )
}
