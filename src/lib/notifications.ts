import type { CouncilEvent } from '../types'

export type NotificationPermissionState =
  | 'unsupported'
  | 'default'
  | 'granted'
  | 'denied'

export function notificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export function showEventNotification(event: CouncilEvent): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    const notification = new Notification(
      `${event.visibility === 'PUBLIC' ? '公开' : '秘密'}事件 · ${event.title}`,
      {
        body: event.content.slice(0, 120) || '会场有一则新事件',
        tag: `mun-event-${event.id}`,
        silent: false,
      },
    )
    notification.onclick = () => {
      window.focus()
      window.location.hash = '#/events'
      notification.close()
    }
  } catch {
    // 部分浏览器（尤其移动端）不允许页面直接 new Notification，忽略即可。
  }
}
