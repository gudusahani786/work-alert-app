import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { adminDeleteJob, adminSetJobStatus } from '@/app/admin/actions'
import { AdminFlash, pick } from '@/components/admin-flash'
import { ConfirmSubmit } from '@/components/confirm-submit'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { selectClass } from '@/components/location-picker'
import type { Job } from '@/lib/types'

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { supabase } = await requireAdmin()
  const sp = await searchParams
  const q = pick(sp.q, 60).trim()
  const status = pick(sp.status, 10)
  const safe = q.replace(/[,()%*\\]/g, ' ').trim()

  const base = supabase.from('jobs').select('*')
  const byText = safe ? base.or(`title.ilike.%${safe}%,company.ilike.%${safe}%`) : base
  const byStatus = status === 'open' || status === 'closed' ? byText.eq('status', status) : byText
  const { data } = await byStatus.order('created_at', { ascending: false }).limit(200)
  const jobs = (data as Job[]) ?? []

  const ownerIds = Array.from(new Set(jobs.map((j) => j.employer_id).filter((x): x is string => !!x)))
  const { data: owners } = ownerIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', ownerIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] }
  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o]))

  const rp = new URLSearchParams()
  if (q) rp.set('q', q)
  if (status) rp.set('status', status)
  const returnTo = `/admin/jobs?${rp.toString()}`

  return (
    <div className="space-y-4">
      <AdminFlash ok={pick(sp.ok)} error={pick(sp.error)} />

      <form className="flex flex-wrap gap-2" action="/admin/jobs">
        <Input name="q" defaultValue={q} placeholder="Search title or company" maxLength={60} className="max-w-xs" />
        <select name="status" defaultValue={status} className={`${selectClass} max-w-[140px]`}>
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <Button type="submit">Search</Button>
      </form>
      <p className="text-xs text-muted-foreground">Showing {jobs.length} job(s).</p>

      <div className="space-y-3">
        {jobs.map((j) => {
          const owner = j.employer_id ? ownerMap.get(j.employer_id) : null
          return (
            <Card key={j.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/jobs/${j.id}`} className="font-semibold hover:underline">
                      {j.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {j.company} · {j.location} · {j.job_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Posted by {owner ? owner.full_name || owner.email : 'unknown'} on{' '}
                      {new Date(j.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={j.status === 'open' ? 'default' : 'secondary'}>{j.status}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/employer/jobs/${j.id}/edit`}>Edit</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/employer/jobs/${j.id}`}>Applicants</Link>
                  </Button>
                  <form action={adminSetJobStatus}>
                    <input type="hidden" name="jobId" value={j.id} />
                    <input type="hidden" name="status" value={j.status === 'open' ? 'closed' : 'open'} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <Button type="submit" size="sm" variant="outline">
                      {j.status === 'open' ? 'Close' : 'Reopen'}
                    </Button>
                  </form>
                  <form action={adminDeleteJob}>
                    <input type="hidden" name="jobId" value={j.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <ConfirmSubmit message="Delete this job and all its applications and chats?" size="sm" variant="destructive">
                      Delete
                    </ConfirmSubmit>
                  </form>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {jobs.length === 0 ? <p className="text-sm text-muted-foreground">No jobs found.</p> : null}
      </div>
    </div>
  )
}
