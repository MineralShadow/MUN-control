import { useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { ResolutionCard } from '../features/voting/ResolutionCard'
import { VoteResult } from '../features/voting/VoteResult'
import { VoteWizard } from '../features/voting/VoteWizard'
import { createId } from '../lib/id'
import { Link } from '../router'
import { useConference } from '../state/ConferenceContext'
import { getCurrentSession, getCurrentTopic, getTopicResolutions } from '../state/selectors'
import type { Resolution } from '../types'

export function VotingPage() {
  const { state, dispatch, me } = useConference()
  const toast = useToast()
  const canEdit = me.role === 'chair'
  const [newTitle, setNewTitle] = useState('')
  const [activeResolution, setActiveResolution] = useState<Resolution | null>(null)
  const [viewingResolution, setViewingResolution] = useState<Resolution | null>(null)

  const session = getCurrentSession(state)
  const topic = getCurrentTopic(state)
  const resolutions =
    session && topic ? getTopicResolutions(state, session.id, topic.id) : []

  const pendingCount = resolutions.filter((item) => item.status === 'PENDING').length
  const passedCount = resolutions.filter((item) => item.status === 'PASSED').length
  const failedCount = resolutions.filter((item) => item.status === 'FAILED').length

  function addResolution(event: FormEvent) {
    event.preventDefault()
    if (!session || !topic) return
    const resolution: Resolution = {
      id: createId('res'),
      title: newTitle.trim().slice(0, 80) || `决议草案 ${resolutions.length + 1}`,
      sessionId: session.id,
      topicId: topic.id,
      status: 'PENDING',
      result: null,
      createdAt: Date.now(),
    }
    dispatch({ type: 'resolution/add', resolution })
    setNewTitle('')
    toast('决议已添加', 'success')
  }

  if (!session || !topic) {
    return (
      <div className="stack">
        <PageHeader
          eyebrow="VOTING & RESOLUTIONS"
          title="投票"
          description="表决需要一个当前议题作为归档位置。"
        />
        <EmptyState
          title="还没有当前议题"
          description={
            canEdit
              ? '投票页按“会期 + 议题”归档决议。请先到会期页创建一个议题，并把它设为当前。'
              : '主席团还没有设置当前议题。可以先到会期页查看会议进度。'
          }
          action={
            <Link to="/sessions" className={canEdit ? 'btn btn-primary' : 'btn btn-ghost'}>
              {canEdit ? '去设置会期与议题' : '查看会期'}
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="VOTING & RESOLUTIONS"
        title="投票"
        description={
          canEdit
            ? '添加决议、发起表决、确认否决国并生成半圆席位图。点击已表决的“查看结果”可以回看快照。'
            : '查看主席团发布的决议与表决结果。表决由主席团发起，代表只能查看。'
        }
        actions={
          <Link to="/sessions" className="btn btn-ghost">
            切换议题
          </Link>
        }
      />

      <div className="agenda-bar active">
        <div className="agenda-copy">
          <div className="eyebrow">CURRENT TOPIC</div>
          <div className="agenda-value">
            <span>{session.name}</span>
            <span className="dot-sep" aria-hidden="true">
              ·
            </span>
            <strong>{topic.name}</strong>
          </div>
        </div>
        <div className="agenda-counts">
          <span>待表决 {pendingCount}</span>
          <span className="meta-sep" aria-hidden="true">
            ·
          </span>
          <span>通过 {passedCount}</span>
          <span className="meta-sep" aria-hidden="true">
            ·
          </span>
          <span>未通过 {failedCount}</span>
        </div>
      </div>

      {canEdit ? (
        <form className="add-bar" onSubmit={addResolution}>
          <input
            id="new-resolution"
            className="input"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="决议标题，如：关于巴尔干问题的决议草案（可留空）"
            maxLength={80}
            aria-label="新决议标题"
          />
          <button type="submit" className="btn btn-primary">
            ＋ 添加决议
          </button>
        </form>
      ) : null}

      {resolutions.length === 0 ? (
        <EmptyState
          title="当前议题还没有决议"
          description="添加第一项决议，然后就可以发起表决。表决结果会以半圆席位图展示。"
          action={
            canEdit ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => document.getElementById('new-resolution')?.focus()}
              >
                添加第一项决议
              </button>
            ) : null
          }
        />
      ) : (
        <div className="resolution-list">
          {resolutions.map((resolution, index) => (
            <ResolutionCard
              key={resolution.id}
              resolution={resolution}
              index={index}
              onVote={() => setActiveResolution(resolution)}
              onView={() => setViewingResolution(resolution)}
            />
          ))}
        </div>
      )}

      {activeResolution ? (
        <VoteWizard
          resolution={activeResolution}
          onClose={() => setActiveResolution(null)}
        />
      ) : null}

      <Modal
        open={viewingResolution !== null}
        onClose={() => setViewingResolution(null)}
        title={viewingResolution?.title ?? '表决结果'}
        subtitle="历史表决快照 · 不受后续席位调整影响"
        size="lg"
      >
        {viewingResolution?.result ? (
          <VoteResult result={viewingResolution.result} />
        ) : (
          <p className="hint">这项决议还没有表决结果。</p>
        )}
      </Modal>
    </div>
  )
}
