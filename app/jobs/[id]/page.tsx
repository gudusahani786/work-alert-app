import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n/server'
import { getUsdKrw } from '@/lib/currency'
import { Navbar } from '@/components/navbar'
import { ApplyDialog } from '@/components/apply-dialog'
import { PayDisplay } from '@/components/pay-display'
import { ReportButton } from '@/components/report-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, Banknote, Building2, CheckCircle2, Clock, MapPin, MessageCircle } from 'lucide-react'
import type { Job, Profile } from '@/lib/types'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { t, label } = await getI18n()
  const rate = await getUsdKrw()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: job } = await supabase.from('jobs').select('*').eq('id', id).single()
  if (!job) notFound()

  let alreadyApplied = false
  let appStatus: string | null = null
  let chatId: string | null = null
  let profile: Profile | null = null
  if (user) {
    const { data: existing } = await supabase
      .from('applications')
      .select('id, status')
      .eq('job_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    alreadyApplied = !!existing
    appStatus = existing?.status ?? null
    if (existing && existing.status === 'Approved') {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('application_id', existing.id)
        .maybeSingle()
      chatId = conv?.id ?? null
    }

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = p as Profile | null
  }

  const j = job as Job
  const isOwner = !!user && j.employer_id === user.id

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/jobs">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('jd.back')}
          </Link>
        </Button>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-balance">{j.title}</h1>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {j.company}
                </div>
              </div>
              {j.category ? <Badge variant="secondary">{label('cat', j.category)}</Badge> : null}
            </div>

            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <span className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {j.location}
                  {j.address ? <span className="block text-xs">{t('jd.address')}: {j.address}</span> : null}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {label('type', j.job_type)}
              </span>
              <span className="flex items-start gap-1.5 sm:col-span-2">
                <Banknote className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="flex flex-col">
                  <span className="text-xs">{t('jd.payPerHour')}</span>
                  <PayDisplay job={j} rate={rate} perHour={t('jobs.perHour')} negotiable={t('jobs.negotiable')} size="lg" />
                </span>
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <section className="space-y-2">
              <h2 className="font-semibold">{t('jd.description')}</h2>
              <p className="whitespace-pre-line text-pretty text-sm leading-relaxed text-muted-foreground">
                {j.description}
              </p>
            </section>

            {j.requirements ? (
              <section className="space-y-2">
                <h2 className="font-semibold">{t('jd.requirements')}</h2>
                <p className="whitespace-pre-line text-pretty text-sm leading-relaxed text-muted-foreground">
                  {j.requirements}
                </p>
              </section>
            ) : null}

            <div className="border-t border-border pt-6">
              {!user ? (
                <div className="flex flex-col items-start gap-3 rounded-lg bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">{t('jd.loginToApply')}</p>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/auth/login">{t('nav.login')}</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href="/auth/sign-up">{t('nav.createAccount')}</Link>
                    </Button>
                  </div>
                </div>
              ) : isOwner ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted p-4 text-sm">
                  <span className="text-muted-foreground">{t('jd.ownJob')}</span>
                  <Button asChild size="sm">
                    <Link href={`/employer/jobs/${j.id}`}>{t('jd.viewApplicants')}</Link>
                  </Button>
                </div>
              ) : alreadyApplied ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-primary/10 p-4 text-sm font-medium text-primary">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    {t('jd.applied', { s: label('status', appStatus) })}
                  </span>
                  {chatId ? (
                    <Button asChild size="sm">
                      <Link href={`/chat/${chatId}`}>
                        <MessageCircle className="mr-1 h-4 w-4" /> {t('jd.chat')}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ) : j.status !== 'open' ? (
                <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">{t('jd.closed')}</p>
              ) : (
                <ApplyDialog job={j} profile={profile} userEmail={user.email ?? ''} />
              )}
            </div>
          </CardContent>
        </Card>

        {user && !isOwner ? (
          <div className="mt-4 flex justify-end">
            <ReportButton jobId={j.id} jobTitle={j.title} />
          </div>
        ) : null}
      </main>
    </div>
  )
}
