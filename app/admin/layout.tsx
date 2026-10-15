import { requireAdmin } from '@/lib/admin'
import { Navbar } from '@/components/navbar'
import { AdminNav } from '@/components/admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin()
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar initialUser={user} />
      <div className="mx-auto w-full max-w-6xl space-y-3 px-4 pt-6">
        <h1 className="text-2xl font-bold">Admin panel</h1>
        <AdminNav />
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
