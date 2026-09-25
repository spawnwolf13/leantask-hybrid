import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { deleteTask, updateTask } from '@/db/tasks'
import { attachImageToTask } from '@/services/attachImage'
import { useDirtyFlag } from '@/services/unsavedChanges'
import type { Task } from '@/types/entities'
import { ChecklistManager } from './ChecklistManager'
import { ColorPicker } from './ColorPicker'
import { DeleteTaskDialog } from './DeleteTaskDialog'
import { DescriptionEditor } from './DescriptionEditor'
import { ImageAttachments } from './ImageAttachments'
import { ScheduleSection } from './ScheduleSection'
import { TaskPreview } from './TaskPreview'
import { TimeTracker } from './TimeTracker'
import type { TaskModalTab } from './TaskDetailModal'

interface TaskEditFormProps {
  task: Task
  defaultTab: TaskModalTab
  onClose: () => void
}

export function TaskEditForm({ task, defaultTab, onClose }: TaskEditFormProps) {
  const [title, setTitle] = useState(task.title)
  const [tab, setTab] = useState<TaskModalTab>(defaultTab)
  useDirtyFlag('task-title', title.trim() !== task.title)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  function commitTitle() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== task.title) {
      void updateTask(task.id, { title: trimmed })
    } else {
      setTitle(task.title)
    }
  }

  async function handlePaste(event: React.ClipboardEvent) {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'))
    if (!imageItem) return
    const file = imageItem.getAsFile()
    if (!file) return
    event.preventDefault()
    await attachImageToTask(task.id, file)
  }

  async function handleConfirmDelete() {
    await deleteTask(task.id)
    setIsDeleteOpen(false)
    onClose()
  }

  return (
    <div onPaste={(event) => void handlePaste(event)}>
      <DialogDescription className="sr-only">View or edit task details, checklist, and schedule.</DialogDescription>
      <Tabs value={tab} onValueChange={(value) => setTab(value as TaskModalTab)}>
        <TabsList className="mr-8">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <DialogHeader>
            <DialogTitle asChild>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={commitTitle}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    event.currentTarget.blur()
                  }
                }}
                className="border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
              />
            </DialogTitle>
            <TimeTracker task={task} />
          </DialogHeader>

          <div className="max-h-[60vh] space-y-5 overflow-y-auto py-2">
            <section className="space-y-1.5">
              <h3 className="text-sm font-medium">Description</h3>
              <DescriptionEditor taskId={task.id} initialDescription={task.description ?? ''} />
            </section>

            <Separator />

            <section className="space-y-1.5">
              <h3 className="text-sm font-medium">Color</h3>
              <ColorPicker taskId={task.id} color={task.color} />
            </section>

            <Separator />

            <section className="space-y-1.5">
              <h3 className="text-sm font-medium">Images</h3>
              <ImageAttachments taskId={task.id} images={task.images} />
            </section>

            <Separator />

            <section className="space-y-1.5">
              <h3 className="text-sm font-medium">Checklist</h3>
              <ChecklistManager task={task} />
            </section>

            <Separator />

            <section className="space-y-1.5">
              <h3 className="text-sm font-medium">Schedule</h3>
              <ScheduleSection task={task} />
            </section>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <TaskPreview task={task} />
        </TabsContent>
      </Tabs>

      <DialogFooter className="pt-2">
        <Button type="button" variant="destructive" className="sm:mr-auto" onClick={() => setIsDeleteOpen(true)}>
          Delete Task
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>

      <DeleteTaskDialog
        open={isDeleteOpen}
        taskTitle={task.title}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
