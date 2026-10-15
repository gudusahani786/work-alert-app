'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/client'
import { selectClass } from '@/components/location-picker'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Flag } from 'lucide-react'
import type { Key } from '@/lib/i18n/dictionaries'

const REASONS: { value: string; key: Key }[] = [
  { value: 'Fake or scam', key: 'rep.r1' },
  { value: 'Asks for money', key: 'rep.r2' },
  { value: 'Wrong or misleading information', key: 'rep.r3' },
  { value: 'Offensive content', key: 'rep.r4' },
  { value: 'Other', key: 'rep.r5' },
]

// "Report this job" button. The admin sees reports in Admin > Reports.
export function ReportButton({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REASONS[0].value)
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async () => {
    setBusy(true)
    const { error } = await createClient()
      .from('reports')
      .insert({
        target_type: 'job',
        target_id: jobId,
        target_label: jobTitle.slice(0, 200),
        reason,
        details: details.trim().slice(0, 2000) || null,
      })
    setBusy(false)
    if (error) {
      if (error.code === '23505') {
        toast.error(t('rep.already'))
        setOpen(false)
      } else {
        console.error('report error:', error.message)
        toast.error(t('common.error'))
      }
      return
    }
    toast.success(t('rep.thanks'))
    setOpen(false)
    setDetails('')
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setOpen(true)}>
        <Flag className="mr-1 h-4 w-4" /> {t('rep.button')}
      </Button>
    )
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border p-4">
      <p className="text-sm font-semibold">{t('rep.title')}</p>
      <div className="grid gap-2">
        <Label htmlFor="rep-reason">{t('rep.reason')}</Label>
        <select id="rep-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={selectClass}>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {t(r.key)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="rep-details">{t('rep.details')}</Label>
        <Textarea id="rep-details" rows={3} maxLength={2000} value={details} onChange={(e) => setDetails(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={send} disabled={busy}>
          {t('rep.send')}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
          ×
        </Button>
      </div>
    </div>
  )
}
