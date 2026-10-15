import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n/server'
import { Navbar } from '@/components/navbar'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Message, Profile } from '@/lib/types'

type ConvRow = {
  id: string
  seeker_id: string
  employer_id: string
  applications: { status: string; jobs: { title: string; company: string } | null } | null
}

export default async function ChatListPage() {
  const { t } = await getI18n()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('conversations')
    .select('id, seeker_id, employer_id, applications(status, jobs(title, company))')
    .order('created_at', { ascending: false })
  const convs = (data as unknown as ConvRow[]) ?? []

  const otherIds = Array.from(new Set(convs.map((c) => (c.seeker_id === user.id ? c.employer_id : c.seeker_id))))
  const { data: profs } = otherIds.length
    ? await supabase.from('profiles').select('id, full_name, company_name, avatar_url').in('id', otherIds)
    : { data: [] as Partial<Profile>[] }
  const nameOf = new Map(
    (profs ?? []).map((p) => [p.id as string, (p.company_name || p.full_name || 'User') as string]),
  )

  const { data: msgs } = convs.length
    ? await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', convs.map((c) => c.id))
        .order('created_at', { ascending: false })
        .limit(300)
    : { data: [] as Message[] }
  const last = new Map<string, Message>()
  const unread = new Map<string, number>()
  for (const m of (msgs as Message[]) ?? []) {
    if (!last.has(m.conversation_id)) last.set(m.conversation_id, m)
    if (m.sender_id !== user.id && !m.read_at) unread.set(m.conversation_id, (unread.get(m.conversation_id) ?? 0) + 1)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <RealtimeRefresh table="messages" />
      <RealtimeRefresh table="conversations" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="mb-1 text-2xl font-bold">{t('chat.title')}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t('chat.sub')}</p>

        {convs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              {t('chat.empty')}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {convs.map((c) => {
              const otherId = c.seeker_id === user.id ? c.employer_id : c.seeker_id
              const lm = last.get(c.id)
              const u = unread.get(c.id) ?? 0
              return (
                <Link key={c.id} href={`/chat/${c.id}`}>
                  <Card className="transition-colors hover:border-primary/50">
                    <CardContent className="flex items-center justify-between gap-3 py-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{nameOf.get(otherId) ?? 'User'}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.applications?.jobs?.title ?? 'Job'}</p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {lm ? (lm.kind === 'call' ? `📞 ${lm.body} call` : lm.body) : t('chat.noMsgs')}
                        </p>
                      </div>
                      {u > 0 ? <Badge>{u}</Badge> : null}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
