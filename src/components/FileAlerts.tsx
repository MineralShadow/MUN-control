import { useState } from 'react'
import { apiFetch } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { navigate } from '../router'
import { useConference } from '../state/ConferenceContext'
import { useToast } from '../components/Toast'

/** 联署文件待确认：在任意页面顶部提醒联署代表团的阁首 */
export function FileAlerts() {
  const { files, refresh } = useConference()
  const toast = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)
  const pending = files.filter((item) => item.canConfirm && item.myConfirmation === 'PENDING')
  if (pending.length === 0) return null

  async function confirm(itemId: string) {
    setBusyId(itemId)
    try {
      await apiFetch(`/files/${itemId}/confirm`, { method: 'POST' })
      await refresh()
      toast('已确认联署', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '确认失败', 'danger')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="event-alerts file-alerts" aria-live="assertive">
      {pending.slice(0, 3).map((item) => (
        <div className="event-alert" key={item.id}>
          <div className="event-alert-body">
            <div className="event-alert-time">
              {formatDateTime(item.submittedAt)}
              <span className="badge badge-gold">联署待确认</span>
            </div>
            <div className="event-alert-title">{item.title}</div>
          </div>
          <div className="event-alert-actions">
            <button type="button" className="event-alert-link" onClick={() => navigate('/files')}>
              查看
            </button>
            <button
              type="button"
              className="event-alert-read"
              disabled={busyId === item.id}
              onClick={() => void confirm(item.id)}
            >
              {busyId === item.id ? '…' : '确认联署'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
