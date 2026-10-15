import { hourlyBoth } from '@/lib/currency'
import type { Job } from '@/lib/types'

// Hourly rate: Won aur Dollar dono me
export function PayDisplay({
  job,
  rate,
  perHour,
  negotiable,
  size = 'sm',
}: {
  job: Job
  rate: number
  perHour: string
  negotiable: string
  size?: 'sm' | 'lg'
}) {
  const pay = hourlyBoth(job, rate)
  if (!pay) return <span className="text-muted-foreground">{negotiable}</span>
  return (
    <span className="flex flex-col leading-tight">
      <span className={`${size === 'lg' ? 'text-lg' : 'text-sm'} font-semibold text-foreground`}>
        {pay.krw}
        {perHour}
      </span>
      <span className="text-xs text-muted-foreground">
        ≈ {pay.usd}
        {perHour}
      </span>
    </span>
  )
}
