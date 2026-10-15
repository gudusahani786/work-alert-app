'use client'

import { Button } from '@/components/ui/button'

// A submit button that asks "Are you sure?" first (used for delete buttons in the admin panel).
export function ConfirmSubmit({
  message,
  children,
  ...props
}: { message: string; children: React.ReactNode } & Omit<React.ComponentProps<typeof Button>, 'type' | 'onClick'>) {
  return (
    <Button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
      {...props}
    >
      {children}
    </Button>
  )
}
