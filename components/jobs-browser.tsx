'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { JobCard } from '@/components/job-card'
import { Input } from '@/components/ui/input'
import { selectClass } from '@/components/location-picker'
import { COUNTRIES, citiesOf, regionsOf } from '@/lib/locations'
import { useI18n } from '@/lib/i18n/client'
import { Search } from 'lucide-react'
import type { Job } from '@/lib/types'

export function JobsBrowser({ initialJobs, rate }: { initialJobs: Job[]; isAuthed: boolean; rate: number }) {
  const { t, label } = useI18n()
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [type, setType] = useState('all')
  const [country, setCountry] = useState('all')
  const [region, setRegion] = useState('all')
  const [city, setCity] = useState('all')

  // Real-time: new/closed/deleted jobs update instantly without a refresh.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('jobs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as { id?: string }).id
          setJobs((prev) => prev.filter((j) => j.id !== oldId))
          return
        }
        const next = payload.new as Job
        setJobs((prev) => {
          const rest = prev.filter((j) => j.id !== next.id)
          if (next.status !== 'open') return rest
          const exists = prev.some((j) => j.id === next.id)
          return exists ? prev.map((j) => (j.id === next.id ? next : j)) : [next, ...rest]
        })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const categories = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.category).filter(Boolean))) as string[],
    [jobs],
  )
  const types = useMemo(() => Array.from(new Set(jobs.map((j) => j.job_type).filter(Boolean))), [jobs])

  const regions = country !== 'all' ? regionsOf(country) : []
  const cities = country !== 'all' && region !== 'all' ? citiesOf(country, region) : []

  const filtered = jobs.filter((j) => {
    const q = query.toLowerCase().trim()
    const matchesQuery =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q)
    return (
      matchesQuery &&
      (category === 'all' || j.category === category) &&
      (type === 'all' || j.job_type === type) &&
      (country === 'all' || j.country === country) &&
      (region === 'all' || j.region === region) &&
      (city === 'all' || j.city === city)
    )
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">{t('jobs.open')}</h2>
        <p className="text-sm text-muted-foreground">{t('jobs.count', { n: filtered.length })}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative sm:col-span-2 lg:col-span-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('jobs.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value)
            setRegion('all')
            setCity('all')
          }}
          className={selectClass}
        >
          <option value="all">{t('jobs.allCountries')}</option>
          <option value="Remote">{t('loc.remote')}</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={region}
          disabled={country === 'all' || country === 'Remote'}
          onChange={(e) => {
            setRegion(e.target.value)
            setCity('all')
          }}
          className={selectClass}
        >
          <option value="all">{t('jobs.allRegions')}</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={city}
          disabled={region === 'all'}
          onChange={(e) => setCity(e.target.value)}
          className={selectClass}
        >
          <option value="all">{t('jobs.allCities')}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
          <option value="all">{t('jobs.allCategories')}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {label('cat', c)}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
          <option value="all">{t('jobs.allTypes')}</option>
          {types.map((x) => (
            <option key={x} value={x}>
              {label('type', x)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          {t('jobs.noMatch')}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} rate={rate} />
          ))}
        </div>
      )}
      <p className="text-center text-xs text-muted-foreground">{t('jobs.rateNote', { r: Math.round(rate) })}</p>
    </div>
  )
}
