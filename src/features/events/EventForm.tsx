import { useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import { Segmented } from '../../components/Segmented'
import { Toggle } from '../../components/Toggle'
import { useToast } from '../../components/Toast'
import { apiFetch } from '../../lib/api'
import { fromDatetimeLocal, toDatetimeLocal } from '../../lib/format'
import { useConference } from '../../state/ConferenceContext'
import type { AccountInfo, CouncilEvent } from '../../types'

interface EventFormProps {
  event: CouncilEvent | null
  accounts: AccountInfo[]
  onClose: () => void
  onSaved: () => void
}

export function EventForm({ event, accounts, onClose, onSaved }: EventFormProps) {
  const { time } = useConference()
  const toast = useToast()
  const [title, setTitle] = useState(event?.title ?? '')
  const [content, setContent] = useState(event?.content ?? '')
  const [timeValue, setTimeValue] = useState(
    toDatetimeLocal(event?.eventTime ?? time.currentMs),
  )
  const [isCrisis, setIsCrisis] = useState(event?.isCrisis ?? false)
  const [isRealtime, setIsRealtime] = useState(event?.isRealtime ?? false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [visibility, setVisibility] = useState<'PUBLIC' | 'SECRET'>(
    event?.visibility ?? 'PUBLIC',
  )
  const [recipientIds, setRecipientIds] = useState<string[]>(
    event?.recipients.map((item) => item.accountId) ?? [],
  )
  const [saving, setSaving] = useState(false)

  const delegates = accounts.filter((account) => account.role === 'delegate')
  const published = Boolean(event?.publishedAt)

  function toggleRecipient(id: string) {
    setRecipientIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    )
  }

  async function handleSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault()
    if (!title.trim()) {
      toast('请填写事件标题', 'danger')
      return
    }
    const eventTime = isRealtime ? time.currentMs : fromDatetimeLocal(timeValue)
    if (eventTime === null) {
      toast('请选择有效的事件时间', 'danger')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        eventTime,
        isCrisis,
        isRealtime,
        visibility: isCrisis ? 'PUBLIC' : visibility,
        recipientIds: isCrisis || visibility === 'PUBLIC' ? [] : recipientIds,
      }
      let eventId = event?.id
      if (event) {
        await apiFetch(`/events/${event.id}`, { method: 'PATCH', json: payload })
      } else {
        const created = await apiFetch<{ id: string }>('/events', {
          method: 'POST',
          json: payload,
        })
        eventId = created.id
      }
      if (attachment && eventId) {
        const form = new FormData()
        form.set('file', attachment)
        await apiFetch(`/events/${eventId}/attachment`, {
          method: 'POST',
          body: form,
        })
      }
      toast(event ? '事件已更新' : '事件已创建', 'success')
      onSaved()
    } catch (error) {
      toast(error instanceof Error ? error.message : '保存失败', 'danger')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={event ? '修改事件' : '发布事件'}
      subtitle={
        event
          ? published
            ? '事件已发布；已发布事件不能修改事件时间。'
            : '到达事件时间后会自动发布给所选账号。'
          : '选择收件账号；若事件时间已过，会立即发布。'
      }
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            取消
          </button>
          <button
            type="submit"
            form="event-form"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? '保存中…' : event ? '保存修改' : '发布事件'}
          </button>
        </>
      }
    >
      <form id="event-form" className="event-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>事件标题</span>
          <input
            className="input"
            value={title}
            onChange={(inputEvent) => setTitle(inputEvent.target.value)}
            maxLength={80}
            placeholder="例如：柏林会议进入危机阶段"
          />
        </label>

        <div className="event-realtime-row">
          <div>
            <span className="field-label">实时发送</span>
            <p className="hint">实时事件不需要填写发布时间，保存后立即发布。</p>
          </div>
          <Toggle checked={isRealtime} onChange={setIsRealtime} label="实时发送事件" />
        </div>

        <div className="event-form-row">
          <label className="field">
            <span>事件时间（会议时间）</span>
            <input
              className="input"
              type="datetime-local"
              step="1"
              value={timeValue}
              disabled={published || isRealtime}
              onChange={(inputEvent) => setTimeValue(inputEvent.target.value)}
            />
          </label>

          <div className="crisis-field">
            <div>
              <span className="field-label">是否属于危机</span>
              <p className="hint">
                发布后会立刻暂停时间流动，直到主席解除危机暂停。
              </p>
            </div>
            <Toggle
              checked={isCrisis}
              onChange={setIsCrisis}
              label="是否属于危机事件"
            />
          </div>
        </div>

        <label className="field">
          <span>附件（可选，≤2MB）</span>
          <input
            className="input file-input"
            type="file"
            onChange={(inputEvent) => setAttachment(inputEvent.target.files?.[0] ?? null)}
          />
          <small className="hint">
            {attachment
              ? `${attachment.name} · ${(attachment.size / 1024).toFixed(1)} KB`
              : event?.attachment
                ? `已有附件：${event.attachment.filename}（重新选择可替换）`
                : '尚未选择附件'}
          </small>
        </label>

        <div className="event-visibility">
          <span className="field-label">展示范围</span>
          <Segmented
            value={isCrisis ? 'PUBLIC' : visibility}
            options={[
              { value: 'PUBLIC', label: '公开事件' },
              { value: 'SECRET', label: '秘密事件' },
            ]}
            onChange={(value) => {
              if (value === 'SECRET' && isCrisis) return
              setVisibility(value)
            }}
            ariaLabel="事件展示范围"
          />
          <p className="hint">
            {isCrisis
              ? '危机事件必须是公开事件：所有账号都会看到并收到弹窗提醒。'
              : visibility === 'PUBLIC'
                ? '所有账号（含主席团）可见，并在页面顶部弹出提醒。'
                : '只有下方勾选的代表账号可见并收到弹窗提醒。'}
          </p>
        </div>

        <label className="field">
          <span>事件内容</span>
          <textarea
            className="input textarea"
            value={content}
            onChange={(inputEvent) => setContent(inputEvent.target.value)}
            rows={6}
            maxLength={8000}
            placeholder="写给代表的事件内容…"
          />
        </label>

        {isCrisis || visibility === 'PUBLIC' ? (
          <div className="notice">
            公开事件：所有已存在的账号都会看到；新创建的代表账号也会自动看到。
          </div>
        ) : (
          <div className="recipient-field">
            <div className="recipient-head">
              <span>秘密事件展示给哪些账号？</span>
              <span className="hint">已选 {recipientIds.length} 个代表账号</span>
            </div>
            {delegates.length === 0 ? (
              <p className="hint">
                还没有代表账号。请先在「设置 → 账号管理」里创建代表账号。
              </p>
            ) : (
              <div className="recipient-grid">
                {delegates.map((account) => {
                  const checked = recipientIds.includes(account.id)
                  return (
                    <label
                      key={account.id}
                      className={`recipient-chip${checked ? ' checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecipient(account.id)}
                      />
                      <span>{account.name}</span>
                      <small>{account.username}</small>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  )
}
