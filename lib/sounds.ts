// Sounds are made in the browser with the Web Audio API: no audio files to download.
// Browsers only allow sound after the person touched the page once, so unlockAudio() is called on the first tap.

const SOUND_KEY = 'wa_sound'
const ALERTS_KEY = 'wa_alerts'
let ctx: AudioContext | null = null

export function isSoundOn(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(SOUND_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSoundOn(on: boolean) {
  try {
    window.localStorage.setItem(SOUND_KEY, on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
}

export function isAlertsOn(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(ALERTS_KEY) === 'on'
  } catch {
    return false
  }
}

export function setAlertsOn(on: boolean) {
  try {
    window.localStorage.setItem(ALERTS_KEY, on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    try {
      ctx = new AC()
    } catch {
      return null
    }
  }
  return ctx
}

export function unlockAudio() {
  const c = getCtx()
  if (c && c.state === 'suspended') void c.resume().catch(() => {})
}

function tone(freq: number, start: number, dur: number, vol = 0.15, type: OscillatorType = 'sine') {
  const c = getCtx()
  if (!c) return
  try {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.value = freq
    const t0 = c.currentTime + start
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.05)
  } catch {
    /* ignore */
  }
}

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern)
  } catch {
    /* ignore */
  }
}

// New chat message: short "ding-ding"
export function playMessageSound(force = false) {
  if (!force && !isSoundOn()) return
  unlockAudio()
  tone(880, 0, 0.12, 0.16)
  tone(1175, 0.12, 0.2, 0.16)
  vibrate(80)
}

// New job / other notification: soft two-note chime
export function playNotifySound(force = false) {
  if (!force && !isSoundOn()) return
  unlockAudio()
  tone(660, 0, 0.16, 0.12)
  tone(990, 0.16, 0.24, 0.12)
  vibrate(60)
}

// Incoming call: phone-like ringing that repeats until stopped (or maxMs)
export function startRingtone(maxMs = 30000): () => void {
  if (!isSoundOn()) return () => {}
  unlockAudio()
  let stopped = false
  const ring = () => {
    tone(1046, 0, 0.2, 0.22, 'triangle')
    tone(784, 0.25, 0.2, 0.22, 'triangle')
    tone(1046, 0.5, 0.2, 0.22, 'triangle')
    tone(784, 0.75, 0.2, 0.22, 'triangle')
    vibrate([300, 150, 300])
  }
  ring()
  const interval = setInterval(ring, 2200)
  const timeout = setTimeout(() => stop(), maxMs)
  function stop() {
    if (stopped) return
    stopped = true
    clearInterval(interval)
    clearTimeout(timeout)
  }
  return stop
}

// System alert (only when this tab is in the background and the person allowed alerts)
export function canSystemNotify(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function showSystemNotification(title: string, body: string, url?: string) {
  if (!canSystemNotify() || !isAlertsOn()) return
  if (Notification.permission !== 'granted' || !document.hidden) return
  try {
    const n = new Notification(title, { body, icon: '/icon-light-32x32.png' })
    n.onclick = () => {
      window.focus()
      if (url) window.location.href = url
      n.close()
    }
  } catch {
    /* ignore */
  }
}
