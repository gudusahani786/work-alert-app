import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n/server'
import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Building2, MapPin, MessageCircle, Search, UserRound } from 'lucide-react'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import type { Application } from '@/lib/types'

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' {
  if (status === 'Approved') return 'default'
  if (status === 'Rejected') return 'destructive'
  return 'secondary'
}

export default async function DashboardPage() {
  const { t, label } = await getI18n()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: convs } = await supabase.from('conversations').select('id, application_id').eq('seeker_id', user.id)
  const convByApp = new Map((convs ?? []).map((c) => [c.application_id, c.id]))

  const { data: applications } = await supabase
    .from('applications')
    .select('*, jobs(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const apps = (applications as Application[]) ?? []

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <RealtimeRefresh table="applications" filter={`user_id=eq.${user.id}`} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t('dash.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('dash.count', { n: apps.length })}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">
                <UserRound className="mr-1 h-4 w-4" />
                {t('nav.profile')}
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/jobs">
                <Search className="mr-1 h-4 w-4" />
                {t('dash.browse')}
              </Link>
            </Button>
          </div>
        </div>

        {apps.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-muted-foreground">{t('dash.none')}</p>
              <Button asChild>
                <Link href="/jobs">{t('dash.find')}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {apps.map((app) => (
              <Card key={app.id}>
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      {app.jobs ? (
                        <Link href={`/jobs/${app.job_id}`} className="font-semibold hover:text-primary hover:underline">
                          {app.jobs.title}
                        </Link>
                      ) : (
                        <span className="font-semibold text-muted-foreground">{t('dash.gone')}</span>
                      )}
                      {app.jobs ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4" />
                            {app.jobs.company}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {app.jobs.location}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <Badge variant={statusVariant(app.status)}>{label('status', app.status)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>
                    {t('dash.appliedOn', {
                      d: new Date(app.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }),
                    })}
                  </span>
                  {app.status === 'Approved' && convByApp.get(app.id) ? (
                    <Button asChild size="sm">
                      <Link href={`/chat/${convByApp.get(app.id)}`}>
                        <MessageCircle className="mr-1 h-4 w-4" /> {t('dash.chat')}
                      </Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
