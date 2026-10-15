import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n/server'
import { Navbar } from '@/components/navbar'
import { JobForm } from '@/components/job-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Job } from '@/lib/types'

// Edit a job: the owner, or an admin.
export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
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
  const isAdmin = !!me?.is_admin
  if (!job || (job.employer_id !== user.id && !isAdmin)) notFound()

  const back = isAdmin && job.employer_id !== user.id ? '/admin/jobs' : '/employer'

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href={back}>
            <ArrowLeft className="mr-1 h-4 w-4" /> {t('emp.back2')}
          </Link>
        </Button>
        <h1 className="mb-6 text-2xl font-bold">{t('jf.editTitle')}</h1>
        <JobForm defaultCompany={job.company} job={job} returnTo={back} />
      </main>
    </div>
  )
}
