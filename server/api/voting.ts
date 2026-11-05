import type {
  Ballot,
  BallotRecord,
  ConferenceState,
  LiveVote,
  VoteResult,
} from '../../src/types.ts'
import { isDelegationPresent } from '../../src/lib/attendance.ts'
import { effectiveDelegationVotes } from '../../src/lib/votes.ts'
import { toVoteResult } from '../../src/lib/voting.ts'

export interface LiveVoteRow {
  key: string
  delegationId: string
  seatId: string | null
  name: string
  votes: number
  ballot: Ballot
  veto: boolean
  present: boolean
}

export function buildLiveVoteRows(state: ConferenceState, live: LiveVote): LiveVoteRow[] {
  const rows: LiveVoteRow[] = []
  for (const delegation of state.delegations) {
    const present = isDelegationPresent(delegation, state.attendanceRule)
    const veto = live.vetoIds.includes(delegation.id)
    if (state.voteMode === 'DELEGATION') {
      rows.push({
        key: delegation.id,
        delegationId: delegation.id,
        seatId: null,
        name: delegation.name,
        votes: effectiveDelegationVotes(delegation, state.voteMode),
        ballot: present ? live.ballots[delegation.id] ?? 'ABSENT' : 'ABSENT',
        veto,
        present,
      })
      continue
    }
    for (const seat of delegation.seats) {
      const seatPresent = present && seat.present
      rows.push({
        key: seat.id,
        delegationId: delegation.id,
        seatId: seat.id,
        name: `${delegation.name} · ${seat.name}`,
        votes: Math.max(0, Math.round(seat.votes)),
        ballot: seatPresent ? live.ballots[seat.id] ?? 'ABSENT' : 'ABSENT',
        veto,
        present: seatPresent,
      })
    }
  }
  return rows
}

export function liveVoteRecords(rows: LiveVoteRow[]): BallotRecord[] {
  return rows.map((row) => ({
    delegationId: row.delegationId,
    name: row.name,
    votes: row.votes,
    ballot: row.ballot,
    veto: row.veto,
  }))
}

export function liveVoteResult(state: ConferenceState, live: LiveVote): VoteResult {
  const rows = buildLiveVoteRows(state, live)
  return toVoteResult(live.majority, live.vetoIds, liveVoteRecords(rows))
}
