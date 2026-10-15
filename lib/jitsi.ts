// Jitsi call link: room name = conversation id (random UUID, sirf 2 participants ko pata hota hai)
export type CallMode = 'voice' | 'video'

export function jitsiUrl(conversationId: string, mode: CallMode, displayName?: string): string {
  const hash = [
    mode === 'voice' ? 'config.startWithVideoMuted=true' : '',
    displayName ? `userInfo.displayName=${encodeURIComponent(JSON.stringify(displayName))}` : '',
  ]
    .filter(Boolean)
    .join('&')
  return `https://meet.jit.si/WorkAlert-${conversationId}${hash ? `#${hash}` : ''}`
}
