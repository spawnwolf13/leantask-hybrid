import dayGridPlugin from '@fullcalendar/daygrid'
import type { EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { addDays, addMinutes, differenceInMinutes, format, parseISO } from 'date-fns'
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
  taskId: string
  isDueMarker?: boolean
}

export function CalendarView({ onOpenTask }: CalendarViewProps) {
  const tasks = useScheduledTasks()
  const categories = useCategories()

  const categoryNameById = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [
    categories,
  ])

  const events = useMemo((): EventInput[] => {
    // useScheduledTasks() guarantees every task here has either a startDate or a recurrence rule.
    return tasks.flatMap((task) => {
      const color = task.color ?? getCategoryColor(task.categoryId)
      const extendedProps: TaskEventExtendedProps = {
        categoryName: categoryNameById.get(task.categoryId) ?? '',
        isCompleted: task.isCompleted,
        taskId: task.id,
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

      const dateOnlyEvent = (start: string, end?: string): EventInput => ({
        id: task.id,
        title: task.title,
        start,
        // FullCalendar's all-day end is exclusive, so a due date of Oct 10 ends at Oct 11.
        end: end ? format(addDays(parseISO(end), 1), 'yyyy-MM-dd') : undefined,
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        extendedProps,
      })

      // Only tasks with an explicit start time AND estimated effort get a slot on the hourly grid,
      // and only on their start day — a multi-day span never becomes one giant time block.
      if (task.startDate && task.startTime && task.durationMinutes) {
        const start = parseISO(`${task.startDate}T${task.startTime}`)
        const end = addMinutes(start, task.durationMinutes)
        const timedEvent: EventInput = {
          id: task.id,
          title: task.title,
          start,
          end,
          allDay: false,
          backgroundColor: color,
          borderColor: color,
          extendedProps,
        }
        if (task.dueDate && task.dueDate > task.startDate) {
          return [
            timedEvent,
            {
              ...dateOnlyEvent(task.dueDate),
              id: `${task.id}:due`,
              title: `Due: ${task.title}`,
              editable: false,
              extendedProps: { ...extendedProps, isDueMarker: true },
            },
          ]
        }
        return timedEvent
      }

      if (task.startDate) {
        return dateOnlyEvent(task.startDate, task.dueDate && task.dueDate > task.startDate ? task.dueDate : undefined)
      }

      return { ...dateOnlyEvent(task.dueDate as string), title: `Due: ${task.title}`, editable: false }
    })
  }, [tasks, categoryNameById])

  function handleEventClick(arg: EventClickArg) {
    onOpenTask((arg.event.extendedProps as TaskEventExtendedProps).taskId)
  }

  // Deadlines are fixed milestones: drag/resize only ever touches startDate/startTime/durationMinutes.
  async function handleEventDrop(arg: EventDropArg) {
    const start = arg.event.start
    if (!start) return
    const startDate = format(start, 'yyyy-MM-dd')
    const dueDate = tasks.find((candidate) => candidate.id === arg.event.id)?.dueDate
    if (dueDate && startDate > dueDate) {
      arg.revert()
      return
    }
    await updateTask(arg.event.id, {
      startDate,
      startTime: arg.event.allDay ? undefined : format(start, 'HH:mm'),
    })
  }

  async function handleEventResize(arg: EventResizeDoneArg) {
    const { start, end } = arg.event
    // An all-day span's edges are set via Start/Due Date in the task modal, not by resizing.
    if (!start || !end || arg.event.allDay) {
      arg.revert()
      return
    }
    await updateTask(arg.event.id, {
      startDate: format(start, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      durationMinutes: differenceInMinutes(end, start),
    })
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
        slotEventOverlap={false}
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
