import { useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { useConfirm } from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { EventCard } from '../features/events/EventCard'
import { EventForm } from '../features/events/EventForm'
import { apiFetch } from '../lib/api'
import { useConference } from '../state/ConferenceContext'
import type { CouncilEvent } from '../types'

export function EventsPage() {
  const { events, accounts, me, refresh } = useConference()
  const confirm = useConfirm()
  const toast = useToast()
  const canEdit = me.role === 'chair'

  const [editing, setEditing] = useState<CouncilEvent | 'new' | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function toggleRead(event: CouncilEvent, read: boolean) {
    setBusyId(event.id)
    try {
      await apiFetch(`/events/${event.id}/read`, {
        method: 'POST',
        json: { read },
      })
      await refresh()
    } catch (error) {
      toast(error instanceof Error ? error.message : '操作失败', 'danger')
    } finally {
      setBusyId(null)
    }
  }

  async function removeEvent(event: CouncilEvent) {
    const ok = await confirm({
      title: `删除事件「${event.title}」？`,
      message: '删除后无法恢复；如果它正在造成危机暂停，也会解除暂停。',
      confirmText: '删除事件',
      danger: true,
    })
    if (!ok) return
    try {
      await apiFetch(`/events/${event.id}`, { method: 'DELETE' })
      await refresh()
      toast('事件已删除', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '删除失败', 'danger')
    }
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="EVENTS & CRISIS"
        title="事件"
        description={
          canEdit
            ? '主席团发布事件、选择收件账号、定时发布或标记危机。危机事件发布会暂停时间流动。'
            : '这里会显示主席团发给你的事件。未读事件会在页面顶部弹出提醒。'
        }
        actions={
          canEdit ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setEditing('new')}
            >
              ＋ 发布事件
            </button>
          ) : null
        }
      />

      {canEdit ? (
        <div className="notice">
          主席提示：进入本页前已确认没有投屏给代表。定时事件会按「时间」页的会议时钟自动发布。
        </div>
      ) : null}

      {events.length === 0 ? (
        <EmptyState
          icon="✦"
          title={canEdit ? '还没有事件' : '暂时没有收到事件'}
          description={
            canEdit
              ? '发布第一条事件，并选择要展示给哪些代表账号。'
              : '主席团发布事件后，会在这里出现，并在顶部弹出提醒。'
          }
          action={
            canEdit ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setEditing('new')}
              >
                发布第一条事件
              </button>
            ) : null
          }
        />
      ) : (
        <div className="event-list">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              canEdit={canEdit}
              busy={busyId === event.id}
              onEdit={() => setEditing(event)}
              onDelete={() => void removeEvent(event)}
              onToggleRead={(read) => void toggleRead(event, read)}
            />
          ))}
        </div>
      )}

      {editing ? (
        <EventForm
          key={editing === 'new' ? 'new' : editing.id}
          event={editing === 'new' ? null : editing}
          accounts={accounts}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void refresh()
          }}
        />
      ) : null}
    </div>
  )
}
