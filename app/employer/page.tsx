import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n/server'
import { Navbar } from '@/components/navbar'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { JobActions } from '@/components/job-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { MapPin, MessageCircle, Plus, Users } from 'lucide-react'
import type { Job } from '@/lib/types'

export default async function EmployerDashboard() {
  const { t, label } = await getI18n()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: jobsData } = await supabase
    .from('jobs')
    .select('*')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false })
  const jobs = (jobsData as Job[]) ?? []

  const { data: apps } = await supabase
    .from('applications')
    .select('job_id, status')
    .in('job_id', jobs.length ? jobs.map((j) => j.id) : ['00000000-0000-0000-0000-000000000000'])

  const counts = new Map<string, { total: number; pending: number }>()
  for (const a of apps ?? []) {
    const c = counts.get(a.job_id) ?? { total: 0, pending: 0 }
    c.total += 1
    if (a.status === 'Submitted') c.pending += 1
    counts.set(a.job_id, c)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <RealtimeRefresh table="applications" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t('emp.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('emp.count', { n: jobs.length })}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/chat">
                <MessageCircle className="mr-1 h-4 w-4" /> {t('nav.messages')}
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/employer/jobs/new">
                <Plus className="mr-1 h-4 w-4" /> {t('emp.post')}
              </Link>
            </Button>
          </div>
        </div>

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-muted-foreground">{t('emp.none')}</p>
              <Button asChild>
                <Link href="/employer/jobs/new">{t('emp.postFirst')}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map((job) => {
              const c = counts.get(job.id) ?? { total: 0, pending: 0 }
              return (
                <Card key={job.id}>
                  <CardHeader className="gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <Link href={`/employer/jobs/${job.id}`} className="font-semibold hover:text-primary hover:underline">
                          {job.title}
                        </Link>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" /> {job.location} · {label('type', job.job_type)}
                        </div>
                      </div>
                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                        {job.status === 'open' ? t('emp.open') : t('emp.closed')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/employer/jobs/${job.id}`}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Users className="h-4 w-4" />
                      {t('emp.applicants', { n: c.total })}{c.pending ? ` · ${t('emp.newCount', { n: c.pending })}` : ''}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/employer/jobs/${job.id}/edit`}>{t('emp.edit')}</Link>
                      </Button>
                      <JobActions jobId={job.id} status={job.status} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
