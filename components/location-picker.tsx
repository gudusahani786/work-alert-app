'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { COUNTRIES, REMOTE, citiesOf, regionsOf } from '@/lib/locations'
import { useI18n } from '@/lib/i18n/client'

export const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:[&>option]:bg-background'

type Props = {
  defaultCountry?: string | null
  defaultRegion?: string | null
  defaultCity?: string | null
  defaultAddress?: string | null
  allowRemote?: boolean
  requiredCountry?: boolean
}

// Country -> Region -> City dropdowns + exact address. Form fields: country, region, city, address
export function LocationPicker({
  defaultCountry,
  defaultRegion,
  defaultCity,
  defaultAddress,
  allowRemote = false,
  requiredCountry = false,
}: Props) {
  const { t } = useI18n()
  const [country, setCountry] = useState(defaultCountry ?? '')
  const [region, setRegion] = useState(defaultRegion ?? '')
  const [city, setCity] = useState(defaultCity ?? '')

  const isRemote = country === REMOTE
  const regions = country && !isRemote ? regionsOf(country) : []
  const cities = country && region ? citiesOf(country, region) : []

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="country">{t('loc.country')}</Label>
        <select
          id="country"
          name="country"
          required={requiredCountry}
          value={country}
          onChange={(e) => {
            setCountry(e.target.value)
            setRegion('')
            setCity('')
          }}
          className={selectClass}
        >
          <option value="">{t('loc.select')}</option>
          {allowRemote ? <option value={REMOTE}>{t('loc.remote')}</option> : null}
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {!isRemote && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="region">{t('loc.region')}</Label>
            <select
              id="region"
              name="region"
              value={region}
              disabled={!country}
              onChange={(e) => {
                setRegion(e.target.value)
                setCity('')
              }}
              className={selectClass}
            >
              <option value="">{t('loc.select')}</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">{t('loc.city')}</Label>
            <select
              id="city"
              name="city"
              value={city}
              disabled={!region}
              onChange={(e) => setCity(e.target.value)}
              className={selectClass}
            >
              <option value="">{t('loc.select')}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">{t('loc.address')}</Label>
            <Input
              id="address"
              name="address"
              maxLength={300}
              defaultValue={defaultAddress ?? ''}
              placeholder={t('loc.addressPh')}
            />
          </div>
        </>
      )}
    </>
  )
}
