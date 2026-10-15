import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n/server'
import { getUsdKrw } from '@/lib/currency'
import { Navbar } from '@/components/navbar'
import { JobsBrowser } from '@/components/jobs-browser'
import type { Job } from '@/lib/types'

export default async function JobsPage() {
  const { t } = await getI18n()
  const rate = await getUsdKrw()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">{t('nav.jobs')}</h1>
        <JobsBrowser initialJobs={(jobs as Job[]) ?? []} isAuthed rate={rate} />
      </main>
    </div>
  )
}
