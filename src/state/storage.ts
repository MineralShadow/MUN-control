import type {
  ActiveMotion,
  AttendanceRule,
  Author,
  Ballot,
  BallotRecord,
  ConferenceState,
  Delegation,
  MajorityRule,
  MotionType,
  Resolution,
  ResolutionStatus,
  Seat,
  Session,
  Settings,
  Topic,
  VoteMode,
  VoteReason,
  VoteResult,
} from '../types'
import { clampInt, toInt } from '../lib/format.ts'
import { createId } from '../lib/id.ts'
import { judgeVote } from '../lib/voting.ts'
import { defaultMotionTypes } from '../lib/motionTypes.ts'
import { normalizeFileTypes } from '../lib/fileTypes.ts'
import {
  DEFAULT_AUTHOR,
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  SCHEMA_VERSION,
  createInitialState,
} from './defaults.ts'

export const STORAGE_KEY = 'mun-conference-v1'

type Dict = Record<string, unknown>

function isRecord(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function isAttendanceRule(value: unknown): value is AttendanceRule {
  return value === 'ALL' || value === 'HALF' || value === 'TWO_THIRDS'
}

function isMajorityRule(value: unknown): value is MajorityRule {
  return value === 'SIMPLE' || value === 'TWO_THIRDS' || value === 'UNANIMOUS'
}

function isResolutionStatus(value: unknown): value is ResolutionStatus {
  return value === 'PENDING' || value === 'PASSED' || value === 'FAILED'
}

function isBallot(value: unknown): value is Ballot {
  return value === 'YES' || value === 'NO' || value === 'ABSTAIN' || value === 'ABSENT'
}

function isVoteReason(value: unknown): value is VoteReason {
  return (
    value === 'MAJORITY_MET' ||
    value === 'MAJORITY_NOT_MET' ||
    value === 'VETOED' ||
    value === 'NO_VALID_VOTES'
  )
}

function normalizeSeat(value: unknown, index: number): Seat | null {
  if (!isRecord(value)) return null
  const name = asText(value.name).trim().slice(0, 30) || `代表 ${index + 1}`
  return {
    id: asText(value.id) || createId('seat'),
    name,
    votes: clampInt(toInt(value.votes, 1), 0, 999),
    present: value.present === true,
  }
}

function normalizeDelegation(value: unknown, index: number): Delegation | null {
  if (!isRecord(value)) return null
  const name = asText(value.name).trim().slice(0, 40) || `未命名代表团 ${index + 1}`
  const rawSeats = Array.isArray(value.seats) ? value.seats : []
  const seats = rawSeats
    .map((seat, seatIndex) => normalizeSeat(seat, seatIndex))
    .filter((seat): seat is Seat => seat !== null)
  if (seats.length === 0) {
    seats.push({ id: createId('seat'), name: '代表 1', votes: 1, present: false })
  }
  const headSeatIdRaw = asText(value.headSeatId)
  const headSeatId = seats.some((seat) => seat.id === headSeatIdRaw)
    ? headSeatIdRaw
    : seats[0]?.id ?? null
  return {
    id: asText(value.id) || createId('dlg'),
    name,
    votes: clampInt(toInt(value.votes, 1), 0, 999),
    globalVeto: value.globalVeto === true,
    headSeatId,
    seats,
  }
}

function normalizeTopic(value: unknown, index: number): Topic | null {
  if (!isRecord(value)) return null
  return {
    id: asText(value.id) || createId('topic'),
    name: asText(value.name).trim().slice(0, 60) || `议题 ${index + 1}`,
  }
}

function normalizeSession(value: unknown, index: number): Session | null {
  if (!isRecord(value)) return null
  const rawTopics = Array.isArray(value.topics) ? value.topics : []
  return {
    id: asText(value.id) || createId('session'),
    name: asText(value.name).trim().slice(0, 40) || `第 ${index + 1} 会期`,
    topics: rawTopics
      .map((topic, topicIndex) => normalizeTopic(topic, topicIndex))
      .filter((topic): topic is Topic => topic !== null),
  }
}

function normalizeBallot(value: unknown): BallotRecord | null {
  if (!isRecord(value)) return null
  return {
    delegationId: asText(value.delegationId) || createId('dlg'),
    name: asText(value.name).trim().slice(0, 40) || '未命名代表团',
    votes: clampInt(toInt(value.votes, 0), 0, 999),
    ballot: isBallot(value.ballot) ? value.ballot : 'ABSENT',
    veto: value.veto === true,
  }
}

function normalizeResult(value: unknown): VoteResult | null {
  if (!isRecord(value)) return null
  const majority = isMajorityRule(value.majority) ? value.majority : 'SIMPLE'
  const rawBallots = Array.isArray(value.ballots) ? value.ballots : []
  const ballots = rawBallots
    .map(normalizeBallot)
    .filter((ballot): ballot is BallotRecord => ballot !== null)
  if (ballots.length === 0) return null

  const vetoDelegationIds = Array.isArray(value.vetoDelegationIds)
    ? value.vetoDelegationIds.filter(
        (item): item is string => typeof item === 'string' && item.length > 0,
      )
    : []

  const outcome = judgeVote(majority, vetoDelegationIds, ballots)
  return {
    majority,
    vetoDelegationIds,
    ballots,
    yesVotes: outcome.yesVotes,
    noVotes: outcome.noVotes,
    abstainVotes: outcome.abstainVotes,
    totalCast: outcome.totalCast,
    vetoedBy: outcome.vetoedBy,
    passed: outcome.passed,
    reason: isVoteReason(value.reason) && value.reason === outcome.reason
      ? value.reason
      : outcome.reason,
    votedAt: toInt(value.votedAt, Date.now()),
  }
}

function normalizeResolution(value: unknown): Resolution | null {
  if (!isRecord(value)) return null
  const sessionId = asText(value.sessionId)
  const topicId = asText(value.topicId)
  if (!sessionId || !topicId) return null

  const result = normalizeResult(value.result)
  const status: ResolutionStatus = result
    ? result.passed
      ? 'PASSED'
      : 'FAILED'
    : isResolutionStatus(value.status) && value.status === 'PENDING'
      ? 'PENDING'
      : 'PENDING'

  return {
    id: asText(value.id) || createId('res'),
    title: asText(value.title).trim().slice(0, 80) || '未命名决议',
    sessionId,
    topicId,
    status,
    result,
    createdAt: toInt(value.createdAt, Date.now()),
  }
}

function normalizeMotionType(value: unknown, index: number): MotionType | null {
  if (!isRecord(value)) return null
  return {
    id: asText(value.id) || createId('motion-type'),
    name: asText(value.name).trim().slice(0, 40) || `动议类型 ${index + 1}`,
    hasTopic: value.hasTopic === true,
    hasSpeakersList: value.hasSpeakersList === true,
    needsTotalDuration: value.needsTotalDuration === true,
    hasUnitDuration: value.hasUnitDuration === true,
  }
}

function normalizeActiveMotion(value: unknown): ActiveMotion | null {
  if (!isRecord(value)) return null
  const id = asText(value.id)
  const typeId = asText(value.typeId)
  if (!id || !typeId) return null
  const rawSpeakers = Array.isArray(value.speakers) ? value.speakers : []
  const speakers = rawSpeakers
    .filter(isRecord)
    .map((item) => ({
      delegationId: asText(item.delegationId),
      name: asText(item.name).slice(0, 40),
    }))
    .filter((item) => item.delegationId)
  return {
    id,
    typeId,
    typeName: asText(value.typeName).slice(0, 40),
    proposerDelegationId: asText(value.proposerDelegationId),
    proposerName: asText(value.proposerName).slice(0, 40),
    topic: asText(value.topic).slice(0, 120),
    totalSeconds: clampInt(toInt(value.totalSeconds, 0), 0, 86400),
    unitSeconds: clampInt(toInt(value.unitSeconds, 0), 0, 86400),
    speakers,
    startedAt: toInt(value.startedAt, Date.now()),
    endedAt: value.endedAt === null ? null : toInt(value.endedAt, 0) || null,
  }
}

/**
 * 把任意来源的数据（localStorage / 导入的 JSON）整理成合法的会议状态。
 * 返回 null 表示这不是一份可识别的会议存档。
 */
export function normalizeState(input: unknown): ConferenceState | null {
  if (!isRecord(input)) return null
  if (
    !('theme' in input) &&
    !('delegations' in input) &&
    !('sessions' in input) &&
    !('resolutions' in input)
  ) {
    return null
  }

  const fallback = createInitialState()
  const theme = asText(input.theme).trim().slice(0, 80) || fallback.theme || DEFAULT_THEME

  const rawAuthor = isRecord(input.author) ? input.author : {}
  const author: Author = {
    name: asText(rawAuthor.name).trim().slice(0, 40) || DEFAULT_AUTHOR.name,
    xiaohongshuId:
      asText(rawAuthor.xiaohongshuId).trim().slice(0, 40) ||
      DEFAULT_AUTHOR.xiaohongshuId,
    xiaohongshuUrl: asText(rawAuthor.xiaohongshuUrl).trim().slice(0, 200),
  }

  const attendanceRule: AttendanceRule = isAttendanceRule(input.attendanceRule)
    ? input.attendanceRule
    : 'ALL'

  const voteMode: VoteMode =
    input.voteMode === 'MEMBER' || input.voteMode === 'DELEGATION'
      ? input.voteMode
      : 'DELEGATION'

  const rawDelegations = Array.isArray(input.delegations) ? input.delegations : []
  const delegations = rawDelegations
    .map((delegation, index) => normalizeDelegation(delegation, index))
    .filter((delegation): delegation is Delegation => delegation !== null)

  const rawSessions = Array.isArray(input.sessions) ? input.sessions : []
  const sessions = rawSessions
    .map((session, index) => normalizeSession(session, index))
    .filter((session): session is Session => session !== null)

  const sessionById = new Map(sessions.map((session) => [session.id, session]))
  const topicOwner = new Map<string, string>()
  for (const session of sessions) {
    for (const topic of session.topics) topicOwner.set(topic.id, session.id)
  }

  let currentSessionId = asText(input.currentSessionId) || null
  let currentTopicId = asText(input.currentTopicId) || null

  if (currentSessionId && !sessionById.has(currentSessionId)) {
    currentSessionId = null
  }
  if (currentTopicId) {
    const ownerId = topicOwner.get(currentTopicId)
    if (!ownerId) {
      currentTopicId = null
    } else if (currentSessionId !== ownerId) {
      currentSessionId = ownerId
    }
  }
  if (currentSessionId && !currentTopicId) {
    // 只保留会期也可以，顶栏会显示“尚未选择议题”
  }

  const rawMotionTypes = Array.isArray(input.motionTypes) ? input.motionTypes : []
  const motionTypes = rawMotionTypes
    .map((item, index) => normalizeMotionType(item, index))
    .filter((item): item is MotionType => item !== null)
  const finalMotionTypes = motionTypes.length > 0 ? motionTypes : defaultMotionTypes()

  const rawResolutions = Array.isArray(input.resolutions) ? input.resolutions : []
  const resolutions = rawResolutions
    .map(normalizeResolution)
    .filter(
      (resolution): resolution is Resolution =>
        resolution !== null && topicOwner.get(resolution.topicId) === resolution.sessionId,
    )

  const rawSettings = isRecord(input.settings) ? input.settings : {}
  const settings: Settings = {
    defaultMajority: isMajorityRule(rawSettings.defaultMajority)
      ? rawSettings.defaultMajority
      : DEFAULT_SETTINGS.defaultMajority,
    skipVetoStep:
      typeof rawSettings.skipVetoStep === 'boolean'
        ? rawSettings.skipVetoStep
        : DEFAULT_SETTINGS.skipVetoStep,
    skipMajorityStep:
      typeof rawSettings.skipMajorityStep === 'boolean'
        ? rawSettings.skipMajorityStep
        : DEFAULT_SETTINGS.skipMajorityStep,
    allowPersonalFiles:
      typeof rawSettings.allowPersonalFiles === 'boolean'
        ? rawSettings.allowPersonalFiles
        : DEFAULT_SETTINGS.allowPersonalFiles,
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    theme,
    author,
    attendanceRule,
    voteMode,
    delegations,
    sessions,
    currentSessionId,
    currentTopicId,
    resolutions,
    motionTypes: finalMotionTypes,
    activeMotion: normalizeActiveMotion(input.activeMotion),
    fileTypes: normalizeFileTypes(input.fileTypes),
    settings,
    updatedAt: toInt(input.updatedAt, Date.now()),
  }
}

export function loadState(): ConferenceState {
  if (typeof window === 'undefined') return createInitialState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed: unknown = JSON.parse(raw)
    return normalizeState(parsed) ?? createInitialState()
  } catch {
    return createInitialState()
  }
}

export function saveState(state: ConferenceState): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch (error) {
    console.warn('[MUN] 本地保存失败', error)
    return false
  }
}

export function clearStoredState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function exportStateFile(state: ConferenceState): void {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}`

  const payload = JSON.stringify(
    { ...state, schemaVersion: SCHEMA_VERSION },
    null,
    2,
  )
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `MUN-会议存档-${stamp}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function importStateFile(file: File): Promise<ConferenceState> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('文件不是有效的 JSON')
  }
  const state = normalizeState(parsed)
  if (!state) throw new Error('文件内容不是本站的会议存档')
  return state
}
