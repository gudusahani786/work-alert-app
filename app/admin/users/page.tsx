import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { setAdminRole, setBan, deleteUser } from '@/app/admin/actions'
import { AdminFlash, pick } from '@/components/admin-flash'
import { ConfirmSubmit } from '@/components/confirm-submit'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Row = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  is_admin: boolean
  is_banned: boolean
  banned_reason: string | null
  created_at: string
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { supabase, user } = await requireAdmin()
  const sp = await searchParams
  const q = pick(sp.q, 60).trim()
  const safe = q.replace(/[,()%*\\]/g, ' ').trim()

  const base = supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_admin, is_banned, banned_reason, created_at')
  const filtered = safe ? base.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`) : base
  const { data } = await filtered.order('created_at', { ascending: false }).limit(200)
  const users = (data as Row[]) ?? []

  const returnTo = q ? `/admin/users?q=${encodeURIComponent(q)}` : '/admin/users'

  return (
    <div className="space-y-4">
      <AdminFlash ok={pick(sp.ok)} error={pick(sp.error)} />

      <form className="flex gap-2" action="/admin/users">
        <Input name="q" defaultValue={q} placeholder="Search name or email" maxLength={60} />
        <Button type="submit">Search</Button>
      </form>
      <p className="text-xs text-muted-foreground">Showing {users.length} user(s){users.length === 200 ? ' (first 200, use search)' : ''}.</p>

      <div className="space-y-3">
        {users.map((u) => {
          const isMe = u.id === user.id
          return (
            <Card key={u.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{u.full_name || '(no name)'}</p>
                    <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                    {u.phone ? <p className="text-xs text-muted-foreground">{u.phone}</p> : null}
                    <p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {isMe ? <Badge variant="secondary">You</Badge> : null}
                    {u.is_admin ? <Badge>Admin</Badge> : null}
                    {u.is_banned ? <Badge variant="destructive">Banned</Badge> : null}
                  </div>
                </div>
                {u.is_banned && u.banned_reason ? (
                  <p className="text-xs text-red-600">Reason: {u.banned_reason}</p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/users/${u.id}`}>Edit</Link>
                  </Button>

                  {!isMe ? (
                    <>
                      {u.is_banned ? (
                        <form action={setBan}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="ban" value="false" />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <Button type="submit" size="sm" variant="outline">Unban</Button>
                        </form>
                      ) : (
                        <form action={setBan} className="flex items-center gap-2">
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="ban" value="true" />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <Input name="reason" placeholder="Reason (optional)" maxLength={300} className="h-8 w-40" />
                          <ConfirmSubmit message={`Ban ${u.email ?? 'this user'}?`} size="sm" variant="outline">
                            Ban
                          </ConfirmSubmit>
                        </form>
                      )}

                      <form action={setAdminRole}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="admin" value={u.is_admin ? 'false' : 'true'} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <ConfirmSubmit
                          message={u.is_admin ? 'Remove admin role?' : 'Make this user an admin? They get full control.'}
                          size="sm"
                          variant="outline"
                        >
                          {u.is_admin ? 'Remove admin' : 'Make admin'}
                        </ConfirmSubmit>
                      </form>

                      <form action={deleteUser}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <ConfirmSubmit
                          message="Delete this user and ALL their jobs, applications and messages? This cannot be undone."
                          size="sm"
                          variant="destructive"
                        >
                          Delete
                        </ConfirmSubmit>
                      </form>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {users.length === 0 ? <p className="text-sm text-muted-foreground">No users found.</p> : null}
      </div>
    </div>
  )
}
