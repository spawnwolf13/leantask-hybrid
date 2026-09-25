import { CalendarRange, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type BoardOrCalendarView = 'board' | 'calendar'

interface ViewToggleProps {
  view: BoardOrCalendarView
  onChange: (view: BoardOrCalendarView) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border p-0.5">
      <Button
        size="sm"
        variant={view === 'board' ? 'default' : 'ghost'}
        onClick={() => onChange('board')}
      >
        <LayoutGrid className="size-4" />
        Tasks Board
      </Button>
      <Button
        size="sm"
        variant={view === 'calendar' ? 'default' : 'ghost'}
        onClick={() => onChange('calendar')}
      >
        <CalendarRange className="size-4" />
        Timeline Calendar
      </Button>
    </div>
  )
}
