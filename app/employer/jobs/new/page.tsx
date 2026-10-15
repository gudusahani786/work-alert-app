import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n/server'
import { Navbar } from '@/components/navbar'
import { JobForm } from '@/components/job-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function NewJobPage() {
  const { t } = await getI18n()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/employer">
            <ArrowLeft className="mr-1 h-4 w-4" /> {t('emp.back2')}
          </Link>
        </Button>
        <h1 className="mb-6 text-2xl font-bold">{t('jf.title')}</h1>
        <JobForm defaultCompany={profile?.company_name ?? ''} />
      </main>
    </div>
  )
}
