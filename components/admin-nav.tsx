'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/jobs', label: 'Jobs' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/notifications', label: 'Notifications' },
  { href: '/admin/support', label: 'Support' },
  { href: '/admin/settings', label: 'Settings' },
]

export function AdminNav() {
  const pathname = usePathname() ?? '/admin'
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => {
        const active = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
