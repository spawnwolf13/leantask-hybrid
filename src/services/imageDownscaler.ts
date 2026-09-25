const MAX_DIMENSION = 1200
const OUTPUT_QUALITY = 0.8

export interface DownscaledImage {
  blob: Blob
  url: string
  mimeType: string
  width: number
  height: number
  originalWidth: number
  originalHeight: number
}

let cachedMimeType: string | null = null

function detectSupportedMimeType(): string {
  if (cachedMimeType) return cachedMimeType
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const supportsWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp')
  cachedMimeType = supportsWebp ? 'image/webp' : 'image/jpeg'
  return cachedMimeType
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob() returned null'))),
      mimeType,
      quality,
    )
  })
}

export async function downscaleImage(
  source: Blob,
  maxDimension = MAX_DIMENSION,
  quality = OUTPUT_QUALITY,
): Promise<DownscaledImage> {
  const bitmap = await createImageBitmap(source)
  const { width: originalWidth, height: originalHeight } = bitmap

  const scale = Math.min(1, maxDimension / Math.max(originalWidth, originalHeight))
  const width = Math.round(originalWidth * scale)
  const height = Math.round(originalHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('2D canvas context unavailable')
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const mimeType = detectSupportedMimeType()
  const blob = await canvasToBlob(canvas, mimeType, quality)
  const url = URL.createObjectURL(blob)

  return { blob, url, mimeType, width, height, originalWidth, originalHeight }
}
