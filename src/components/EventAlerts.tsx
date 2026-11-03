import { useState } from 'react'
import { apiFetch } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { navigate } from '../router'
import { useConference } from '../state/ConferenceContext'
import { useToast } from './Toast'

/** 代表端：未读事件在任意页面顶部弹出，包含事件时间与标题 */
export function EventAlerts() {
  const { events, refresh } = useConference()
  const toast = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)

  const unread = events
    .filter((event) => event.publishedAt && event.inAudience && !event.read)
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))

  if (unread.length === 0) return null

  async function markRead(eventId: string) {
    setBusyId(eventId)
    try {
      await apiFetch(`/events/${eventId}/read`, {
        method: 'POST',
        json: { read: true },
      })
      await refresh()
    } catch (error) {
      toast(error instanceof Error ? error.message : '操作失败', 'danger')
    } finally {
      setBusyId(null)
    }
  }

  const shown = unread.slice(0, 3)

  return (
    <div className="event-alerts" aria-live="assertive">
      {shown.map((event) => (
        <div className="event-alert" key={event.id}>
          <div className="event-alert-body">
            <div className="event-alert-time">
              {formatDateTime(event.eventTime)}
              <span className={`badge ${event.visibility === 'PUBLIC' ? 'badge-public' : 'badge-secret'}`}>
                {event.visibility === 'PUBLIC' ? '公开' : '秘密'}
              </span>
              {event.isCrisis ? <span className="badge badge-crisis">危机</span> : null}
            </div>
            <div className="event-alert-title">{event.title}</div>
          </div>
          <div className="event-alert-actions">
            <button
              type="button"
              className="event-alert-link"
              onClick={() => navigate('/events')}
            >
              查看
            </button>
            <button
              type="button"
              className="event-alert-read"
              disabled={busyId === event.id}
              onClick={() => void markRead(event.id)}
            >
              {busyId === event.id ? '…' : '标为已读'}
            </button>
          </div>
        </div>
      ))}
      {unread.length > shown.length ? (
        <div className="event-alert-more">还有 {unread.length - shown.length} 条未读事件</div>
      ) : null}
    </div>
  )
}
