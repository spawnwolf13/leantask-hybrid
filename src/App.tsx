import { StorageStatusChip } from '@/components/StorageStatusChip'
import { useCategories } from '@/hooks/useCategories'
import { useColumns } from '@/hooks/useColumns'

function App() {
  const categories = useCategories()
  const firstCategory = categories[0]
  const columns = useColumns(firstCategory?.id)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex flex-1 flex-col items-center justify-center gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">LeanTask Hybrid</h1>
        <p className="text-muted-foreground">
          Phase 1 scaffold — Dexie schema, seed routine, and storage durability wired up.
        </p>
        {firstCategory && (
          <p className="text-sm text-muted-foreground">
            Seeded category "{firstCategory.name}" with columns:{' '}
            {columns.map((column) => column.name).join(', ') || '…'}
          </p>
        )}
      </main>
      <footer className="flex items-center justify-end border-t p-3">
        <StorageStatusChip />
      </footer>
    </div>
  )
}

export default App
