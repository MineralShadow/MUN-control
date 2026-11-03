import { useEffect, useRef } from 'react'
import { showEventNotification } from '../lib/notifications'
import { pushEnabledLocally } from '../lib/push'
import { useConference } from '../state/ConferenceContext'

/**
 * 页面打开（含后台标签页）时轮询到新事件后弹系统通知。
 * 浏览器关闭后无法通知；那需要 Web Push + Service Worker，当前版本不做。
 */
export function EventNotifier() {
  const { me, events } = useConference()
  const seen = useRef<Set<string>>(new Set())
  const initializedFor = useRef<string | null>(null)

  useEffect(() => {
    // Web Push 已订阅时由 Service Worker 负责系统通知，避免重复弹两次
    if (pushEnabledLocally()) return
    if (initializedFor.current !== me.id) {
      initializedFor.current = me.id
      seen.current = new Set()
      for (const event of events) {
        if (event.publishedAt) seen.current.add(event.id)
      }
      return
    }

    for (const event of events) {
      if (!event.publishedAt || !event.inAudience || event.read !== false) continue
      if (seen.current.has(event.id)) continue
      seen.current.add(event.id)
      showEventNotification(event)
    }
  }, [events, me.id])

  return null
}
