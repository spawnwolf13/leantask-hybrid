import { Settings } from 'lucide-react'
import { useState } from 'react'
import { BoardView } from '@/components/board/BoardView'
import { CalendarView } from '@/components/calendar/CalendarView'
import { SettingsModal } from '@/components/modals/SettingsModal'
import { TaskEditModal } from '@/components/modals/TaskEditModal'
import { StorageStatusChip } from '@/components/StorageStatusChip'
import { Button } from '@/components/ui/button'
import { ViewToggle, type BoardOrCalendarView } from '@/components/ViewToggle'

const VIEW_STORAGE_KEY = 'leantask-view'

function App() {
  const [view, setViewState] = useState<BoardOrCalendarView>(() =>
    localStorage.getItem(VIEW_STORAGE_KEY) === 'calendar' ? 'calendar' : 'board',
  )
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  function setView(next: BoardOrCalendarView) {
    setViewState(next)
    localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-3 py-2">
        <ViewToggle view={view} onChange={setView} />
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="size-4" />
        </Button>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        {view === 'board' ? (
          <BoardView onOpenTask={setOpenTaskId} />
        ) : (
          <CalendarView onOpenTask={setOpenTaskId} />
        )}
      </main>

      <footer className="flex items-center justify-end border-t p-3">
        <StorageStatusChip />
      </footer>

      <TaskEditModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}

export default App
