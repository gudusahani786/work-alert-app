import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getI18n } from '@/lib/i18n/server'
import { Navbar } from '@/components/navbar'
import { ChatRoom } from '@/components/chat-room'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Message } from '@/lib/types'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { t } = await getI18n()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: conv } = await supabase
    .from('conversations')
    .select('id, seeker_id, employer_id, applications(status, jobs(title))')
    .eq('id', id)
    .maybeSingle()
  if (!conv) notFound()

  const c = conv as unknown as {
    seeker_id: string
    employer_id: string
    applications: { status: string; jobs: { title: string } | null } | null
  }
  const otherId = c.seeker_id === user.id ? c.employer_id : c.seeker_id

  const [{ data: other }, { data: me }, { data: msgs }] = await Promise.all([
    supabase.from('profiles').select('full_name, company_name').eq('id', otherId).maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }).limit(300),
  ])

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <div className="mx-auto w-full max-w-2xl">
        <Button asChild variant="ghost" size="sm" className="m-2">
          <Link href="/chat">
            <ArrowLeft className="mr-1 h-4 w-4" /> {t('chat.all')}
          </Link>
        </Button>
      </div>
      <div className="mx-auto w-full max-w-2xl flex-1 border-x border-border">
        <ChatRoom
          conversationId={id}
          meId={user.id}
          meName={me?.full_name ?? user.email ?? 'User'}
          otherName={other?.company_name || other?.full_name || 'User'}
          jobTitle={c.applications?.jobs?.title ?? 'Job'}
          initialMessages={(msgs as Message[]) ?? []}
          locked={c.applications?.status !== 'Approved'}
        />
      </div>
    </div>
  )
}
