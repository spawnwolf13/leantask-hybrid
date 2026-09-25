import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    <Tabs defaultValue="write">
      <TabsList>
        <TabsTrigger value="write">Write</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <Textarea
          value={description}
          placeholder="Add a description… (Markdown supported)"
          rows={6}
          onChange={(event) => setDescription(event.target.value)}
          onBlur={() => void updateTask(taskId, { description })}
        />
      </TabsContent>
      <TabsContent value="preview">
        <div className="prose prose-sm min-h-[9.5rem] max-w-none rounded-md border p-3 dark:prose-invert">
          {description.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
