import { BoardView } from '@/components/board/BoardView'
import { StorageStatusChip } from '@/components/StorageStatusChip'

function App() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <BoardView />
      <footer className="flex items-center justify-end border-t p-3">
        <StorageStatusChip />
      </footer>
    </div>
  )
}

export default App
