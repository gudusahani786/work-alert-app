import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Use at the top of every admin page and admin action.
// Not logged in -> login page. Logged in but not an admin -> home page.
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!me?.is_admin) redirect('/')
  return { supabase, user }
}
