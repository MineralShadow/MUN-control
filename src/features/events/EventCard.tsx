import { formatDateTime } from '../../lib/format'
import type { CouncilEvent } from '../../types'

interface EventCardProps {
  event: CouncilEvent
  canEdit: boolean
  busy?: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleRead: (read: boolean) => void
}

export function EventCard({
  event,
  canEdit,
  busy = false,
  onEdit,
  onDelete,
  onToggleRead,
}: EventCardProps) {
  const published = event.publishedAt !== null
  const recipientNames = event.recipients.map((item) => item.name)

  return (
    <article className={`event-card${event.isCrisis ? ' event-crisis' : ''}`}>
      <header className="event-head">
        <div className="event-heading">
          <div className="event-time-line">
            <span className="event-time">{formatDateTime(event.eventTime)}</span>
            <span className={`badge ${published ? 'badge-published' : 'badge-scheduled'}`}>
              {published ? '已发布' : '定时发布'}
            </span>
            {event.isCrisis ? <span className="badge badge-crisis">危机事件</span> : null}
          </div>
          <h2 className="event-title">{event.title}</h2>
        </div>

        {canEdit ? (
          <div className="event-actions">
            <span className="read-count">
              已读 {event.readCount} / {event.recipientCount}
            </span>
            <button type="button" className="btn btn-ghost btn-xs" onClick={onEdit}>
              修改
            </button>
            <button type="button" className="btn-icon" onClick={onDelete} aria-label="删除事件">
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`read-toggle${event.read ? ' is-read' : ''}`}
            aria-pressed={Boolean(event.read)}
            disabled={busy}
            onClick={() => onToggleRead(!event.read)}
          >
            {event.read ? '已读' : '未读'}
          </button>
        )}
      </header>

      {event.content ? <div className="event-content">{event.content}</div> : null}

      <footer className="event-foot">
        {canEdit ? (
          <>
            <span>
              展示给：
              {recipientNames.length > 0
                ? recipientNames.slice(0, 6).join('、') +
                  (recipientNames.length > 6 ? ` 等 ${recipientNames.length} 个账号` : '')
                : '未选择账号（仅主席可见）'}
            </span>
            {!published ? <span className="event-hint">到达事件时间后自动发布</span> : null}
            {event.isCrisis && published ? (
              <span className="event-hint crisis-text">已触发时间暂停</span>
            ) : null}
          </>
        ) : null}
      </footer>
    </article>
  )
}
