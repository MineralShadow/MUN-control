import { useState, type FormEvent } from 'react'
import { EditableText } from '../../components/EditableText'
import { useConfirm } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { createId } from '../../lib/id'
import { useConference } from '../../state/ConferenceContext'
import {
  countResolutionsForSession,
  countResolutionsForTopic,
} from '../../state/selectors'
import type { Session, Topic } from '../../types'

interface SessionCardProps {
  session: Session
  index: number
  isCurrentSession: boolean
  currentTopicId: string | null
}

export function SessionCard({
  session,
  index,
  isCurrentSession,
  currentTopicId,
}: SessionCardProps) {
  const { state, dispatch, me } = useConference()
  const confirm = useConfirm()
  const toast = useToast()
  const canEdit = me.role === 'chair'
  const [newTopicName, setNewTopicName] = useState('')

  function addTopic(event: FormEvent) {
    event.preventDefault()
    const topic: Topic = {
      id: createId('topic'),
      name:
        newTopicName.trim().slice(0, 60) || `议题 ${session.topics.length + 1}`,
    }
    dispatch({ type: 'topic/add', sessionId: session.id, topic })
    setNewTopicName('')
    toast('议题已添加', 'success')
  }

  function setCurrent(topic: Topic) {
    dispatch({
      type: 'current/set',
      sessionId: session.id,
      topicId: topic.id,
    })
    toast(`当前议题：${session.name} · ${topic.name}`, 'success')
  }

  async function removeTopic(topic: Topic) {
    const resolutionCount = countResolutionsForTopic(state, topic.id)
    const ok = await confirm({
      title: `删除议题「${topic.name}」？`,
      message:
        resolutionCount > 0
          ? `该议题下的 ${resolutionCount} 项决议会一并删除，且无法撤销。`
          : '该议题下还没有决议。',
      confirmText: '删除议题',
      danger: true,
    })
    if (ok) {
      dispatch({ type: 'topic/delete', sessionId: session.id, topicId: topic.id })
      toast('议题已删除', 'success')
    }
  }

  async function removeSession() {
    const resolutionCount = countResolutionsForSession(state, session.id)
    const ok = await confirm({
      title: `删除会期「${session.name}」？`,
      message: `将删除其 ${session.topics.length} 个议题${
        resolutionCount > 0 ? ` 与 ${resolutionCount} 项决议` : ''
      }，且无法撤销。`,
      confirmText: '删除会期',
      danger: true,
    })
    if (ok) {
      dispatch({ type: 'session/delete', id: session.id })
      toast('会期已删除', 'success')
    }
  }

  return (
    <article className={`session-card${isCurrentSession ? ' current' : ''}`}>
      <header className="session-head">
        <div className="session-title">
          <div className="eyebrow">SESSION {String(index + 1).padStart(2, '0')}</div>
          <div className="session-name-line">
            <EditableText
              className="session-name"
              value={session.name}
              onSave={(name) => dispatch({ type: 'session/rename', id: session.id, name })}
              maxLength={40}
              ariaLabel="会期名称"
              editable={canEdit}
            />
            {isCurrentSession ? <span className="badge badge-current">当前会期</span> : null}
          </div>
        </div>
        {canEdit ? (
          <button
            type="button"
            className="btn-icon"
            onClick={removeSession}
            aria-label={`删除会期 ${session.name}`}
            title="删除会期"
          >
            ×
          </button>
        ) : null}
      </header>

      <ul className="topic-list">
        {session.topics.map((topic, topicIndex) => {
          const isCurrent = currentTopicId === topic.id
          return (
            <li key={topic.id} className={`topic-row${isCurrent ? ' current' : ''}`}>
              <span className="topic-no" aria-hidden="true">
                {String(topicIndex + 1).padStart(2, '0')}
              </span>
              <EditableText
                className="topic-name"
                value={topic.name}
                onSave={(name) =>
                  dispatch({
                    type: 'topic/rename',
                    sessionId: session.id,
                    topicId: topic.id,
                    name,
                  })
                }
                maxLength={60}
                ariaLabel="议题名称"
                editable={canEdit}
              />
              <span className="topic-res-count">
                {countResolutionsForTopic(state, topic.id)} 项决议
              </span>
              {isCurrent ? (
                <span className="badge badge-current">当前议题</span>
              ) : canEdit ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setCurrent(topic)}
                >
                  设为当前
                </button>
              ) : null}
              {canEdit ? (
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => removeTopic(topic)}
                  aria-label={`删除议题 ${topic.name}`}
                  title="删除议题"
                >
                  ×
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>

      {session.topics.length === 0 ? (
        <p className="hint topic-empty">还没有议题，先添加一个再开会。</p>
      ) : null}

      {canEdit ? (
        <form className="inline-form" onSubmit={addTopic}>
          <input
            className="input input-sm"
            value={newTopicName}
            onChange={(event) => setNewTopicName(event.target.value)}
            placeholder="新议题名称（可留空）"
            maxLength={60}
            aria-label="新议题名称"
          />
          <button type="submit" className="btn btn-ghost btn-sm">
            ＋ 议题
          </button>
        </form>
      ) : null}
    </article>
  )
}
