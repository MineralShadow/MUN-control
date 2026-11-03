import { useState } from 'react'
import { useToast } from '../../components/Toast'
import { apiFetch } from '../../lib/api'
import { useConference } from '../../state/ConferenceContext'
import type { ConferenceSummary } from '../../types'

export function ConferenceManager() {
  const { me, conferences, switchToConference } = useConference()
  const toast = useToast()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  async function create() {
    if (me.role !== 'chair') return
    setCreating(true)
    try {
      const data = await apiFetch<{ conference: ConferenceSummary }>('/conferences', {
        method: 'POST',
        json: { name: name.trim() },
      })
      setName('')
      toast(`已创建会场「${data.conference.name}」`, 'success')
      await switchToConference(data.conference.id)
    } catch (error) {
      toast(error instanceof Error ? error.message : '创建会场失败', 'danger')
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="settings-card">
      <div className="settings-card-head">
        <h2>会场与主席切换</h2>
        <p>
          一个账号可以属于多个会场；每个会场有独立的主席、代表、席位、事件、文件和存档。
          切换会场会重新加载整个工作区。
        </p>
      </div>

      <div className="conference-list">
        {conferences.map((conference) => (
          <div className="conference-row" key={conference.id}>
            <div className="conference-copy">
              <strong>{conference.name}</strong>
              <span>{conference.role === 'chair' ? '主席' : '代表'}</span>
            </div>
            <button
              type="button"
              className={`btn btn-xs ${conference.id === me.conferenceId ? 'btn-ghost' : 'btn-primary'}`}
              disabled={conference.id === me.conferenceId}
              onClick={() => void switchToConference(conference.id)}
            >
              {conference.id === me.conferenceId ? '当前会场' : '切换'}
            </button>
          </div>
        ))}
      </div>

      {me.role === 'chair' ? (
        <div className="conference-create">
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="新会场名称，如：2026 日内瓦会议"
            maxLength={80}
            aria-label="新会场名称"
          />
          <button type="button" className="btn btn-primary" disabled={creating} onClick={() => void create()}>
            {creating ? '创建中…' : '＋ 创建会场'}
          </button>
        </div>
      ) : null}
      <p className="hint">
        新建会场的创建者自动成为该会场主席。要在同一会场增加其他主席，可到「账号管理」创建主席账号。
      </p>
    </section>
  )
}
