import type { Delegation, VoteMode } from '../types'

/** 一个代表团在当前计票方式下的总票权（不考虑出席） */
export function delegationTotalVotes(delegation: Delegation, mode: VoteMode): number {
  if (mode === 'DELEGATION') return Math.max(0, Math.round(delegation.votes))
  return delegation.seats.reduce((sum, seat) => sum + Math.max(0, Math.round(seat.votes)), 0)
}

/**
 * 一个代表团实际参与表决的票数：
 * - 代表团总体计票：使用代表团票权；
 * - 代表计票：只累加“出席席位”的手动票权。
 */
export function effectiveDelegationVotes(
  delegation: Delegation,
  mode: VoteMode,
): number {
  if (mode === 'DELEGATION') return Math.max(0, Math.round(delegation.votes))
  return delegation.seats.reduce(
    (sum, seat) => sum + (seat.present ? Math.max(0, Math.round(seat.votes)) : 0),
    0,
  )
}

export function voteModeLabel(mode: VoteMode): string {
  return mode === 'MEMBER' ? '代表计票' : '代表团总体计票'
}
