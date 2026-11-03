import { useEffect, useMemo, useState } from 'react'
import { EditableText } from '../components/EditableText'
import { PageHeader } from '../components/PageHeader'
import { Toggle } from '../components/Toggle'
import { useConfirm } from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { createId } from '../lib/id'
import { formatClock } from '../lib/format'
import { useConference } from '../state/ConferenceContext'
import type { ActiveMotion, MotionType } from '../types'

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return minutes > 0 ? `${minutes} 分 ${rest} 秒` : `${rest} 秒`
}

export function MotionsPage() {
  const { state, dispatch, me } = useConference()
  const confirm = useConfirm()
  const toast = useToast()
  const canEdit = me.role === 'chair'

  const [newTypeName, setNewTypeName] = useState('')
  const [typeId, setTypeId] = useState(state.motionTypes[0]?.id ?? '')
  const [proposerId, setProposerId] = useState(state.delegations[0]?.id ?? '')
  const [topic, setTopic] = useState('')
  const [totalMinutes, setTotalMinutes] = useState('10')
  const [unitSeconds, setUnitSeconds] = useState('60')
  const [speakerIds, setSpeakerIds] = useState<string[]>([])
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const motionType = useMemo(
    () => state.motionTypes.find((item) => item.id === typeId) ?? state.motionTypes[0],
    [state.motionTypes, typeId],
  )

  useEffect(() => {
    if (!motionType) return
    if (!motionType.hasTopic) setTopic('')
    if (!motionType.hasSpeakersList && !motionType.hasUnitDuration) setSpeakerIds([])
  }, [motionType])

  const motion = state.activeMotion
  const elapsed = motion ? Math.max(0, ((motion.endedAt ?? now) - motion.startedAt) / 1000) : 0
  const remaining = motion && motion.totalSeconds > 0
    ? Math.max(0, motion.totalSeconds - elapsed)
    : null

  function updateType(patch: Partial<MotionType>) {
    if (!motionType) return
    dispatch({
      type: 'motionType/update',
      motionType: { ...motionType, ...patch },
    })
  }

  function addType() {
    const name = newTypeName.trim().slice(0, 40)
    if (!name) {
      toast('请填写动议类型名称', 'danger')
      return
    }
    const next: MotionType = {
      id: createId('mtype'),
      name,
      hasTopic: true,
      hasSpeakersList: true,
      needsTotalDuration: true,
      hasUnitDuration: true,
    }
    dispatch({ type: 'motionType/add', motionType: next })
    setNewTypeName('')
    setTypeId(next.id)
    toast('动议类型已添加', 'success')
  }

  async function removeType(item: MotionType) {
    const ok = await confirm({
      title: `删除动议类型「${item.name}」？`,
      message: '已开始的动议不会改变，但之后不能再选择该类型。',
      confirmText: '删除',
      danger: true,
    })
    if (!ok) return
    dispatch({ type: 'motionType/delete', id: item.id })
    if (typeId === item.id) setTypeId(state.motionTypes.find((x) => x.id !== item.id)?.id ?? '')
    toast('动议类型已删除', 'success')
  }

  function toggleSpeaker(id: string) {
    setSpeakerIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    )
  }

  async function startMotion() {
    if (!motionType) {
      toast('请先选择动议类型', 'danger')
      return
    }
    const proposer = state.delegations.find((item) => item.id === proposerId)
    if (!proposer) {
      toast('请选择动议国', 'danger')
      return
    }
    if (motionType.hasTopic && !topic.trim()) {
      toast('请填写动议主题', 'danger')
      return
    }
    if (motion) {
      const ok = await confirm({
        title: '替换当前动议？',
        message: '当前动议会被结束，并开始新的动议。',
        confirmText: '开始新动议',
        danger: true,
      })
      if (!ok) return
    }
    const totalSeconds = motionType.needsTotalDuration
      ? Math.max(0, Math.round(Number(totalMinutes) * 60))
      : 0
    const unit = motionType.hasUnitDuration
      ? Math.max(0, Math.round(Number(unitSeconds)))
      : 0
    const speakers = motionType.hasSpeakersList || motionType.hasUnitDuration
      ? state.delegations
          .filter((item) => speakerIds.includes(item.id))
          .map((item) => ({ delegationId: item.id, name: item.name }))
      : []
    const next: ActiveMotion = {
      id: createId('motion'),
      typeId: motionType.id,
      typeName: motionType.name,
      proposerDelegationId: proposer.id,
      proposerName: proposer.name,
      topic: motionType.hasTopic ? topic.trim().slice(0, 120) : '',
      totalSeconds,
      unitSeconds: unit,
      speakers,
      startedAt: Date.now(),
      endedAt: null,
    }
    dispatch({ type: 'motion/start', motion: next })
    toast('动议已开始', 'success')
  }

  function endMotion() {
    if (!motion) return
    dispatch({ type: 'motion/end', endedAt: Date.now() })
    toast('动议已结束', 'success')
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="MOTIONS & MODERATION"
        title="会议主持"
        description={
          canEdit
            ? '编辑动议类型，选择动议国、主题、总时长和发言名单，然后开始主持。'
            : '查看当前动议与发言名单；动议由主席团发起。'
        }
      />

      {motion ? (
        <section className={`motion-live${motion.endedAt ? ' ended' : ''}`}>
          <div className="motion-live-main">
            <div className="eyebrow">{motion.endedAt ? 'MOTION ENDED' : 'MOTION IN PROGRESS'}</div>
            <h2>{motion.typeName}</h2>
            <div className="motion-meta">
              <span>动议国：{motion.proposerName}</span>
              {motion.topic ? <span>主题：{motion.topic}</span> : null}
              {motion.totalSeconds > 0 ? (
                <span>总时长：{formatDuration(motion.totalSeconds)}</span>
              ) : null}
              {motion.unitSeconds > 0 ? (
                <span>单位时长：{formatDuration(motion.unitSeconds)}</span>
              ) : null}
              <span>开始于 {formatClock(motion.startedAt)}</span>
            </div>
            {motion.speakers.length > 0 ? (
              <div className="motion-speakers">
                <strong>发言名单</strong>
                <div>
                  {motion.speakers.map((speaker) => (
                    <span className="motion-speaker" key={speaker.delegationId}>
                      {speaker.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="motion-clock">
            <div className="motion-time">
              {motion.endedAt
                ? '已结束'
                : remaining !== null
                  ? formatDuration(remaining)
                  : formatDuration(elapsed)}
            </div>
            <div className="motion-clock-note">
              {motion.endedAt
                ? '可以开始下一个动议'
                : remaining !== null
                  ? '剩余总时长'
                  : '已进行时长'}
            </div>
            {canEdit && !motion.endedAt ? (
              <button type="button" className="btn btn-danger" onClick={endMotion}>
                结束动议
              </button>
            ) : null}
          </div>
        </section>
      ) : (
        <div className="notice">当前没有进行中的动议。</div>
      )}

      {canEdit ? (
        <section className="settings-card">
          <div className="settings-card-head">
            <h2>开始动议</h2>
            <p>选择动议国；有主题的填写主题，有单位时长的选择加入发言名单的代表团。</p>
          </div>
          <div className="motion-form">
            <label className="field">
              <span>动议类型</span>
              <select
                className="select"
                value={motionType?.id ?? ''}
                onChange={(event) => setTypeId(event.target.value)}
              >
                {state.motionTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>动议国</span>
              <select
                className="select"
                value={proposerId}
                onChange={(event) => setProposerId(event.target.value)}
              >
                {state.delegations.map((delegation) => (
                  <option key={delegation.id} value={delegation.id}>
                    {delegation.name}
                  </option>
                ))}
              </select>
            </label>
            {motionType?.hasTopic ? (
              <label className="field">
                <span>主题</span>
                <input
                  className="input"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  maxLength={120}
                  placeholder="例如：巴尔干半岛局势"
                />
              </label>
            ) : null}
            {motionType?.needsTotalDuration ? (
              <label className="field">
                <span>总时长（分钟）</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="1440"
                  value={totalMinutes}
                  onChange={(event) => setTotalMinutes(event.target.value)}
                />
              </label>
            ) : null}
            {motionType?.hasUnitDuration ? (
              <label className="field">
                <span>单位时长（秒）</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="3600"
                  value={unitSeconds}
                  onChange={(event) => setUnitSeconds(event.target.value)}
                />
              </label>
            ) : null}
            <button type="button" className="btn btn-primary motion-start" onClick={() => void startMotion()}>
              开启动议
            </button>
          </div>

          {motionType?.hasSpeakersList || motionType?.hasUnitDuration ? (
            <div className="motion-speaker-picker">
              <div className="recipient-head">
                <span>发言名单</span>
                <span className="hint">已选 {speakerIds.length} 个代表团</span>
              </div>
              <div className="recipient-grid">
                {state.delegations.map((delegation) => {
                  const checked = speakerIds.includes(delegation.id)
                  return (
                    <label
                      key={delegation.id}
                      className={`recipient-chip${checked ? ' checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSpeaker(delegation.id)}
                      />
                      <span>{delegation.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="settings-card">
        <div className="settings-card-head">
          <h2>动议类型</h2>
          <p>属性决定开启动议时需要填写哪些内容；默认包含自由磋商、有主持核心磋商、自由辩论。</p>
        </div>

        <div className="motion-type-list">
          {state.motionTypes.map((item) => (
            <article className={`motion-type-card${item.id === motionType?.id ? ' active' : ''}`} key={item.id}>
              <div className="motion-type-head">
                <EditableText
                  className="motion-type-name"
                  value={item.name}
                  onSave={(name) =>
                    dispatch({
                      type: 'motionType/update',
                      motionType: { ...item, name },
                    })
                  }
                  maxLength={40}
                  ariaLabel="动议类型名称"
                  editable={canEdit}
                />
                {canEdit ? (
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => void removeType(item)}
                    aria-label={`删除动议类型 ${item.name}`}
                  >
                    ×
                  </button>
                ) : null}
              </div>
              <div className="motion-attr-grid">
                <label>
                  <span>有主题</span>
                  <Toggle
                    checked={item.hasTopic}
                    onChange={(checked) => dispatch({ type: 'motionType/update', motionType: { ...item, hasTopic: checked } })}
                    label={`${item.name}是否有主题`}
                    disabled={!canEdit}
                  />
                </label>
                <label>
                  <span>有发言名单</span>
                  <Toggle
                    checked={item.hasSpeakersList}
                    onChange={(checked) => dispatch({ type: 'motionType/update', motionType: { ...item, hasSpeakersList: checked } })}
                    label={`${item.name}是否有发言名单`}
                    disabled={!canEdit}
                  />
                </label>
                <label>
                  <span>需要总时长</span>
                  <Toggle
                    checked={item.needsTotalDuration}
                    onChange={(checked) => dispatch({ type: 'motionType/update', motionType: { ...item, needsTotalDuration: checked } })}
                    label={`${item.name}是否需要总时长`}
                    disabled={!canEdit}
                  />
                </label>
                <label>
                  <span>有单位时长</span>
                  <Toggle
                    checked={item.hasUnitDuration}
                    onChange={(checked) => dispatch({ type: 'motionType/update', motionType: { ...item, hasUnitDuration: checked } })}
                    label={`${item.name}是否有单位时长`}
                    disabled={!canEdit}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>

        {canEdit ? (
          <div className="motion-type-add">
            <input
              className="input"
              value={newTypeName}
              onChange={(event) => setNewTypeName(event.target.value)}
              placeholder="新动议类型名称"
              maxLength={40}
            />
            <button type="button" className="btn btn-ghost" onClick={addType}>
              ＋ 添加类型
            </button>
          </div>
        ) : null}
        <p className="hint">编辑属性的开关只对当前选中的类型生效；可先在上方选择动议类型。</p>
      </section>
    </div>
  )
}
