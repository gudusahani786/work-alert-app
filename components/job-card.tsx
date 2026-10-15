'use client'

import Link from 'next/link'
import { MapPin, Building2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { PayDisplay } from '@/components/pay-display'
import { useI18n } from '@/lib/i18n/client'
import type { Job } from '@/lib/types'

export function JobCard({ job, rate }: { job: Job; rate: number }) {
  const { t, label } = useI18n()

  const diff = Date.now() - new Date(job.created_at).getTime()
  const days = Math.floor(diff / 86400000)
  const ago =
    days <= 0
      ? t('jobs.today')
      : days === 1
        ? t('jobs.dayAgo')
        : days < 30
          ? t('jobs.daysAgo', { n: days })
          : t('jobs.monthsAgo', { n: Math.floor(days / 30) })

  return (
    <Link href={`/jobs/${job.id}`} className="group block">
      <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight text-balance group-hover:text-primary">{job.title}</h3>
            {job.category ? <Badge variant="secondary">{label('cat', job.category)}</Badge> : null}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{job.company}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 shrink-0" />
            {label('type', job.job_type)}
          </div>
        </CardContent>
        <CardFooter className="items-end justify-between gap-2">
          <PayDisplay job={job} rate={rate} perHour={t('jobs.perHour')} negotiable={t('jobs.negotiable')} />
          <span className="text-xs text-muted-foreground" suppressHydrationWarning>
            {ago}
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
