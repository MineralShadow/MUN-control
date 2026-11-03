import { apiFetch } from './api'

export type PushResult = 'granted' | 'denied' | 'unsupported' | 'error'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function pushEnabledLocally(): boolean {
  return typeof window !== 'undefined' && window.localStorage.getItem('mun_push') === '1'
}

export async function enablePush(): Promise<PushResult> {
  if (!pushSupported()) return 'unsupported'
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return 'denied'

    const registration = await navigator.serviceWorker.register('/sw.js')
    const existing = await registration.pushManager.getSubscription()
    const subscription =
      existing ??
      (await (async () => {
        const data = await apiFetch<{ publicKey: string }>('/push/public-key')
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey) as BufferSource,
        })
      })())

    await apiFetch('/push/subscribe', {
      method: 'POST',
      json: subscription.toJSON(),
    })
    window.localStorage.setItem('mun_push', '1')
    return 'granted'
  } catch (error) {
    console.warn('[push] enable failed', error)
    return 'error'
  }
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await apiFetch('/push/subscribe', {
        method: 'DELETE',
        json: { endpoint: subscription.endpoint },
      }).catch(() => undefined)
      await subscription.unsubscribe()
    }
  } finally {
    window.localStorage.removeItem('mun_push')
  }
}
