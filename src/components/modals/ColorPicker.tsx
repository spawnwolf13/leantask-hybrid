import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { updateTask } from '@/db/tasks'
import { cn } from '@/lib/utils'
import { COLOR_PRESETS, isValidHexColor } from '@/utils/colorPresets'

interface ColorPickerProps {
  taskId: string
  color?: string
}

export function ColorPicker({ taskId, color }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(color ?? '')

  function commitHex() {
    const trimmed = hexInput.trim()
    if (!trimmed) {
      void updateTask(taskId, { color: undefined })
      return
    }
    const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    if (isValidHexColor(normalized)) {
      setHexInput(normalized)
      void updateTask(taskId, { color: normalized })
    } else {
      setHexInput(color ?? '')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          setHexInput('')
          void updateTask(taskId, { color: undefined })
        }}
        title="None"
        className={cn(
          'flex size-6 items-center justify-center rounded-full border border-dashed text-muted-foreground',
          !color && 'ring-2 ring-ring ring-offset-1 ring-offset-background',
        )}
      >
        <X className="size-3" />
      </button>

      {COLOR_PRESETS.map((preset) => (
        <button
          key={preset.hex}
          type="button"
          title={preset.name}
          onClick={() => {
            setHexInput(preset.hex)
            void updateTask(taskId, { color: preset.hex })
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded-full',
            color === preset.hex && 'ring-2 ring-ring ring-offset-1 ring-offset-background',
          )}
          style={{ backgroundColor: preset.hex }}
        >
          {color === preset.hex && <Check className="size-3.5 text-white" />}
        </button>
      ))}

      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={isValidHexColor(hexInput) ? hexInput : '#64748b'}
          onChange={(event) => {
            setHexInput(event.target.value)
            void updateTask(taskId, { color: event.target.value })
          }}
          className="size-6 cursor-pointer rounded border-none bg-transparent p-0"
        />
        <input
          value={hexInput}
          placeholder="#RRGGBB"
          onChange={(event) => setHexInput(event.target.value)}
          onBlur={commitHex}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
          className="h-7 w-24 rounded-md border bg-background px-2 text-xs"
        />
      </div>
    </div>
  )
}
