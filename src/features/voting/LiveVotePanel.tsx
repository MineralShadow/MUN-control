import { useMemo, useState } from 'react'
import { ParliamentChart } from '../../components/ParliamentChart'
import { useConfirm } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { apiFetch } from '../../lib/api'
import { isDelegationPresent } from '../../lib/attendance'
import { effectiveDelegationVotes } from '../../lib/votes'
import { BALLOT_LABEL, toVoteResult } from '../../lib/voting'
import { useConference } from '../../state/ConferenceContext'
import type { Ballot, BallotRecord, LiveVote, Resolution } from '../../types'

function buildRows(state: ReturnType<typeof useConference>['state'], live: LiveVote) {
  return state.delegations.flatMap((delegation) => {
    const present = isDelegationPresent(delegation, state.attendanceRule)
    const veto = live.vetoIds.includes(delegation.id)
    if (state.voteMode === 'DELEGATION') {
      return [{
        key: delegation.id,
        delegationId: delegation.id,
        name: delegation.name,
        votes: effectiveDelegationVotes(delegation, state.voteMode),
        ballot: present ? live.ballots[delegation.id] ?? 'ABSENT' : 'ABSENT',
        veto,
        present,
      }]
    }
    return delegation.seats.map((seat) => ({
      key: seat.id,
      delegationId: delegation.id,
      name: `${delegation.name} · ${seat.name}`,
      votes: Math.max(0, Math.round(seat.votes)),
      ballot: present && seat.present ? live.ballots[seat.id] ?? 'ABSENT' : 'ABSENT',
      veto,
      present: present && seat.present,
    }))
  })
}

interface LiveVotePanelProps {
  liveVote: LiveVote
  resolution: Resolution
}

export function LiveVotePanel({ liveVote, resolution }: LiveVotePanelProps) {
  const { state, me, myMembership, refresh, dispatch } = useConference()
  const confirm = useConfirm()
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const rows = useMemo(() => buildRows(state, liveVote), [state, liveVote])
  const presentRows = rows.filter((row) => row.present)
  const votedCount = presentRows.filter((row) => liveVote.ballots[row.key]).length
  const allVoted = presentRows.length > 0 && votedCount === presentRows.length
  const records: BallotRecord[] = rows.map((row) => ({
    delegationId: row.delegationId,
    name: row.name,
    votes: row.votes,
    ballot: row.ballot,
    veto: row.veto,
  }))
  const result = toVoteResult(liveVote.majority, liveVote.vetoIds, records)

  function canVote(row: { key: string; delegationId: string; present: boolean }) {
    if (!row.present) return false
    if (me.role === 'chair') return true
    if (!state.settings.allowDelegateVoting || !myMembership) return false
    if (state.voteMode === 'DELEGATION') {
      return myMembership.isHead && myMembership.delegationId === row.delegationId
    }
    return myMembership.seatId === row.key
  }

  async function cast(key: string, ballot: Ballot) {
    setBusy(key)
    try {
      await apiFetch('/vote/cast', { method: 'POST', json: { key, ballot } })
      await refresh()
    } catch (error) {
      toast(error instanceof Error ? error.message : '投票失败', 'danger')
    } finally {
      setBusy(null)
    }
  }

  async function finish() {
    const ok = await confirm({
      title: '提交本次表决？',
      message: '提交后所有票向会写入决议结果，不能再修改。',
      confirmText: '提交表决',
      danger: true,
    })
    if (!ok) return
    setBusy('finish')
    try {
      await apiFetch('/vote/finish', { method: 'POST' })
      await refresh()
      toast('表决结果已提交', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '提交失败', 'danger')
    } finally {
      setBusy(null)
    }
  }

  async function cancel() {
    const ok = await confirm({
      title: '取消本次表决？',
      message: '已填写的票向会被清空，决议保持未表决。',
      confirmText: '取消表决',
      danger: true,
    })
    if (!ok) return
    dispatch({ type: 'vote/cancel' })
    toast('表决已取消', 'success')
  }

  return (
    <section className="live-vote-panel">
      <div className="live-vote-head">
        <div>
          <div className="eyebrow">LIVE VOTING · 自主投票</div>
          <h2>{resolution.title}</h2>
          <p>
            {state.voteMode === 'MEMBER'
              ? '代表计票：每位代表投自己席位的一票。'
              : '代表团计票：由阁首代表本团投票。'}{' '}
            主席可代替任何席位投票。
          </p>
        </div>
        <div className="live-vote-progress">
          <strong>{votedCount} / {presentRows.length}</strong>
          <span>已投票</span>
        </div>
      </div>

      <div className="live-vote-chart">
        <ParliamentChart result={result} />
      </div>

      <div className="live-vote-rows">
        {rows.map((row) => {
          const editable = canVote(row)
          const current = liveVote.ballots[row.key]
          return (
            <div className={`live-vote-row${row.present ? '' : ' absent'}${editable ? ' editable' : ''}`} key={row.key}>
              <div className="live-vote-name">
                <span>{row.name}</span>
                <span className="live-vote-votes">{row.votes} 票</span>
                {row.veto ? <span className="badge badge-veto">否决国</span> : null}
                {!row.present ? <span className="badge badge-muted">缺席</span> : null}
              </div>
              <div className="live-vote-buttons">
                {(['YES', 'NO', 'ABSTAIN'] as Ballot[]).map((ballot) => (
                  <button
                    key={ballot}
                    type="button"
                    className={`ballot-btn ballot-${ballot.toLowerCase()}${current === ballot ? ' active' : ''}`}
                    disabled={!editable || busy === row.key}
                    onClick={() => void cast(row.key, ballot)}
                  >
                    {BALLOT_LABEL[ballot]}
                  </button>
                ))}
                {!editable && row.present ? (
                  <span className="live-vote-lock">
                    {state.voteMode === 'DELEGATION' ? '由阁首投票' : '由本人投票'}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <div className="live-vote-footer">
        <div>
          <strong>{allVoted ? '所有出席席位已投票' : `还有 ${presentRows.length - votedCount} 个席位未投票`}</strong>
          <span>赞成 {result.yesVotes} · 反对 {result.noVotes} · 弃权 {result.abstainVotes}</span>
        </div>
        {me.role === 'chair' ? (
          <div className="live-vote-actions">
            <button type="button" className="btn btn-ghost" onClick={() => void cancel()}>
              取消表决
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!allVoted || busy === 'finish'}
              onClick={() => void finish()}
            >
              提交表决
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
