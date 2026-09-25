import { ImagePlus } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { removeTaskImage } from '@/db/tasks'
import { attachImageToTask } from '@/services/attachImage'
import { cn } from '@/lib/utils'
import type { ImageAttachment } from '@/types/entities'
import { ImageThumbnail } from './ImageThumbnail'

interface ImageAttachmentsProps {
  taskId: string
  images: ImageAttachment[]
}

export function ImageAttachments({ taskId, images }: ImageAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  async function attachFiles(files: FileList | File[]) {
    await Promise.all(Array.from(files).map((file) => attachImageToTask(taskId, file)))
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files) return
    await attachFiles(files)
    event.target.value = ''
  }

  function handleDragOver(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDraggingOver(true)
  }

  function handleDragLeave(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDraggingOver(false)
  }

  async function handleDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDraggingOver(false)
    const files = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith('image/'))
    if (files.length > 0) await attachFiles(files)
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
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(event) => void handleDrop(event)}
          className={cn(
            'h-24 w-24 flex-col gap-1 border-dashed text-muted-foreground transition-colors',
            isDraggingOver && 'border-primary bg-accent text-accent-foreground',
          )}
        >
          <ImagePlus className="size-5" />
          <span className="text-xs">{isDraggingOver ? 'Drop image' : 'Upload'}</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Drag and drop or paste an image anywhere in this dialog to attach it.</p>
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
