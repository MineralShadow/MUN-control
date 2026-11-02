import { EditableText } from '../../components/EditableText'
import { StatusDot, type DotTone } from '../../components/StatusDot'
import { useConfirm } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { formatDateTime } from '../../lib/format'
import { majorityLabel } from '../../lib/voting'
import { useConference } from '../../state/ConferenceContext'
import type { Resolution } from '../../types'

interface ResolutionCardProps {
  resolution: Resolution
  index: number
  onVote: () => void
  onView: () => void
}

export function ResolutionCard({
  resolution,
  index,
  onVote,
  onView,
}: ResolutionCardProps) {
  const { dispatch, me } = useConference()
  const confirm = useConfirm()
  const toast = useToast()
  const canEdit = me.role === 'chair'

  const tone: DotTone =
    resolution.status === 'PASSED'
      ? 'passed'
      : resolution.status === 'FAILED'
        ? 'failed'
        : 'pending'
  const statusText =
    resolution.status === 'PASSED'
      ? '已通过'
      : resolution.status === 'FAILED'
        ? '未通过'
        : '未表决'

  async function remove() {
    const ok = await confirm({
      title: `删除决议「${resolution.title}」？`,
      message: '删除后无法恢复，历史结果也会一并消失。',
      confirmText: '删除决议',
      danger: true,
    })
    if (ok) {
      dispatch({ type: 'resolution/delete', id: resolution.id })
      toast('决议已删除', 'success')
    }
  }

  return (
    <article className={`resolution-row resolution-${tone}`}>
      <div className="resolution-no" aria-hidden="true">
        决议 {String(index + 1).padStart(2, '0')}
      </div>

      <div className="resolution-main">
        <EditableText
          className="resolution-title"
          value={resolution.title}
          onSave={(title) => dispatch({ type: 'resolution/rename', id: resolution.id, title })}
          maxLength={80}
          ariaLabel="决议标题"
          editable={canEdit}
        />
        <div className="resolution-meta">
          <span className={`status-text status-${tone}`}>{statusText}</span>
          <span className="meta-sep" aria-hidden="true">
            ·
          </span>
          {resolution.result ? (
            <>
              <span>{majorityLabel(resolution.result.majority)}</span>
              <span className="meta-sep" aria-hidden="true">
                ·
              </span>
              <span>
                赞成 {resolution.result.yesVotes} · 反对 {resolution.result.noVotes} · 弃权{' '}
                {resolution.result.abstainVotes}
              </span>
              <span className="meta-sep" aria-hidden="true">
                ·
              </span>
              <span>{formatDateTime(resolution.result.votedAt)}</span>
            </>
          ) : (
            <span>创建于 {formatDateTime(resolution.createdAt)}</span>
          )}
        </div>
      </div>

      <StatusDot tone={tone} title={statusText} />

      <div className="resolution-actions">
        {resolution.result ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onView}>
            查看结果
          </button>
        ) : canEdit ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={onVote}>
            表决
          </button>
        ) : (
          <span className="hint">待主席表决</span>
        )}
        {canEdit ? (
          <button
            type="button"
            className="btn-icon"
            onClick={remove}
            aria-label={`删除决议 ${resolution.title}`}
            title="删除决议"
          >
            ×
          </button>
        ) : null}
      </div>
    </article>
  )
}
