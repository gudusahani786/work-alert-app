'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationBell } from '@/components/notification-bell'
import { useI18n } from '@/lib/i18n/client'
import type { Key } from '@/lib/i18n/dictionaries'
import { BriefcaseBusiness, LogOut, Settings, ShieldCheck, User as UserIcon } from 'lucide-react'

// Ek hi account: sab log job dhundh sakte, apply kar sakte aur job post bhi kar sakte hain.
const LINKS: { href: string; key: Key; match: (p: string) => boolean }[] = [
  { href: '/', key: 'nav.home', match: (p) => p === '/' },
  { href: '/jobs', key: 'nav.jobs', match: (p) => p.startsWith('/jobs') },
  { href: '/dashboard', key: 'nav.applications', match: (p) => p.startsWith('/dashboard') },
  { href: '/employer', key: 'nav.myJobs', match: (p) => p.startsWith('/employer') },
  { href: '/chat', key: 'nav.messages', match: (p) => p.startsWith('/chat') },
  { href: '/profile', key: 'nav.profile', match: (p) => p.startsWith('/profile') },
  { href: '/settings', key: 'nav.settings', match: (p) => p.startsWith('/settings') },
]

export function Navbar({ initialUser }: { initialUser: User | null }) {
  const { t } = useI18n()
  const [user, setUser] = useState<User | null>(initialUser)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isBanned, setIsBanned] = useState(false)
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const supabase = createClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('avatar_url, is_admin, is_banned')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAvatar(data.avatar_url ?? null)
          setIsAdmin(!!data.is_admin)
          setIsBanned(!!data.is_banned)
        }
      })
  }, [user, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initial =
    (user?.user_metadata?.full_name as string | undefined)?.charAt(0) ??
    user?.email?.charAt(0) ??
    'U'

  const linkClass = (active: boolean) =>
    `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BriefcaseBusiness className="h-5 w-5" />
          </span>
          <span>
            Work<span className="text-primary">Alert</span>
          </span>
        </Link>

        {user ? (
          <nav className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.match(pathname))}>
                {t(l.key)}
              </Link>
            ))}
            {isAdmin ? (
              <Link href="/admin" className={linkClass(pathname.startsWith('/admin'))}>
                Admin
              </Link>
            ) : null}
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? <NotificationBell userId={user.id} /> : null}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold uppercase text-primary-foreground">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    {t('nav.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('nav.settings')}
                  </Link>
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Admin panel
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">{t('nav.login')}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/sign-up">{t('nav.createAccount')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Phone / tablet: neeche scroll hone wali tab bar */}
      {user ? (
        <nav className="border-t border-border lg:hidden">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.match(pathname))}>
                {t(l.key)}
              </Link>
            ))}
            {isAdmin ? (
              <Link href="/admin" className={linkClass(pathname.startsWith('/admin'))}>
                Admin
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}

      {isBanned ? (
        <div className="bg-red-600 px-4 py-2 text-center text-sm text-white">{t('ban.msg')}</div>
      ) : null}
    </header>
  )
}
