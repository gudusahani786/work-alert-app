'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import {
  canSystemNotify,
  isAlertsOn,
  isSoundOn,
  playMessageSound,
  playNotifySound,
  setAlertsOn,
  setSoundOn,
  startRingtone,
} from '@/lib/sounds'

// Settings card: sound on/off, background alerts on/off, test sound. Saved on this device.
export function NotificationSettings() {
  const { t } = useI18n()
  const [sound, setSound] = useState(true)
  const [alerts, setAlerts] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSound(isSoundOn())
    const ok = canSystemNotify()
    setSupported(ok)
    if (ok) {
      setAlerts(isAlertsOn() && Notification.permission === 'granted')
      setBlocked(Notification.permission === 'denied')
    }
  }, [])

  const toggleSound = (on: boolean) => {
    setSound(on)
    setSoundOn(on)
    if (on) playNotifySound(true)
  }

  const toggleAlerts = async (on: boolean) => {
    if (!on) {
      setAlerts(false)
      setAlertsOn(false)
      return
    }
    const result = await Notification.requestPermission()
    if (result === 'granted') {
      setAlerts(true)
      setAlertsOn(true)
    } else {
      setAlerts(false)
      setAlertsOn(false)
      setBlocked(result === 'denied')
    }
  }

  const test = () => {
    playMessageSound(true)
    setTimeout(() => playNotifySound(true), 700)
    const stop = startRingtone(2500)
    setTimeout(stop, 2500)
  }

  return (
    <div className="grid gap-4 text-sm">
      <label className="flex items-center justify-between gap-3">
        <span>{t('ns.sound')}</span>
        <input type="checkbox" className="h-5 w-5" checked={sound} onChange={(e) => toggleSound(e.target.checked)} />
      </label>
      {supported ? (
        <label className="flex items-center justify-between gap-3">
          <span>{t('ns.alerts')}</span>
          <input type="checkbox" className="h-5 w-5" checked={alerts} onChange={(e) => toggleAlerts(e.target.checked)} />
        </label>
      ) : null}
      {blocked ? <p className="text-xs text-red-500">{t('ns.alertsBlocked')}</p> : null}
      <div>
        <Button type="button" size="sm" variant="outline" onClick={test}>
          {t('ns.test')}
        </Button>
      </div>
    </div>
  )
}
