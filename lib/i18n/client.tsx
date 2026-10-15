'use client'

import { createContext, useContext, useMemo } from 'react'
import { makeI18n, type Locale } from './dictionaries'

const Ctx = createContext<Locale>('en')

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>
}

export function useI18n() {
  const locale = useContext(Ctx)
  return useMemo(() => makeI18n(locale), [locale])
}
