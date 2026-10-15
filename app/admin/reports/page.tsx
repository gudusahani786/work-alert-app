import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { adminDeleteJob, adminSetJobStatus, resolveReport } from '@/app/admin/actions'
import { AdminFlash, pick } from '@/components/admin-flash'
import { ConfirmSubmit } from '@/components/confirm-submit'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Report } from '@/lib/types'

const FILTERS = ['open', 'resolved', 'dismissed', 'all']

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { supabase } = await requireAdmin()
  const sp = await searchParams
  const filter = FILTERS.includes(pick(sp.status, 12)) ? pick(sp.status, 12) : 'open'

  const base = supabase.from('reports').select('*')
  const filtered = filter === 'all' ? base : base.eq('status', filter)
  const { data } = await filtered.order('created_at', { ascending: false }).limit(200)
  const reports = (data as Report[]) ?? []

  const reporterIds = Array.from(new Set(reports.map((r) => r.reporter_id)))
  const { data: people } = reporterIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', reporterIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] }
  const personMap = new Map((people ?? []).map((p) => [p.id, p]))

  const jobIds = reports.filter((r) => r.target_type === 'job').map((r) => r.target_id)
  const { data: jobs } = jobIds.length
    ? await supabase.from('jobs').select('id, status').in('id', jobIds)
    : { data: [] as { id: string; status: string }[] }
  const jobMap = new Map((jobs ?? []).map((j) => [j.id, j.status]))

  const returnTo = `/admin/reports?status=${filter}`

  return (
    <div className="space-y-4">
      <AdminFlash ok={pick(sp.ok)} error={pick(sp.error)} />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f} asChild size="sm" variant={f === filter ? 'default' : 'outline'}>
            <Link href={`/admin/reports?status=${f}`}>{f[0].toUpperCase() + f.slice(1)}</Link>
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {reports.map((r) => {
          const who = personMap.get(r.reporter_id)
          const jobStatus = r.target_type === 'job' ? jobMap.get(r.target_id) : undefined
          const jobGone = r.target_type === 'job' && !jobStatus
          return (
            <Card key={r.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {r.target_type === 'job' ? 'Job' : 'User'}: {r.target_label || r.target_id}
                    </p>
                    <p className="text-sm">Reason: {r.reason}</p>
                    {r.details ? <p className="whitespace-pre-line text-sm text-muted-foreground">{r.details}</p> : null}
                    <p className="text-xs text-muted-foreground">
                      By {who ? who.full_name || who.email : 'unknown'} · {new Date(r.created_at).toLocaleString()}
                    </p>
                    {r.admin_note ? <p className="text-xs">Admin note: {r.admin_note}</p> : null}
                  </div>
                  <Badge variant={r.status === 'open' ? 'destructive' : 'secondary'}>{r.status}</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {r.target_type === 'job' && !jobGone ? (
                    <>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/jobs/${r.target_id}`}>View job</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/employer/jobs/${r.target_id}/edit`}>Edit job</Link>
                      </Button>
                      {jobStatus === 'open' ? (
                        <form action={adminSetJobStatus}>
                          <input type="hidden" name="jobId" value={r.target_id} />
                          <input type="hidden" name="status" value="closed" />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <Button type="submit" size="sm" variant="outline">Close job</Button>
                        </form>
                      ) : null}
                      <form action={adminDeleteJob}>
                        <input type="hidden" name="jobId" value={r.target_id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <ConfirmSubmit message="Delete this job?" size="sm" variant="destructive">Delete job</ConfirmSubmit>
                      </form>
                    </>
                  ) : null}
                  {jobGone ? <span className="text-xs text-muted-foreground">(job already deleted)</span> : null}
                  {r.target_type === 'user' ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/users/${r.target_id}`}>Open user</Link>
                    </Button>
                  ) : null}
                </div>

                <form action={resolveReport} className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <input type="hidden" name="reportId" value={r.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Input name="note" placeholder="Note (optional)" maxLength={1000} defaultValue={r.admin_note ?? ''} className="h-8 max-w-xs" />
                  {r.status === 'open' ? (
                    <>
                      <Button type="submit" name="status" value="resolved" size="sm">Resolve</Button>
                      <Button type="submit" name="status" value="dismissed" size="sm" variant="outline">Dismiss</Button>
                    </>
                  ) : (
                    <Button type="submit" name="status" value="open" size="sm" variant="outline">Reopen</Button>
                  )}
                </form>
              </CardContent>
            </Card>
          )
        })}
        {reports.length === 0 ? <p className="text-sm text-muted-foreground">No reports here.</p> : null}
      </div>
    </div>
  )
}
