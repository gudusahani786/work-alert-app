import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n/server'
import { Navbar } from '@/components/navbar'
import { ApplicantCard } from '@/components/applicant-card'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import type { Application, Job, Profile } from '@/lib/types'

export default async function JobApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { t } = await getI18n()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: jobData } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle()
  const job = jobData as Job | null
  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!job || (job.employer_id !== user.id && !me?.is_admin)) notFound()

  const { data: appsData } = await supabase
    .from('applications')
    .select('*')
    .eq('job_id', id)
    .order('created_at', { ascending: false })
  const apps = (appsData as Application[]) ?? []

  const userIds = apps.map((a) => a.user_id)
  const { data: profilesData } = userIds.length
    ? await supabase.from('profiles').select('*').in('id', userIds)
    : { data: [] as Profile[] }
  const profiles = new Map(((profilesData as Profile[]) ?? []).map((p) => [p.id, p]))

  const { data: convs } = apps.length
    ? await supabase.from('conversations').select('id, application_id').in('application_id', apps.map((a) => a.id))
    : { data: [] as { id: string; application_id: string }[] }
  const convByApp = new Map((convs ?? []).map((c) => [c.application_id, c.id]))

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <RealtimeRefresh table="applications" filter={`job_id=eq.${id}`} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/employer">
            <ArrowLeft className="mr-1 h-4 w-4" /> {t('emp.back')}
          </Link>
        </Button>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-sm text-muted-foreground">{t('emp.live', { n: apps.length })}</p>
          </div>
          <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
            {job.status === 'open' ? t('emp.open') : t('emp.closed')}
          </Badge>
        </div>

        {apps.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              {t('emp.noApplicants')}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {apps.map((a) => (
              <ApplicantCard
                key={a.id}
                application={a}
                profile={profiles.get(a.user_id) ?? null}
                conversationId={convByApp.get(a.id) ?? null}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
