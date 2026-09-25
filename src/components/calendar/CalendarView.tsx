import dayGridPlugin from '@fullcalendar/daygrid'
import type { EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { addMinutes, differenceInMinutes, format, parseISO } from 'date-fns'
import { useMemo } from 'react'
import { updateTask } from '@/db/tasks'
import { useCategories } from '@/hooks/useCategories'
import { useScheduledTasks } from '@/hooks/useScheduledTasks'
import { getCategoryColor } from '@/utils/categoryColor'
import { getRecurrenceDaysOfWeek } from '@/utils/recurrence'

function addMinutesToTimeString(time: string, durationMinutes: number): string {
  const [hours, minutes] = time.split(':').map(Number)
  const total = (hours * 60 + minutes + durationMinutes) % (24 * 60)
  const endHours = Math.floor(total / 60)
  const endMinutes = total % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

interface CalendarViewProps {
  onOpenTask: (taskId: string) => void
}

interface TaskEventExtendedProps {
  categoryName: string
  isCompleted: boolean
}

export function CalendarView({ onOpenTask }: CalendarViewProps) {
  const tasks = useScheduledTasks()
  const categories = useCategories()

  const categoryNameById = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [
    categories,
  ])

  const events = useMemo((): EventInput[] => {
    // useScheduledTasks() guarantees every task here has either a startDate or a recurrence rule.
    return tasks.map((task) => {
      const color = task.color ?? getCategoryColor(task.categoryId)
      const extendedProps: TaskEventExtendedProps = {
        categoryName: categoryNameById.get(task.categoryId) ?? '',
        isCompleted: task.isCompleted,
      }

      if (task.recurrence) {
        const daysOfWeek = getRecurrenceDaysOfWeek(task.recurrence)
        return {
          id: task.id,
          title: task.title,
          daysOfWeek,
          startTime: task.startTime,
          endTime: task.startTime && task.durationMinutes ? addMinutesToTimeString(task.startTime, task.durationMinutes) : undefined,
          allDay: !task.startTime,
          editable: false,
          backgroundColor: color,
          borderColor: color,
          extendedProps,
        }
      }

      if (task.startTime && task.durationMinutes) {
        const start = parseISO(`${task.startDate}T${task.startTime}`)
        const end = addMinutes(start, task.durationMinutes)
        return {
          id: task.id,
          title: task.title,
          start,
          end,
          allDay: false,
          backgroundColor: color,
          borderColor: color,
          extendedProps,
        }
      }

      return {
        id: task.id,
        title: task.title,
        start: task.startDate,
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        extendedProps,
      }
    })
  }, [tasks, categoryNameById])

  function handleEventClick(arg: EventClickArg) {
    onOpenTask(arg.event.id)
  }

  async function handleEventDrop(arg: EventDropArg) {
    const start = arg.event.start
    if (!start) return
    await updateTask(arg.event.id, {
      startDate: format(start, 'yyyy-MM-dd'),
      startTime: arg.event.allDay ? undefined : format(start, 'HH:mm'),
    })
  }

  async function handleEventResize(arg: EventResizeDoneArg) {
    const { start, end } = arg.event
    if (!start || !end) return
    await updateTask(arg.event.id, { durationMinutes: differenceInMinutes(end, start) })
  }

  return (
    <div className="calendar-shell flex-1 overflow-auto p-3">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        editable
        eventResizableFromStart
        height="auto"
        events={events}
        eventClick={handleEventClick}
        eventDrop={(arg) => void handleEventDrop(arg)}
        eventResize={(arg) => void handleEventResize(arg)}
        eventContent={(arg) => {
          const { categoryName, isCompleted } = arg.event.extendedProps as TaskEventExtendedProps
          return (
            <div className={`flex flex-col overflow-hidden px-1 ${isCompleted ? 'opacity-60' : ''}`}>
              <span className={`truncate text-xs font-medium ${isCompleted ? 'line-through' : ''}`}>
                {arg.event.title}
              </span>
              {categoryName && <span className="truncate text-[10px] opacity-80">{categoryName}</span>}
            </div>
          )
        }}
      />
    </div>
  )
}
