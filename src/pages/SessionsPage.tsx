import { useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { SessionCard } from '../features/sessions/SessionCard'
import { createId } from '../lib/id'
import { Link } from '../router'
import { useConference } from '../state/ConferenceContext'
import { getCurrentSession, getCurrentTopic } from '../state/selectors'
import type { Session } from '../types'

export function SessionsPage() {
  const { state, dispatch, me } = useConference()
  const toast = useToast()
  const canEdit = me.role === 'chair'
  const [newSessionName, setNewSessionName] = useState('')

  const currentSession = getCurrentSession(state)
  const currentTopic = getCurrentTopic(state)

  function addSession(event: FormEvent) {
    event.preventDefault()
    const session: Session = {
      id: createId('session'),
      name: newSessionName.trim().slice(0, 40) || `第 ${state.sessions.length + 1} 会期`,
      topics: [],
    }
    dispatch({ type: 'session/add', session })
    setNewSessionName('')
    toast('会期已添加', 'success')
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="SESSIONS & TOPICS"
        title="会期"
        description={
          canEdit
            ? '编排会期与议题。被设为“当前”的议题会显示在顶栏会议主题右侧，并成为投票页的默认归档。'
            : '查看会期与议题。当前议题由主席团设置，并显示在顶栏会议主题右侧。'
        }
        actions={
          currentSession && currentTopic ? (
            <Link to="/voting" className="btn btn-ghost">
              前往当前议题投票
            </Link>
          ) : null
        }
      />

      <div className={`agenda-bar${currentSession && currentTopic ? ' active' : ''}`}>
        <div className="agenda-copy">
          <div className="eyebrow">CURRENT AGENDA</div>
          {currentSession && currentTopic ? (
            <div className="agenda-value">
              <span>{currentSession.name}</span>
              <span className="dot-sep" aria-hidden="true">
                ·
              </span>
              <strong>{currentTopic.name}</strong>
            </div>
          ) : (
            <div className="agenda-value muted">尚未选择当前议题</div>
          )}
        </div>
        <span className="agenda-note">
          当前议题会同步到所有页面左上角
        </span>
      </div>

      {canEdit ? (
        <form className="add-bar" onSubmit={addSession}>
          <input
            id="new-session"
            className="input"
            value={newSessionName}
            onChange={(event) => setNewSessionName(event.target.value)}
            placeholder="会期名称，如：第一次会期（可留空）"
            maxLength={40}
            aria-label="新会期名称"
          />
          <button type="submit" className="btn btn-primary">
            ＋ 添加会期
          </button>
        </form>
      ) : null}

      {state.sessions.length === 0 ? (
        <EmptyState
          title="还没有会期"
          description={
            canEdit
              ? '先建立一个会期，再为它添加议题。之后就可以把某个议题设为当前议程。'
              : '主席团还没有建立会期。'
          }
          action={
            canEdit ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => document.getElementById('new-session')?.focus()}
              >
                添加第一个会期
              </button>
            ) : null
          }
        />
      ) : (
        <div className="session-list">
          {state.sessions.map((session, index) => (
            <SessionCard
              key={session.id}
              session={session}
              index={index}
              isCurrentSession={session.id === state.currentSessionId}
              currentTopicId={state.currentTopicId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
