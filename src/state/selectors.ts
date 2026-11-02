import {
  countPresentSeats,
  isDelegationPresent,
  requiredPresentSeats,
} from '../lib/attendance'
import type {
  ConferenceState,
  Delegation,
  Resolution,
  Session,
  Topic,
} from '../types'

export interface VoteStats {
  totalDelegations: number
  presentDelegations: number
  totalSeats: number
  presentSeats: number
  totalVotes: number
  presentVotes: number
  simpleMajority: number | null
  twoThirdsMajority: number | null
}

export function getCurrentSession(state: ConferenceState): Session | null {
  if (!state.currentSessionId) return null
  return state.sessions.find((session) => session.id === state.currentSessionId) ?? null
}

export function getCurrentTopic(state: ConferenceState): Topic | null {
  const session = getCurrentSession(state)
  if (!session || !state.currentTopicId) return null
  return session.topics.find((topic) => topic.id === state.currentTopicId) ?? null
}

export function getPresentDelegations(state: ConferenceState): Delegation[] {
  return state.delegations.filter((delegation) =>
    isDelegationPresent(delegation, state.attendanceRule),
  )
}

export function getVoteStats(state: ConferenceState): VoteStats {
  let totalSeats = 0
  let presentSeats = 0
  let totalVotes = 0
  let presentVotes = 0
  let presentDelegations = 0

  for (const delegation of state.delegations) {
    totalSeats += delegation.seats.length
    presentSeats += countPresentSeats(delegation)
    totalVotes += delegation.votes
    if (isDelegationPresent(delegation, state.attendanceRule)) {
      presentDelegations += 1
      presentVotes += delegation.votes
    }
  }

  return {
    totalDelegations: state.delegations.length,
    presentDelegations,
    totalSeats,
    presentSeats,
    totalVotes,
    presentVotes,
    simpleMajority: presentVotes > 0 ? Math.floor(presentVotes / 2) + 1 : null,
    twoThirdsMajority: presentVotes > 0 ? Math.ceil((presentVotes * 2) / 3) : null,
  }
}

export function getDelegationQuorum(delegation: Delegation, rule: ConferenceState['attendanceRule']) {
  return {
    present: countPresentSeats(delegation),
    required: requiredPresentSeats(delegation.seats.length, rule),
    total: delegation.seats.length,
  }
}

export function getTopicResolutions(
  state: ConferenceState,
  sessionId: string,
  topicId: string,
): Resolution[] {
  return state.resolutions
    .filter(
      (resolution) =>
        resolution.sessionId === sessionId && resolution.topicId === topicId,
    )
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function countResolutionsForSession(state: ConferenceState, sessionId: string): number {
  return state.resolutions.filter((resolution) => resolution.sessionId === sessionId).length
}

export function countResolutionsForTopic(state: ConferenceState, topicId: string): number {
  return state.resolutions.filter((resolution) => resolution.topicId === topicId).length
}
