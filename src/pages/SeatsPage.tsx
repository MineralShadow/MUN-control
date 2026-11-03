import { useState, type FormEvent } from 'react'
import { AttendanceSummary } from '../features/seats/AttendanceSummary'
import { DelegationCard } from '../features/seats/DelegationCard'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { createId } from '../lib/id'
import {
  ATTENDANCE_RULES,
  attendanceRuleHint,
  attendanceRuleLabel,
} from '../lib/attendance'
import { useConference } from '../state/ConferenceContext'
import { getVoteStats } from '../state/selectors'
import type { AttendanceRule, Delegation, VoteMode } from '../types'
import { voteModeLabel } from '../lib/votes'

export function SeatsPage() {
  const { state, dispatch, me } = useConference()
  const toast = useToast()
  const canEdit = me.role === 'chair'
  const [newName, setNewName] = useState('')

  const stats = getVoteStats(state)

  function changeRule(rule: AttendanceRule) {
    dispatch({ type: 'attendanceRule/set', rule })
    toast(`出席规则已切换为「${attendanceRuleLabel(rule)}」`, 'success')
  }

  function changeVoteMode(mode: VoteMode) {
    dispatch({ type: 'voteMode/set', mode })
    toast(`计票方式已切换为「${voteModeLabel(mode)}」`, 'success')
  }

  function addDelegation(event: FormEvent) {
    event.preventDefault()
    const name = newName.trim()
    if (!name) {
      toast('请先输入代表团名称', 'danger')
      return
    }
    const delegation: Delegation = {
      id: createId('dlg'),
      name: name.slice(0, 40),
      votes: 1,
      globalVeto: false,
      seats: [{ id: createId('seat'), name: '代表 1', votes: 1, present: false }],
    }
    dispatch({ type: 'delegation/add', delegation })
    setNewName('')
    toast(`已添加「${delegation.name}」`, 'success')
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="SEATS & ATTENDANCE"
        title="席位"
        description={
          canEdit
            ? '代表团、代表席位与票权。席位圆点控制出席，代表团状态由右上角的出席规则自动计算。'
            : '查看代表团、席位与票权。出席规则、席位与票权由主席团维护。'
        }
        actions={
          canEdit ? (
            <label className="rule-select">
              <span>出席规则</span>
              <select
                className="select"
                value={state.attendanceRule}
                onChange={(event) => changeRule(event.target.value as AttendanceRule)}
                aria-label="代表团出席规则"
              >
                {ATTENDANCE_RULES.map((rule) => (
                  <option key={rule.value} value={rule.value}>
                    {rule.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="readonly-pill">
              出席规则：{attendanceRuleLabel(state.attendanceRule)}
            </div>
          )
        }
      />

      <div className="rule-hint-bar">
        <strong>{attendanceRuleLabel(state.attendanceRule)}</strong>
        <span>{attendanceRuleHint(state.attendanceRule)}</span>
      </div>

      <div className="rule-hint-bar vote-mode-bar">
        <strong>计票方式</strong>
        {canEdit ? (
          <select
            className="select"
            value={state.voteMode}
            onChange={(event) => changeVoteMode(event.target.value as VoteMode)}
            aria-label="计票方式"
          >
            <option value="DELEGATION">代表团总体计票</option>
            <option value="MEMBER">代表计票</option>
          </select>
        ) : (
          <span>{voteModeLabel(state.voteMode)}</span>
        )}
        <span>
          {state.voteMode === 'DELEGATION'
            ? '每个代表团使用一个总票权。'
            : '按出席代表逐席累加票权，可在席位行内手动调整。'}
        </span>
      </div>

      <AttendanceSummary stats={stats} rule={state.attendanceRule} />

      {canEdit ? (
        <form className="add-bar" onSubmit={addDelegation}>
          <input
            id="new-delegation"
            className="input"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="代表团名称，如：法兰西共和国"
            maxLength={40}
            aria-label="新代表团名称"
          />
          <button type="submit" className="btn btn-primary">
            ＋ 添加代表团
          </button>
        </form>
      ) : null}

      {state.delegations.length === 0 ? (
        <EmptyState
          title="还没有代表团"
          description={
            canEdit
              ? '先添加第一个代表团。创建后会自动带一个席位，票权默认 1 票。'
              : '主席团还没有添加代表团。'
          }
          action={
            canEdit ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => document.getElementById('new-delegation')?.focus()}
              >
                添加第一个代表团
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="list-note">
            <span className="dot dot-present dot-sm" aria-hidden="true" />
            {canEdit
              ? '代表团圆点由出席规则计算，不可点击；席位圆点可点击切换。'
              : '代表只读：代表团与席位状态由主席团维护。'}
          </div>
          <div className="delegation-grid">
            {state.delegations.map((delegation) => (
              <DelegationCard
                key={delegation.id}
                delegation={delegation}
                rule={state.attendanceRule}
                voteMode={state.voteMode}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
