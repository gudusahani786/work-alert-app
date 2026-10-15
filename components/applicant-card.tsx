'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setApplicationStatus } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FileText, Mail, MessageCircle, Phone } from 'lucide-react'
import type { Application, Profile } from '@/lib/types'

export function ApplicantCard({
  application,
  profile,
  conversationId,
}: {
  application: Application
  profile: Profile | null
  conversationId: string | null
}) {
  const { t, label } = useI18n()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const change = (status: 'Under Review' | 'Approved' | 'Rejected') =>
    startTransition(async () => {
      const r = await setApplicationStatus(application.id, status)
      if (!r.ok) {
        toast.error(r.error ?? t('common.error'))
        return
      }
      if (status === 'Approved' && r.id) {
        toast.success(t('ap.approvedToast'), {
          action: { label: t('ap.openChat'), onClick: () => router.push(`/chat/${r.id}`) },
        })
      } else {
        toast.success(t('ap.markedAs', { s: label('status', status) }))
      }
      router.refresh()
    })

  const openResume = async () => {
    if (!profile?.resume_url) return
    const w = window.open('', '_blank')
    const { data, error } = await createClient().storage.from('resumes').createSignedUrl(profile.resume_url, 300)
    if (error || !data) {
      w?.close()
      toast.error(t('ap.resumeFail'))
      return
    }
    if (w) {
      w.opener = null
      w.location.href = data.signedUrl
    }
  }

  const s = application.status
  const place = [profile?.city, profile?.region, profile?.country].filter(Boolean).join(', ') || profile?.location
  const rate =
    profile?.desired_hourly_rate != null
      ? `${profile.desired_currency === 'USD' ? '$' : '₩'}${Number(profile.desired_hourly_rate).toLocaleString('en-US')}${t('jobs.perHour')}`
      : null

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{application.full_name}</p>
            {profile?.headline ? <p className="text-sm text-muted-foreground">{profile.headline}</p> : null}
          </div>
          <Badge variant={s === 'Approved' ? 'default' : s === 'Rejected' ? 'destructive' : 'secondary'}>
            {label('status', s)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" />
            {application.email}
          </span>
          {application.phone ? (
            <span className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              {application.phone}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {profile ? (
          <div className="grid gap-1 text-muted-foreground">
            {profile.skills ? <p><span className="font-medium text-foreground">{t('ap.skills')}:</span> {profile.skills}</p> : null}
            {profile.experience_years !== null ? (
              <p><span className="font-medium text-foreground">{t('ap.experience')}:</span> {t('ap.years', { n: profile.experience_years })}</p>
            ) : null}
            {profile.education ? <p><span className="font-medium text-foreground">{t('ap.education')}:</span> {profile.education}</p> : null}
            {place ? <p><span className="font-medium text-foreground">{t('ap.location')}:</span> {place}</p> : null}
            {rate ? <p><span className="font-medium text-foreground">{t('ap.expected')}:</span> {rate}</p> : null}
          </div>
        ) : null}
        {application.cover_letter ? (
          <p className="whitespace-pre-line rounded-md bg-muted p-3 text-muted-foreground">{application.cover_letter}</p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          {s !== 'Approved' && (
            <Button size="sm" onClick={() => change('Approved')} disabled={isPending}>
              {t('ap.approve')}
            </Button>
          )}
          {s === 'Submitted' && (
            <Button size="sm" variant="outline" onClick={() => change('Under Review')} disabled={isPending}>
              {t('ap.review')}
            </Button>
          )}
          {s !== 'Rejected' && (
            <Button size="sm" variant="destructive" onClick={() => change('Rejected')} disabled={isPending}>
              {t('ap.reject')}
            </Button>
          )}
          {profile?.resume_url ? (
            <Button size="sm" variant="outline" onClick={openResume}>
              <FileText className="mr-1 h-4 w-4" /> {t('ap.resume')}
            </Button>
          ) : null}
          {conversationId ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/chat/${conversationId}`}>
                <MessageCircle className="mr-1 h-4 w-4" /> {t('ap.chat')}
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
