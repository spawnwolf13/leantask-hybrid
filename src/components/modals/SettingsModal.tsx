import { Bell, CalendarDays, Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  downloadWorkspaceBackup,
  exportWorkspace,
  isValidWorkspaceBackup,
  restoreWorkspace,
  type WorkspaceBackup,
} from '@/services/backup'
import { buildIcsCalendar, downloadIcsCalendar } from '@/services/icsExport'
import { areNotificationsEnabled, setNotificationsEnabled } from '@/services/notificationService'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<WorkspaceBackup | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabledState] = useState(() => areNotificationsEnabled())

  async function handleToggleNotifications(checked: boolean) {
    if (checked) {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setNotificationsEnabledState(false)
        setNotificationsEnabled(false)
        return
      }
    }
    setNotificationsEnabledState(checked)
    setNotificationsEnabled(checked)
  }

  async function handleExportJson() {
    const backup = await exportWorkspace()
    downloadWorkspaceBackup(backup)
  }

  async function handleExportIcs() {
    const ics = await buildIcsCalendar()
    downloadIcsCalendar(ics)
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const data = JSON.parse(await file.text())
      if (!isValidWorkspaceBackup(data)) {
        setImportError("This file doesn't look like a LeanTask backup.")
        return
      }
      setImportError(null)
      setPendingImport(data)
    } catch {
      setImportError('Could not read that file as JSON.')
    }
  }

  async function confirmImport() {
    if (!pendingImport) return
    await restoreWorkspace(pendingImport)
    setPendingImport(null)
    onClose()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Backup, restore, and export your workspace.</DialogDescription>
          </DialogHeader>

          <section className="space-y-2">
            <h3 className="text-sm font-medium">Hard Backup & Restore</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void handleExportJson()}>
                <Download className="size-4" />
                Export Workspace (JSON)
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4" />
                Import Workspace (JSON)
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(event) => void handleFileSelected(event)}
              />
            </div>
            {importError && <p className="text-sm text-destructive">{importError}</p>}
          </section>

          <Separator />

          <section className="space-y-2">
            <h3 className="text-sm font-medium">Calendar Export</h3>
            <Button variant="outline" onClick={() => void handleExportIcs()}>
              <CalendarDays className="size-4" />
              Export to iCalendar (.ics)
            </Button>
          </section>

          <Separator />

          <section className="space-y-2">
            <h3 className="text-sm font-medium">Notifications</h3>
            <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
              <Label htmlFor="notifications-toggle" className="flex items-center gap-2 font-normal">
                <Bell className="size-4 text-muted-foreground" />
                Task start/end alarms
              </Label>
              <Switch
                id="notifications-toggle"
                checked={notificationsEnabled}
                onCheckedChange={(checked) => void handleToggleNotifications(checked)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Plays a chime and shows a notification when a scheduled task starts, and 5 minutes before it ends.
              Only works while this tab or app window is open.
            </p>
          </section>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingImport !== null} onOpenChange={(next) => !next && setPendingImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              Restoring will overwrite current workspace data. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={() => void confirmImport()}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
