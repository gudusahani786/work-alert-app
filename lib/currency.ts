// KRW <-> USD helpers. Live rate server pe 6 ghante cache hota hai; na mile to fallback.
export const FALLBACK_USD_KRW = 1400

export async function getUsdKrw(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      const json = (await res.json()) as { rates?: { KRW?: number } }
      const r = json?.rates?.KRW
      if (typeof r === 'number' && r > 500 && r < 5000) return Math.round(r * 100) / 100
    }
  } catch {
    // network error: fallback use hoga
  }
  return FALLBACK_USD_KRW
}

const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const nf2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtKrw = (n: number) => `₩${nf.format(Math.round(n))}`
export const fmtUsd = (n: number) => `$${nf2.format(n)}`

type Pay = {
  pay_currency?: 'KRW' | 'USD' | null
  hourly_min?: number | null
  hourly_max?: number | null
}

// Dono currency me hourly rate: { krw: "₩12,000 – ₩15,000", usd: "$8.57 – $10.71" }
export function hourlyBoth(job: Pay, rate: number): { krw: string; usd: string } | null {
  const min = job.hourly_min != null ? Number(job.hourly_min) : null
  const max = job.hourly_max != null ? Number(job.hourly_max) : null
  if (min == null && max == null) return null
  const cur = job.pay_currency === 'USD' ? 'USD' : 'KRW'
  const toKrw = (v: number) => (cur === 'KRW' ? v : Math.round((v * rate) / 100) * 100)
  const toUsd = (v: number) => (cur === 'USD' ? v : v / rate)
  const lo = (min ?? max) as number
  const hi = (max ?? min) as number
  const range = (f: (n: number) => string, conv: (n: number) => number) =>
    lo === hi ? f(conv(lo)) : `${f(conv(lo))} – ${f(conv(hi))}`
  return { krw: range(fmtKrw, toKrw), usd: range(fmtUsd, toUsd) }
}
