import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { updateTask } from '@/db/tasks'
import { useDirtyFlag } from '@/services/unsavedChanges'

interface DescriptionEditorProps {
  taskId: string
  initialDescription: string
}

export function DescriptionEditor({ taskId, initialDescription }: DescriptionEditorProps) {
  const [description, setDescription] = useState(initialDescription)
  useDirtyFlag('task-description', description !== initialDescription)

  return (
    <Textarea
      value={description}
      placeholder="Add a description… (Markdown supported — view it on the Preview tab)"
      rows={6}
      onChange={(event) => setDescription(event.target.value)}
      onBlur={() => void updateTask(taskId, { description })}
    />
  )
}
