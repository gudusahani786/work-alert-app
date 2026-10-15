import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { replyTicket, setTicketStatus } from '@/app/admin/actions'
import { AdminFlash, pick } from '@/components/admin-flash'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type { SupportTicket } from '@/lib/types'

const FILTERS = ['open', 'answered', 'closed', 'all']

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { supabase } = await requireAdmin()
  const sp = await searchParams
  const filter = FILTERS.includes(pick(sp.status, 12)) ? pick(sp.status, 12) : 'open'

  const base = supabase.from('support_tickets').select('*')
  const filtered = filter === 'all' ? base : base.eq('status', filter)
  const { data } = await filtered.order('created_at', { ascending: false }).limit(200)
  const tickets = (data as SupportTicket[]) ?? []
  const returnTo = `/admin/support?status=${filter}`

  return (
    <div className="space-y-4">
      <AdminFlash ok={pick(sp.ok)} error={pick(sp.error)} />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f} asChild size="sm" variant={f === filter ? 'default' : 'outline'}>
            <Link href={`/admin/support?status=${f}`}>{f[0].toUpperCase() + f.slice(1)}</Link>
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {tickets.map((tk) => (
          <Card key={tk.id}>
            <CardContent className="space-y-3 py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{tk.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {tk.name || 'User'} · {tk.email} · {new Date(tk.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant={tk.status === 'open' ? 'destructive' : 'secondary'}>{tk.status}</Badge>
              </div>
              <p className="whitespace-pre-line text-sm">{tk.message}</p>

              {tk.admin_reply ? (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold">Your reply</p>
                  <p className="whitespace-pre-line">{tk.admin_reply}</p>
                </div>
              ) : null}

              <form action={replyTicket} className="grid gap-2 border-t border-border pt-3">
                <input type="hidden" name="ticketId" value={tk.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <Textarea name="reply" rows={3} maxLength={3000} required placeholder="Write your reply" />
                <div>
                  <Button type="submit" size="sm">{tk.admin_reply ? 'Send new reply' : 'Send reply'}</Button>
                </div>
              </form>

              <form action={setTicketStatus}>
                <input type="hidden" name="ticketId" value={tk.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <input type="hidden" name="status" value={tk.status === 'closed' ? 'open' : 'closed'} />
                <Button type="submit" size="sm" variant="outline">
                  {tk.status === 'closed' ? 'Reopen' : 'Close ticket'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
        {tickets.length === 0 ? <p className="text-sm text-muted-foreground">No messages here.</p> : null}
      </div>
    </div>
  )
}
