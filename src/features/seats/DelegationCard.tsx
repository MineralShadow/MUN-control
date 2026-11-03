import { useState, type FormEvent } from 'react'
import { EditableText } from '../../components/EditableText'
import { NumberStepper } from '../../components/NumberStepper'
import { StatusDot } from '../../components/StatusDot'
import { Toggle } from '../../components/Toggle'
import { useConfirm } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { createId } from '../../lib/id'
import {
  attendanceRuleLabel,
  countPresentSeats,
  isDelegationPresent,
  requiredPresentSeats,
} from '../../lib/attendance'
import { useConference } from '../../state/ConferenceContext'
import type { AttendanceRule, Delegation, VoteMode } from '../../types'
import { effectiveDelegationVotes, delegationTotalVotes } from '../../lib/votes'
import { SeatRow } from './SeatRow'

interface DelegationCardProps {
  delegation: Delegation
  rule: AttendanceRule
  voteMode: VoteMode
}

export function DelegationCard({ delegation, rule, voteMode }: DelegationCardProps) {
  const { dispatch, me } = useConference()
  const confirm = useConfirm()
  const toast = useToast()
  const canEdit = me.role === 'chair'
  const [newSeatName, setNewSeatName] = useState('')

  const presentCount = countPresentSeats(delegation)
  const required = requiredPresentSeats(delegation.seats.length, rule)
  const present = isDelegationPresent(delegation, rule)
  const totalVotes = delegationTotalVotes(delegation, voteMode)
  const effectiveVotes = effectiveDelegationVotes(delegation, voteMode)

  function addSeat(event: FormEvent) {
    event.preventDefault()
    const name =
      newSeatName.trim().slice(0, 30) ||
      `代表 ${delegation.seats.length + 1}`
    dispatch({
      type: 'seat/add',
      delegationId: delegation.id,
      seat: { id: createId('seat'), name, votes: 1, present: false },
    })
    setNewSeatName('')
    toast(`已为「${delegation.name}」添加席位`, 'success')
  }

  async function removeDelegation() {
    const ok = await confirm({
      title: `删除代表团「${delegation.name}」？`,
      message: `将同时删除其 ${delegation.seats.length} 个席位。历史表决记录保存的是快照，不受影响。`,
      confirmText: '删除代表团',
      danger: true,
    })
    if (ok) {
      dispatch({ type: 'delegation/delete', id: delegation.id })
      toast('代表团已删除', 'success')
    }
  }

  return (
    <article className={`delegation-card${present ? ' is-present' : ''}`}>
      <div className="delegation-head">
        <div className="delegation-title">
          <EditableText
            className="delegation-name"
            value={delegation.name}
            onSave={(name) =>
              dispatch({ type: 'delegation/rename', id: delegation.id, name })
            }
            maxLength={40}
            ariaLabel="代表团名称"
            editable={canEdit}
          />
          {delegation.globalVeto ? (
            <span className="badge badge-veto">全局否决</span>
          ) : null}
        </div>
        <StatusDot
          tone={present ? 'present' : 'absent'}
          title={`${delegation.name}：${present ? '出席' : '缺席'}（${presentCount}/${delegation.seats.length} 席，规则：${attendanceRuleLabel(rule)}）`}
        />
        {canEdit ? (
          <button
            type="button"
            className="btn-icon"
            onClick={removeDelegation}
            aria-label={`删除代表团 ${delegation.name}`}
            title="删除代表团"
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="delegation-meta">
        <span className={`attendance-state ${present ? 'is-present' : 'is-absent'}`}>
          {present ? '出席' : '缺席'}
        </span>
        <span className="meta-sep" aria-hidden="true">
          ·
        </span>
        <span>
          出席 {presentCount} / {delegation.seats.length} 席
        </span>
        <span className="meta-sep" aria-hidden="true">
          ·
        </span>
        <span>需 {required} 席</span>
        <span className="meta-sep" aria-hidden="true">
          ·
        </span>
        <span className="meta-votes">{effectiveVotes} 票{voteMode === 'MEMBER' ? `（合计 ${totalVotes}）` : ''}</span>
      </div>

      <div className={`delegation-controls${canEdit ? '' : ' is-readonly'}`}>
        {canEdit ? (
          <>
            {voteMode === 'DELEGATION' ? (
              <label className="control-field">
                <span className="control-label">票权</span>
                <NumberStepper
                  value={delegation.votes}
                  min={0}
                  max={999}
                  onChange={(votes) =>
                    dispatch({ type: 'delegation/setVotes', id: delegation.id, votes })
                  }
                  ariaLabel={`${delegation.name}的票权`}
                  suffix="票"
                />
              </label>
            ) : (
              <span className="control-label">席位票权合计 {totalVotes} 票</span>
            )}
            <label className="control-field">
              <span className="control-label">全局一票否决</span>
              <Toggle
                checked={delegation.globalVeto}
                onChange={() =>
                  dispatch({ type: 'delegation/toggleVeto', id: delegation.id })
                }
                label={`${delegation.name}的全局一票否决权`}
              />
            </label>
          </>
        ) : (
          <>
            <span className="control-label">票权 {effectiveVotes} 票</span>
            <span className="control-label">
              全局一票否决：{delegation.globalVeto ? '有' : '无'}
            </span>
          </>
        )}
      </div>

      <ul className="seat-list">
        {delegation.seats.map((seat, index) => (
          <SeatRow
            key={seat.id}
            delegationId={delegation.id}
            delegationName={delegation.name}
            seat={seat}
            index={index}
            canDelete={delegation.seats.length > 1}
            voteMode={voteMode}
          />
        ))}
      </ul>

      {canEdit ? (
        <form className="inline-form" onSubmit={addSeat}>
          <input
            className="input input-sm"
            value={newSeatName}
            onChange={(event) => setNewSeatName(event.target.value)}
            placeholder="新席位名称（可留空）"
            maxLength={30}
            aria-label="新席位名称"
          />
          <button type="submit" className="btn btn-ghost btn-sm">
            ＋ 席位
          </button>
        </form>
      ) : null}
    </article>
  )
}
