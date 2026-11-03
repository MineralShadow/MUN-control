import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { useConfirm } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import {
  MAJORITY_OPTIONS,
  majorityLabel,
  requiredYesVotes,
  tallyBallots,
  toVoteResult,
} from '../../lib/voting'
import { getPresentDelegations } from '../../state/selectors'
import { effectiveDelegationVotes } from '../../lib/votes'
import { useConference } from '../../state/ConferenceContext'
import type {
  Ballot,
  BallotRecord,
  MajorityRule,
  Resolution,
  VoteResult as VoteResultData,
} from '../../types'
import { VoteCasting } from './VoteCasting'
import { VoteResult } from './VoteResult'

type WizardStep = 'majority' | 'veto' | 'cast' | 'result'

const STEP_LABEL: Record<WizardStep, string> = {
  majority: '通过要求',
  veto: '否决国',
  cast: '点名投票',
  result: '结果',
}

interface VoteWizardProps {
  resolution: Resolution
  onClose: () => void
}

export function VoteWizard({ resolution, onClose }: VoteWizardProps) {
  const { state, dispatch } = useConference()
  const confirm = useConfirm()
  const toast = useToast()

  const present = getPresentDelegations(state)
  const presentIds = new Set(present.map((delegation) => delegation.id))
  const presentVotes = present.reduce(
    (sum, delegation) => sum + effectiveDelegationVotes(delegation, state.voteMode),
    0,
  )

  const steps: WizardStep[] = []
  if (!state.settings.skipMajorityStep) steps.push('majority')
  if (!state.settings.skipVetoStep) steps.push('veto')
  steps.push('cast')

  const [stepIndex, setStepIndex] = useState(0)
  const [majority, setMajority] = useState<MajorityRule>(state.settings.defaultMajority)
  const [vetoIds, setVetoIds] = useState<string[]>(() =>
    state.delegations.filter((delegation) => delegation.globalVeto).map((delegation) => delegation.id),
  )
  const [ballots, setBallots] = useState<Record<string, Ballot>>({})
  const [result, setResult] = useState<VoteResultData | null>(null)

  const step: WizardStep = result ? 'result' : steps[Math.min(stepIndex, steps.length - 1)]

  const votedCount = present.filter((delegation) => Boolean(ballots[delegation.id])).length
  const allVoted = present.length > 0 && votedCount === present.length

  const records: BallotRecord[] = state.delegations.map((delegation) => ({
    delegationId: delegation.id,
    name: delegation.name,
    votes: effectiveDelegationVotes(delegation, state.voteMode),
    ballot: presentIds.has(delegation.id) ? ballots[delegation.id] ?? 'ABSENT' : 'ABSENT',
    veto: vetoIds.includes(delegation.id),
  }))
  const tally = tallyBallots(records)
  const vetoNo = state.delegations.filter(
    (delegation) => vetoIds.includes(delegation.id) && ballots[delegation.id] === 'NO',
  )

  function goNext() {
    setStepIndex((index) => Math.min(index + 1, steps.length - 1))
  }

  function goBack() {
    setStepIndex((index) => Math.max(index - 1, 0))
  }

  function toggleVeto(id: string) {
    setVetoIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    )
  }

  function chooseBallot(delegationId: string, ballot: Ballot) {
    setBallots((previous) => {
      const next = { ...previous }
      if (next[delegationId] === ballot) delete next[delegationId]
      else next[delegationId] = ballot
      return next
    })
  }

  async function handleClose() {
    if (result) {
      onClose()
      return
    }
    if (Object.keys(ballots).length === 0) {
      onClose()
      return
    }
    const ok = await confirm({
      title: '退出本次表决？',
      message: '已填写的票向不会保存，决议仍保持“未表决”。',
      confirmText: '退出表决',
      danger: true,
    })
    if (ok) onClose()
  }

  function submit() {
    if (present.length === 0) {
      toast('没有出席的代表团，无法表决', 'danger')
      return
    }
    if (!allVoted) {
      toast('还有代表团未投票', 'danger')
      return
    }
    const finalResult = toVoteResult(majority, vetoIds, records)
    dispatch({ type: 'resolution/finish', id: resolution.id, result: finalResult })
    setResult(finalResult)
    toast(
      finalResult.passed ? '表决完成：通过' : '表决完成：未通过',
      finalResult.passed ? 'success' : 'info',
    )
  }

  function majorityPreview(option: MajorityRule, total: number): string {
    if (total <= 0) return '暂无出席票'
    if (option === 'UNANIMOUS') return '需没有反对票'
    if (option === 'TWO_THIRDS') return `需赞成 ≥ ${Math.ceil((total * 2) / 3)} / ${total} 票`
    return '需赞成 > 反对'
  }

  const tallyHint =
    tally.totalCast <= 0
      ? '尚无有效票'
      : majority === 'UNANIMOUS'
        ? '不能有反对票'
        : `需赞成 ≥ ${requiredYesVotes(majority, tally.totalCast)} / ${tally.totalCast} 有效票`

  const nextStepLabel =
    steps[stepIndex + 1] === 'veto' ? '下一步：确认否决国' : '下一步：点名投票'

  return (
    <Modal
      open
      onClose={handleClose}
      title={`表决 · ${resolution.title}`}
      subtitle={
        <div className="wizard-steps">
          {steps.map((item, index) => {
            const done = result !== null || index < stepIndex
            const active = result === null && index === stepIndex
            return (
              <div
                key={item}
                className={`wizard-step${done ? ' done' : ''}${active ? ' active' : ''}`}
              >
                <span className="wizard-step-no" aria-hidden="true">
                  {done ? '✓' : index + 1}
                </span>
                <span>{STEP_LABEL[item]}</span>
              </div>
            )
          })}
        </div>
      }
      size="xl"
      className="vote-wizard"
    >
      {step === 'majority' ? (
        <div className="wizard-panel">
          <div className="wizard-heading">
            <h3>选择本次表决的通过要求</h3>
            <p>
              当前 {present.length} 个代表团出席，共 {presentVotes} 票。弃权票不计入有效票。
            </p>
          </div>

          <div className="choice-grid">
            {MAJORITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`choice-card${majority === option.value ? ' active' : ''}`}
                aria-pressed={majority === option.value}
                onClick={() => setMajority(option.value)}
              >
                <span className="choice-radio" aria-hidden="true">
                  {majority === option.value ? '●' : '○'}
                </span>
                <span className="choice-title">{option.label}</span>
                <span className="choice-desc">{option.hint}</span>
                <span className="choice-meta">
                  {majorityPreview(option.value, presentVotes)}
                </span>
              </button>
            ))}
          </div>

          <div className="wizard-actions">
            <button type="button" className="btn btn-ghost" onClick={handleClose}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={goNext}>
              {nextStepLabel}
            </button>
          </div>
        </div>
      ) : null}

      {step === 'veto' ? (
        <div className="wizard-panel">
          <div className="wizard-heading">
            <h3>确认本议题的一票否决国</h3>
            <p>
              默认勾选拥有全局否决权的代表团；可临时增减，仅对本次表决生效。
              否决国只有出席并投反对票时才触发否决。
            </p>
          </div>

          {state.delegations.length === 0 ? (
            <p className="hint">还没有代表团，无法确认否决国。</p>
          ) : (
            <div className="veto-list">
              {state.delegations.map((delegation) => {
                const checked = vetoIds.includes(delegation.id)
                return (
                  <label
                    key={delegation.id}
                    className={`veto-row${checked ? ' checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleVeto(delegation.id)}
                    />
                    <span className="veto-name">{delegation.name}</span>
                    {delegation.globalVeto ? (
                      <span className="badge badge-gold">全局</span>
                    ) : null}
                    {!presentIds.has(delegation.id) ? (
                      <span className="badge badge-muted">缺席</span>
                    ) : null}
                    <span className="veto-votes">{effectiveDelegationVotes(delegation, state.voteMode)} 票</span>
                  </label>
                )
              })}
            </div>
          )}

          <div className="veto-summary">
            已选 <strong>{vetoIds.length}</strong> 个否决国
          </div>

          <div className="wizard-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={goBack}
              disabled={stepIndex === 0}
            >
              上一步
            </button>
            <button type="button" className="btn btn-primary" onClick={goNext}>
              开始点名投票
            </button>
          </div>
        </div>
      ) : null}

      {step === 'cast' ? (
        <div className="casting-layout">
          <div className="casting-list">
            <div className="casting-head">
              <div>
                <h3>点名投票</h3>
                <p>仅出席代表团可投票；再次点击同一按钮可取消。</p>
              </div>
              <span className="casting-progress">
                {votedCount} / {present.length}
              </span>
            </div>

            {present.length === 0 ? (
              <p className="hint">没有出席的代表团，请先到席位页调整出席状态。</p>
            ) : (
              <VoteCasting
                delegations={present}
                ballots={ballots}
                onBallot={chooseBallot}
                vetoIds={vetoIds}
                voteMode={state.voteMode}
              />
            )}
          </div>

          <aside className="casting-summary">
            <div className="eyebrow">LIVE TALLY</div>
            <div className="tally">
              <div className="tally-row">
                <span>赞成</span>
                <strong className="yes">{tally.yesVotes}</strong>
              </div>
              <div className="tally-row">
                <span>反对</span>
                <strong className="no">{tally.noVotes}</strong>
              </div>
              <div className="tally-row">
                <span>弃权</span>
                <strong className="abstain">{tally.abstainVotes}</strong>
              </div>
            </div>

            <div className="tally-rule">
              <strong>{majorityLabel(majority)}</strong>
              <span>{tallyHint}</span>
            </div>
            <p className="tally-note">有效票 {tally.totalCast} · 弃权与缺席不计入</p>

            {vetoNo.length > 0 ? (
              <div className="veto-warning">
                否决国 {vetoNo.map((delegation) => delegation.name).join('、')}{' '}
                已投反对，本次表决将不通过。
              </div>
            ) : null}

            <div className="casting-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={goBack}
                disabled={stepIndex === 0}
              >
                上一步
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setBallots({})}
                disabled={votedCount === 0}
              >
                清空
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={submit}
                disabled={!allVoted}
              >
                提交表决
              </button>
            </div>

            {!allVoted && present.length > 0 ? (
              <p className="hint">还有 {present.length - votedCount} 个代表团未投票。</p>
            ) : null}
          </aside>
        </div>
      ) : null}

      {step === 'result' && result ? (
        <div className="wizard-panel wizard-result">
          <VoteResult result={result} />
          <div className="wizard-actions">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              完成
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
