'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { GENDERS, isEmail, isPhone, str } from '@/lib/validate'

// Every action first calls requireAdmin(): a normal user can never run these.
// After each action we go back to the page with ?ok=... or ?error=... so a message is shown.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function backTo(formData: FormData, fallback: string): string {
  const r = str(formData.get('returnTo'), 300)
  return r.startsWith('/admin') ? r : fallback
}

function finish(to: string, message: string, isError = false): never {
  const [path, query = ''] = to.split('?')
  const params = new URLSearchParams(query)
  params.delete('ok')
  params.delete('error')
  params.set(isError ? 'error' : 'ok', message)
  revalidatePath('/admin', 'layout')
  redirect(`${path}?${params.toString()}`)
}

// ---------------- Users ----------------

export async function setBan(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin()
  const to = backTo(formData, '/admin/users')
  const id = str(formData.get('userId'), 50)
  const ban = str(formData.get('ban'), 5) === 'true'
  const reason = str(formData.get('reason'), 300)
  if (!UUID.test(id)) finish(to, 'Invalid user.', true)
  if (id === user.id) finish(to, 'You cannot ban yourself.', true)
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: ban, banned_reason: ban ? reason || null : null })
    .eq('id', id)
  if (error) {
    console.error('setBan error:', error.message)
    finish(to, 'Could not update the user.', true)
  }
  finish(to, ban ? 'User banned.' : 'User unbanned.')
}

export async function setAdminRole(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin()
  const to = backTo(formData, '/admin/users')
  const id = str(formData.get('userId'), 50)
  const makeAdmin = str(formData.get('admin'), 5) === 'true'
  if (!UUID.test(id)) finish(to, 'Invalid user.', true)
  if (id === user.id) finish(to, 'You cannot change your own admin role.', true)
  const { error } = await supabase.from('profiles').update({ is_admin: makeAdmin }).eq('id', id)
  if (error) {
    console.error('setAdminRole error:', error.message)
    finish(to, 'Could not update the role.', true)
  }
  finish(to, makeAdmin ? 'User is now an admin.' : 'Admin role removed.')
}

export async function deleteUser(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin()
  const to = backTo(formData, '/admin/users')
  const id = str(formData.get('userId'), 50)
  if (!UUID.test(id)) finish(to, 'Invalid user.', true)
  if (id === user.id) finish(to, 'You cannot delete yourself.', true)
  const { error } = await supabase.rpc('admin_delete_user', { p_user: id })
  if (error) {
    console.error('deleteUser error:', error.message)
    finish(to, 'Could not delete the user.', true)
  }
  finish('/admin/users', 'User deleted with all their data.')
}

export async function updateUser(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const id = str(formData.get('userId'), 50)
  const to = backTo(formData, `/admin/users/${id}`)
  if (!UUID.test(id)) finish('/admin/users', 'Invalid user.', true)
  const phone = str(formData.get('phone'), 40)
  if (phone && !isPhone(phone)) finish(to, 'Invalid phone number.', true)
  const genderRaw = str(formData.get('gender'), 20)
  const gender = (GENDERS as readonly string[]).includes(genderRaw) ? genderRaw : null

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: str(formData.get('full_name'), 200) || null,
      phone: phone || null,
      gender,
      headline: str(formData.get('headline'), 200) || null,
      company_name: str(formData.get('company_name'), 200) || null,
      location: str(formData.get('location'), 200) || null,
      bio: str(formData.get('bio'), 3000) || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) {
    console.error('updateUser error:', error.message)
    finish(to, 'Could not save the user.', true)
  }
  finish(to, 'User saved.')
}

// ---------------- Jobs ----------------

export async function adminSetJobStatus(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const to = backTo(formData, '/admin/jobs')
  const id = str(formData.get('jobId'), 50)
  const status = str(formData.get('status'), 10)
  if (!UUID.test(id) || (status !== 'open' && status !== 'closed')) finish(to, 'Invalid request.', true)
  const { error } = await supabase.from('jobs').update({ status }).eq('id', id)
  if (error) {
    console.error('adminSetJobStatus error:', error.message)
    finish(to, 'Could not update the job.', true)
  }
  finish(to, status === 'open' ? 'Job reopened.' : 'Job closed.')
}

export async function adminDeleteJob(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const to = backTo(formData, '/admin/jobs')
  const id = str(formData.get('jobId'), 50)
  if (!UUID.test(id)) finish(to, 'Invalid job.', true)
  const { error } = await supabase.from('jobs').delete().eq('id', id)
  if (error) {
    console.error('adminDeleteJob error:', error.message)
    finish(to, 'Could not delete the job.', true)
  }
  finish(to, 'Job deleted.')
}

// ---------------- Reports ----------------

export async function resolveReport(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const to = backTo(formData, '/admin/reports')
  const id = str(formData.get('reportId'), 50)
  const status = str(formData.get('status'), 12)
  const note = str(formData.get('note'), 1000)
  if (!UUID.test(id) || (status !== 'resolved' && status !== 'dismissed' && status !== 'open')) {
    finish(to, 'Invalid request.', true)
  }
  const { error } = await supabase
    .from('reports')
    .update({
      status,
      admin_note: note || null,
      resolved_at: status === 'open' ? null : new Date().toISOString(),
    })
    .eq('id', id)
  if (error) {
    console.error('resolveReport error:', error.message)
    finish(to, 'Could not update the report.', true)
  }
  finish(to, status === 'open' ? 'Report reopened.' : `Report ${status}.`)
}

// ---------------- Notifications (announcement to everybody) ----------------

export async function broadcast(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const to = '/admin/notifications'
  const title = str(formData.get('title'), 120)
  const body = str(formData.get('body'), 400)
  const linkRaw = str(formData.get('link'), 300)
  if (!title) finish(to, 'Please enter a title.', true)
  const link = linkRaw.startsWith('/') || /^https:\/\//i.test(linkRaw) ? linkRaw : ''
  const { data, error } = await supabase.rpc('admin_broadcast', { p_title: title, p_body: body, p_link: link })
  if (error) {
    console.error('broadcast error:', error.message)
    finish(to, 'Could not send. Did you run supabase-admin-update.sql?', true)
  }
  finish(to, `Sent to ${typeof data === 'number' ? data : 'all'} users.`)
}

// ---------------- Support tickets ----------------

export async function replyTicket(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const to = backTo(formData, '/admin/support')
  const id = str(formData.get('ticketId'), 50)
  const reply = str(formData.get('reply'), 3000)
  if (!UUID.test(id)) finish(to, 'Invalid ticket.', true)
  if (!reply) finish(to, 'Please write a reply.', true)
  const { error } = await supabase
    .from('support_tickets')
    .update({ admin_reply: reply, status: 'answered', replied_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    console.error('replyTicket error:', error.message)
    finish(to, 'Could not send the reply.', true)
  }
  finish(to, 'Reply sent. The user was notified.')
}

export async function setTicketStatus(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const to = backTo(formData, '/admin/support')
  const id = str(formData.get('ticketId'), 50)
  const status = str(formData.get('status'), 10)
  if (!UUID.test(id) || !['open', 'answered', 'closed'].includes(status)) finish(to, 'Invalid request.', true)
  const { error } = await supabase.from('support_tickets').update({ status }).eq('id', id)
  if (error) {
    console.error('setTicketStatus error:', error.message)
    finish(to, 'Could not update the ticket.', true)
  }
  finish(to, `Ticket marked ${status}.`)
}

// ---------------- Site settings (developer page, contacts, announcement) ----------------

const SETTING_KEYS: { key: string; max: number }[] = [
  { key: 'dev_name', max: 80 },
  { key: 'dev_title', max: 120 },
  { key: 'dev_about', max: 3000 },
  { key: 'dev_photo_url', max: 500 },
  { key: 'support_email', max: 200 },
  { key: 'support_phone', max: 40 },
  { key: 'support_whatsapp', max: 40 },
  { key: 'announcement', max: 300 },
]

export async function saveSettings(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const to = '/admin/settings'

  const rows = SETTING_KEYS.map(({ key, max }) => ({
    key,
    value: str(formData.get(key), max),
    updated_at: new Date().toISOString(),
  }))
  const get = (k: string) => rows.find((r) => r.key === k)?.value ?? ''

  if (!get('dev_name')) finish(to, 'Developer name is required.', true)
  if (get('support_email') && !isEmail(get('support_email'))) finish(to, 'Support email is not valid.', true)
  if (get('support_phone') && !isPhone(get('support_phone'))) finish(to, 'Support phone is not valid.', true)
  if (get('support_whatsapp') && !isPhone(get('support_whatsapp'))) finish(to, 'WhatsApp number is not valid.', true)
  if (get('dev_photo_url') && !/^https:\/\//i.test(get('dev_photo_url'))) finish(to, 'Photo link must start with https://', true)

  const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' })
  if (error) {
    console.error('saveSettings error:', error.message)
    finish(to, 'Could not save. Did you run supabase-admin-update.sql?', true)
  }
  revalidatePath('/', 'layout')
  finish(to, 'Settings saved.')
}
