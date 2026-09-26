import { Settings } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BoardView } from '@/components/board/BoardView'
import { GlobalTimerBar } from '@/components/GlobalTimerBar'
import { CalendarView } from '@/components/calendar/CalendarView'
import { SettingsModal } from '@/components/modals/SettingsModal'
import { TaskDetailModal, type TaskModalTab } from '@/components/modals/TaskDetailModal'
import { StorageStatusChip } from '@/components/StorageStatusChip'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { ViewToggle, type BoardOrCalendarView } from '@/components/ViewToggle'
import { useActiveTimerTaskId } from '@/hooks/useActiveTimerTaskId'
import { startNotificationScheduler } from '@/services/notificationService'
import { hasUnsavedChanges } from '@/services/unsavedChanges'

const VIEW_STORAGE_KEY = 'leantask-view'

function App() {
  const [view, setViewState] = useState<BoardOrCalendarView>(() =>
    localStorage.getItem(VIEW_STORAGE_KEY) === 'calendar' ? 'calendar' : 'board',
  )
  const [openTask, setOpenTask] = useState<{ id: string; tab: TaskModalTab } | null>(null)
  const activeTimerTaskId = useActiveTimerTaskId()
  const activeTimerRef = useRef(activeTimerTaskId)
  useEffect(() => {
    activeTimerRef.current = activeTimerTaskId
  }, [activeTimerTaskId])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  function setView(next: BoardOrCalendarView) {
    setViewState(next)
    localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  useEffect(() => startNotificationScheduler(), [])

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (activeTimerRef.current === null && !hasUnsavedChanges()) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-3 py-2">
        <ViewToggle view={view} onChange={setView} />
        <div className="flex min-w-0 flex-1 justify-center px-2">
          <GlobalTimerBar onOpenTask={(id) => setOpenTask({ id, tab: 'edit' })} />
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="size-4" />
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        {view === 'board' ? (
          <BoardView onOpenTask={(id) => setOpenTask({ id, tab: 'edit' })} />
        ) : (
          <CalendarView onOpenTask={(id) => setOpenTask({ id, tab: 'preview' })} />
        )}
      </main>

      <footer className="flex items-center justify-end border-t p-3">
        <StorageStatusChip />
      </footer>

      <TaskDetailModal taskId={openTask?.id ?? null} defaultTab={openTask?.tab ?? 'edit'} onClose={() => setOpenTask(null)} />
      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <Toaster />
    </div>
  )
}

export default App
