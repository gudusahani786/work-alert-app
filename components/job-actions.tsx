'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteJob, setJobStatus } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/client'

export function JobActions({ jobId, status }: { jobId: string; status: 'open' | 'closed' }) {
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const toggle = () =>
    startTransition(async () => {
      const r = await setJobStatus(jobId, status === 'open' ? 'closed' : 'open')
      if (r.ok) {
        toast.success(status === 'open' ? t('emp.jobClosed') : t('emp.jobReopened'))
        router.refresh()
      } else toast.error(r.error ?? t('common.error'))
    })

  const remove = () => {
    if (!window.confirm(t('emp.confirmDelete'))) return
    startTransition(async () => {
      const r = await deleteJob(jobId)
      if (r.ok) {
        toast.success(t('emp.jobDeleted'))
        router.refresh()
      } else toast.error(r.error ?? t('common.error'))
    })
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={toggle} disabled={isPending}>
        {status === 'open' ? t('emp.close') : t('emp.reopen')}
      </Button>
      <Button size="sm" variant="destructive" onClick={remove} disabled={isPending}>
        {t('emp.delete')}
      </Button>
    </div>
  )
}
