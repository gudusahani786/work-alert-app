import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { updateUser } from '@/app/admin/actions'
import { AdminFlash, pick } from '@/components/admin-flash'
import { selectClass } from '@/components/location-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default async function AdminEditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const sp = await searchParams
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (!data) notFound()
  const p = data as Profile

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/users">
          <ArrowLeft className="mr-1 h-4 w-4" /> All users
        </Link>
      </Button>
      <AdminFlash ok={pick(sp.ok)} error={pick(sp.error)} />
      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 text-sm text-muted-foreground">{p.email}</p>
          <form action={updateUser} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="userId" value={p.id} />
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" maxLength={200} defaultValue={p.full_name ?? ''} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" maxLength={40} defaultValue={p.phone ?? ''} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gender">Gender</Label>
              <select id="gender" name="gender" defaultValue={p.gender ?? ''} className={selectClass}>
                <option value="">-</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not">Prefer not to say</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location (text)</Label>
              <Input id="location" name="location" maxLength={200} defaultValue={p.location ?? ''} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="headline">Headline</Label>
              <Input id="headline" name="headline" maxLength={200} defaultValue={p.headline ?? ''} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="company_name">Company name</Label>
              <Input id="company_name" name="company_name" maxLength={200} defaultValue={p.company_name ?? ''} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="bio">About</Label>
              <Textarea id="bio" name="bio" rows={5} maxLength={3000} defaultValue={p.bio ?? ''} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
