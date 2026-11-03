import { useEffect, useRef } from 'react'
import { showEventNotification } from '../lib/notifications'
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
