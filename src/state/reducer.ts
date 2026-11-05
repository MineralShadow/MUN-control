import type {
  ActiveMotion,
  Author,
  Ballot,
  ConferenceState,
  Delegation,
  FileType,
  LiveVote,
  MotionType,
  Resolution,
  Seat,
  Session,
  Settings,
  Topic,
  VoteMode,
  VoteResult,
} from '../types'
import { clampInt } from '../lib/format.ts'
import { createInitialState } from './defaults.ts'

export type Action =
  | { type: 'theme/set'; theme: string }
  | { type: 'author/set'; patch: Partial<Author> }
  | { type: 'attendanceRule/set'; rule: ConferenceState['attendanceRule'] }
  | { type: 'voteMode/set'; mode: VoteMode }
  | { type: 'delegation/add'; delegation: Delegation }
  | { type: 'delegation/rename'; id: string; name: string }
  | { type: 'delegation/delete'; id: string }
  | { type: 'delegation/setVotes'; id: string; votes: number }
  | { type: 'delegation/setHead'; id: string; seatId: string }
  | { type: 'delegation/toggleVeto'; id: string }
  | { type: 'seat/add'; delegationId: string; seat: Seat }
  | { type: 'seat/rename'; delegationId: string; seatId: string; name: string }
  | { type: 'seat/delete'; delegationId: string; seatId: string }
  | { type: 'seat/togglePresent'; delegationId: string; seatId: string }
  | { type: 'seat/setVotes'; delegationId: string; seatId: string; votes: number }
  | { type: 'session/add'; session: Session }
  | { type: 'session/rename'; id: string; name: string }
  | { type: 'session/delete'; id: string }
  | { type: 'topic/add'; sessionId: string; topic: Topic }
  | { type: 'topic/rename'; sessionId: string; topicId: string; name: string }
  | { type: 'topic/delete'; sessionId: string; topicId: string }
  | { type: 'current/set'; sessionId: string; topicId: string }
  | { type: 'current/clear' }
  | { type: 'resolution/add'; resolution: Resolution }
  | { type: 'resolution/rename'; id: string; title: string }
  | { type: 'resolution/delete'; id: string }
  | { type: 'resolution/finish'; id: string; result: VoteResult }
  | { type: 'vote/open'; liveVote: LiveVote }
  | { type: 'vote/cast'; key: string; ballot: Ballot }
  | { type: 'vote/cancel' }
  | { type: 'vote/finish'; result: VoteResult }
  | { type: 'motionType/add'; motionType: MotionType }
  | { type: 'motionType/update'; motionType: MotionType }
  | { type: 'motionType/delete'; id: string }
  | { type: 'motion/start'; motion: ActiveMotion }
  | { type: 'motion/startUnit'; index: number; now: number }
  | { type: 'motion/pause'; now: number }
  | { type: 'motion/resume'; now: number }
  | { type: 'motion/end'; endedAt: number }
  | { type: 'fileType/add'; fileType: FileType }
  | { type: 'fileType/update'; fileType: FileType }
  | { type: 'fileType/delete'; id: string }
  | { type: 'settings/patch'; patch: Partial<Settings> }
  | { type: 'state/replace'; state: ConferenceState }
  | { type: 'state/reset' }

function clean(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength)
}

function mapDelegation(
  state: ConferenceState,
  id: string,
  updater: (delegation: Delegation) => Delegation,
): ConferenceState {
  return {
    ...state,
    delegations: state.delegations.map((delegation) =>
      delegation.id === id ? updater(delegation) : delegation,
    ),
  }
}

function baseReducer(state: ConferenceState, action: Action): ConferenceState {
  switch (action.type) {
    case 'theme/set': {
      const theme = clean(action.theme, 80)
      if (!theme || theme === state.theme) return state
      return { ...state, theme }
    }

    case 'author/set': {
      const patch = action.patch
      const author: Author = {
        name:
          patch.name === undefined
            ? state.author.name
            : clean(patch.name, 40) || state.author.name,
        xiaohongshuId:
          patch.xiaohongshuId === undefined
            ? state.author.xiaohongshuId
            : clean(patch.xiaohongshuId, 40),
        xiaohongshuUrl:
          patch.xiaohongshuUrl === undefined
            ? state.author.xiaohongshuUrl
            : clean(patch.xiaohongshuUrl, 200),
      }
      return { ...state, author }
    }

    case 'attendanceRule/set':
      return state.attendanceRule === action.rule
        ? state
        : { ...state, attendanceRule: action.rule }

    case 'voteMode/set':
      return state.voteMode === action.mode
        ? state
        : { ...state, voteMode: action.mode }

    case 'delegation/add':
      return { ...state, delegations: [...state.delegations, action.delegation] }

    case 'delegation/rename': {
      const name = clean(action.name, 40)
      if (!name) return state
      return mapDelegation(state, action.id, (delegation) =>
        delegation.name === name ? delegation : { ...delegation, name },
      )
    }

    case 'delegation/delete':
      return {
        ...state,
        delegations: state.delegations.filter((delegation) => delegation.id !== action.id),
      }

    case 'delegation/setVotes': {
      const votes = clampInt(action.votes, 0, 999)
      return mapDelegation(state, action.id, (delegation) =>
        delegation.votes === votes ? delegation : { ...delegation, votes },
      )
    }

    case 'delegation/setHead':
      return mapDelegation(state, action.id, (delegation) => ({
        ...delegation,
        headSeatId: delegation.seats.some((seat) => seat.id === action.seatId)
          ? action.seatId
          : delegation.headSeatId,
      }))

    case 'delegation/toggleVeto':
      return mapDelegation(state, action.id, (delegation) => ({
        ...delegation,
        globalVeto: !delegation.globalVeto,
      }))

    case 'seat/add':
      return mapDelegation(state, action.delegationId, (delegation) => ({
        ...delegation,
        seats: [...delegation.seats, action.seat],
      }))

    case 'seat/rename': {
      const name = clean(action.name, 30)
      if (!name) return state
      return mapDelegation(state, action.delegationId, (delegation) => ({
        ...delegation,
        seats: delegation.seats.map((seat) =>
          seat.id === action.seatId
            ? seat.name === name
              ? seat
              : { ...seat, name }
            : seat,
        ),
      }))
    }

    case 'seat/delete':
      return mapDelegation(state, action.delegationId, (delegation) => {
        if (delegation.seats.length <= 1) return delegation
        const seats = delegation.seats.filter((seat) => seat.id !== action.seatId)
        return {
          ...delegation,
          seats,
          headSeatId:
            delegation.headSeatId === action.seatId
              ? seats[0]?.id ?? null
              : delegation.headSeatId,
        }
      })

    case 'seat/togglePresent':
      return mapDelegation(state, action.delegationId, (delegation) => ({
        ...delegation,
        seats: delegation.seats.map((seat) =>
          seat.id === action.seatId ? { ...seat, present: !seat.present } : seat,
        ),
      }))

    case 'seat/setVotes': {
      const votes = clampInt(action.votes, 0, 999)
      return mapDelegation(state, action.delegationId, (delegation) => ({
        ...delegation,
        seats: delegation.seats.map((seat) =>
          seat.id === action.seatId && seat.votes !== votes
            ? { ...seat, votes }
            : seat,
        ),
      }))
    }

    case 'session/add':
      return { ...state, sessions: [...state.sessions, action.session] }

    case 'session/rename': {
      const name = clean(action.name, 40)
      if (!name) return state
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.id
            ? session.name === name
              ? session
              : { ...session, name }
            : session,
        ),
      }
    }

    case 'session/delete': {
      const removed = state.sessions.find((session) => session.id === action.id)
      if (!removed) return state
      const removedTopicIds = new Set(removed.topics.map((topic) => topic.id))
      const isCurrent = state.currentSessionId === action.id
      return {
        ...state,
        sessions: state.sessions.filter((session) => session.id !== action.id),
        resolutions: state.resolutions.filter(
          (resolution) =>
            resolution.sessionId !== action.id && !removedTopicIds.has(resolution.topicId),
        ),
        currentSessionId: isCurrent ? null : state.currentSessionId,
        currentTopicId: isCurrent ? null : state.currentTopicId,
      }
    }

    case 'topic/add':
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.sessionId
            ? { ...session, topics: [...session.topics, action.topic] }
            : session,
        ),
      }

    case 'topic/rename': {
      const name = clean(action.name, 60)
      if (!name) return state
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.sessionId
            ? {
                ...session,
                topics: session.topics.map((topic) =>
                  topic.id === action.topicId
                    ? topic.name === name
                      ? topic
                      : { ...topic, name }
                    : topic,
                ),
              }
            : session,
        ),
      }
    }

    case 'topic/delete':
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.sessionId
            ? {
                ...session,
                topics: session.topics.filter((topic) => topic.id !== action.topicId),
              }
            : session,
        ),
        resolutions: state.resolutions.filter(
          (resolution) => resolution.topicId !== action.topicId,
        ),
        currentTopicId:
          state.currentTopicId === action.topicId ? null : state.currentTopicId,
      }

    case 'current/set': {
      const session = state.sessions.find((item) => item.id === action.sessionId)
      const topic = session?.topics.find((item) => item.id === action.topicId)
      if (!session || !topic) return state
      return {
        ...state,
        currentSessionId: session.id,
        currentTopicId: topic.id,
      }
    }

    case 'current/clear':
      return { ...state, currentSessionId: null, currentTopicId: null }

    case 'resolution/add':
      return { ...state, resolutions: [...state.resolutions, action.resolution] }

    case 'resolution/rename': {
      const title = clean(action.title, 80)
      if (!title) return state
      return {
        ...state,
        resolutions: state.resolutions.map((resolution) =>
          resolution.id === action.id
            ? resolution.title === title
              ? resolution
              : { ...resolution, title }
            : resolution,
        ),
      }
    }

    case 'resolution/delete':
      return {
        ...state,
        resolutions: state.resolutions.filter(
          (resolution) => resolution.id !== action.id,
        ),
      }

    case 'resolution/finish':
      return {
        ...state,
        resolutions: state.resolutions.map((resolution) =>
          resolution.id === action.id
            ? {
                ...resolution,
                result: action.result,
                status: action.result.passed ? 'PASSED' : 'FAILED',
              }
            : resolution,
        ),
      }

    case 'motionType/add':
      return { ...state, motionTypes: [...state.motionTypes, action.motionType] }

    case 'motionType/update':
      return {
        ...state,
        motionTypes: state.motionTypes.map((item) =>
          item.id === action.motionType.id ? action.motionType : item,
        ),
      }

    case 'motionType/delete':
      return {
        ...state,
        motionTypes: state.motionTypes.filter((item) => item.id !== action.id),
      }

    case 'motion/start':
      return { ...state, activeMotion: action.motion }

    case 'motion/startUnit': {
      const motion = state.activeMotion
      if (!motion || motion.endedAt !== null) return state
      if (action.index < 0 || action.index >= motion.speakers.length) return state
      return {
        ...state,
        activeMotion: {
          ...motion,
          unitIndex: action.index,
          unitElapsedMs: 0,
          unitRunningSince: action.now,
        },
      }
    }

    case 'motion/pause': {
      const motion = state.activeMotion
      if (!motion || motion.endedAt !== null) return state
      if (motion.unitSeconds > 0) {
        if (motion.unitRunningSince === null) return state
        return {
          ...state,
          activeMotion: {
            ...motion,
            unitElapsedMs:
              motion.unitElapsedMs + Math.max(0, action.now - motion.unitRunningSince),
            unitRunningSince: null,
          },
        }
      }
      if (motion.totalRunningSince === null) return state
      return {
        ...state,
        activeMotion: {
          ...motion,
          totalElapsedMs:
            motion.totalElapsedMs + Math.max(0, action.now - motion.totalRunningSince),
          totalRunningSince: null,
        },
      }
    }

    case 'motion/resume': {
      const motion = state.activeMotion
      if (!motion || motion.endedAt !== null) return state
      if (motion.unitSeconds > 0) {
        if (motion.unitIndex < 0 || motion.unitRunningSince !== null) return state
        return {
          ...state,
          activeMotion: { ...motion, unitRunningSince: action.now },
        }
      }
      if (motion.totalRunningSince !== null) return state
      return {
        ...state,
        activeMotion: { ...motion, totalRunningSince: action.now },
      }
    }

    case 'motion/end': {
      const motion = state.activeMotion
      if (!motion) return state
      if (motion.endedAt !== null) return state
      if (motion.unitSeconds > 0) {
        return {
          ...state,
          activeMotion: {
            ...motion,
            unitElapsedMs:
              motion.unitElapsedMs +
              (motion.unitRunningSince === null
                ? 0
                : Math.max(0, action.endedAt - motion.unitRunningSince)),
            unitRunningSince: null,
            endedAt: action.endedAt,
          },
        }
      }
      return {
        ...state,
        activeMotion: {
          ...motion,
          totalElapsedMs:
            motion.totalElapsedMs +
            (motion.totalRunningSince === null
              ? 0
              : Math.max(0, action.endedAt - motion.totalRunningSince)),
          totalRunningSince: null,
          endedAt: action.endedAt,
        },
      }
    }

    case 'vote/open':
      return { ...state, liveVote: { ...action.liveVote } }

    case 'vote/cast':
      if (!state.liveVote) return state
      return {
        ...state,
        liveVote: {
          ...state.liveVote,
          ballots: (() => {
            const next = { ...state.liveVote.ballots }
            if (next[action.key] === action.ballot) delete next[action.key]
            else next[action.key] = action.ballot
            return next
          })(),
        },
      }

    case 'vote/cancel':
      return state.liveVote ? { ...state, liveVote: null } : state

    case 'vote/finish':
      return {
        ...state,
        liveVote: null,
        resolutions: state.liveVote
          ? state.resolutions.map((item) =>
              item.id === state.liveVote?.resolutionId
                ? {
                    ...item,
                    status: action.result.passed ? 'PASSED' : 'FAILED',
                    result: action.result,
                  }
                : item,
            )
          : state.resolutions,
      }

    case 'fileType/add':
      return { ...state, fileTypes: [...state.fileTypes, action.fileType] }

    case 'fileType/update':
      return {
        ...state,
        fileTypes: state.fileTypes.map((item) =>
          item.id === action.fileType.id ? action.fileType : item,
        ),
      }

    case 'fileType/delete':
      return {
        ...state,
        fileTypes: state.fileTypes.filter((item) => item.id !== action.id),
      }

    case 'settings/patch':
      return { ...state, settings: { ...state.settings, ...action.patch } }

    case 'state/replace':
      return action.state

    case 'state/reset':
      return createInitialState()

    default:
      return state
  }
}

export function reducer(state: ConferenceState, action: Action): ConferenceState {
  const next = baseReducer(state, action)
  if (next === state) return state
  return { ...next, updatedAt: Date.now() }
}
