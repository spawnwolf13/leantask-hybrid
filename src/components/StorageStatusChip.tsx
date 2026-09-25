import { HardDrive, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useStorageStatus } from '@/hooks/useStorageStatus'
import { formatBytes } from '@/utils/formatBytes'

export function StorageStatusChip() {
  const { isPersisted, usageBytes, quotaBytes, isLoading } = useStorageStatus()

  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
        <HardDrive className="size-3.5" />
        Checking storage…
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
      {isPersisted ? (
        <ShieldCheck className="size-3.5 text-emerald-500" />
      ) : (
        <ShieldAlert className="size-3.5 text-amber-500" />
      )}
      Storage: {isPersisted ? 'Protected' : 'Best-Effort'}
      {quotaBytes > 0 && (
        <span className="text-muted-foreground/70">
          · {formatBytes(usageBytes)} / {formatBytes(quotaBytes)}
        </span>
      )}
    </Badge>
  )
}
