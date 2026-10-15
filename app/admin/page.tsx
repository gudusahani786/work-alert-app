import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Daily = { day: string; users: number; jobs: number; applications: number }
type Stats = {
  users: number
  banned: number
  admins: number
  jobs_open: number
  jobs_closed: number
  applications: number
  app_submitted: number
  app_review: number
  app_approved: number
  app_rejected: number
  conversations: number
  messages: number
  reports_open: number
  tickets_open: number
  new_users_7d: number
  new_jobs_7d: number
  daily: Daily[]
}

function Stat({ label, value, href, alert }: { label: string; value: number; href?: string; alert?: boolean }) {
  const body = (
    <Card className={alert && value > 0 ? 'border-red-500/50' : undefined}>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${alert && value > 0 ? 'text-red-600' : ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

export default async function AdminOverview() {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase.rpc('admin_stats')

  if (error || !data) {
    return (
      <Card>
        <CardContent className="space-y-2 py-8 text-sm">
          <p className="font-semibold">The statistics could not be loaded.</p>
          <p className="text-muted-foreground">
            Run the file <code>supabase-admin-update.sql</code> in the Supabase SQL Editor, then reload this page.
          </p>
        </CardContent>
      </Card>
    )
  }

  const s = data as Stats
  const daily = s.daily ?? []
  const max = Math.max(1, ...daily.flatMap((d) => [d.users, d.jobs, d.applications]))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Users" value={s.users} href="/admin/users" />
        <Stat label="New users (7 days)" value={s.new_users_7d} />
        <Stat label="Open jobs" value={s.jobs_open} href="/admin/jobs" />
        <Stat label="New jobs (7 days)" value={s.new_jobs_7d} />
        <Stat label="Applications" value={s.applications} />
        <Stat label="Approved" value={s.app_approved} />
        <Stat label="Chats" value={s.conversations} />
        <Stat label="Messages" value={s.messages} />
        <Stat label="Open reports" value={s.reports_open} href="/admin/reports" alert />
        <Stat label="Open support" value={s.tickets_open} href="/admin/support" alert />
        <Stat label="Banned users" value={s.banned} href="/admin/users" />
        <Stat label="Closed jobs" value={s.jobs_closed} href="/admin/jobs" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Applications by status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <p>Submitted: <b>{s.app_submitted}</b></p>
          <p>Under review: <b>{s.app_review}</b></p>
          <p>Approved: <b>{s.app_approved}</b></p>
          <p>Rejected: <b>{s.app_rejected}</b></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Last 7 days</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Users</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Jobs</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> Applications</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {daily.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-1">
                <div className="flex h-28 w-full items-end justify-center gap-1">
                  <div className="w-2 rounded-t bg-blue-500" style={{ height: `${(d.users / max) * 100}%`, minHeight: d.users ? 3 : 0 }} title={`Users: ${d.users}`} />
                  <div className="w-2 rounded-t bg-green-500" style={{ height: `${(d.jobs / max) * 100}%`, minHeight: d.jobs ? 3 : 0 }} title={`Jobs: ${d.jobs}`} />
                  <div className="w-2 rounded-t bg-orange-500" style={{ height: `${(d.applications / max) * 100}%`, minHeight: d.applications ? 3 : 0 }} title={`Applications: ${d.applications}`} />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
