import { cookies } from 'next/headers'
import { isLocale, makeI18n, type Locale } from './dictionaries'

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get('lang')?.value
  return isLocale(v) ? v : 'en'
}

export async function getI18n() {
  return makeI18n(await getLocale())
}
