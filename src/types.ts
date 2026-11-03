/** 代表团出席规则 */
export type AttendanceRule = 'ALL' | 'HALF' | 'TWO_THIRDS'

/** 表决通过要求 */
export type MajorityRule = 'SIMPLE' | 'TWO_THIRDS' | 'UNANIMOUS'

/** 计票方式：按代表团总票权 / 按代表席位票权 */
export type VoteMode = 'DELEGATION' | 'MEMBER'

/** 事件可见范围：公开给所有账号 / 秘密给选定账号 */
export type EventVisibility = 'PUBLIC' | 'SECRET'

/** 决议状态：未表决 / 通过 / 未通过 */
export type ResolutionStatus = 'PENDING' | 'PASSED' | 'FAILED'

/** 单个代表团的票向 */
export type Ballot = 'YES' | 'NO' | 'ABSTAIN' | 'ABSENT'

/** 表决结论的原因 */
export type VoteReason =
  | 'MAJORITY_MET'
  | 'MAJORITY_NOT_MET'
  | 'VETOED'
  | 'NO_VALID_VOTES'

export interface Seat {
  id: string
  name: string
  /** 代表计票模式下该席位的票权，整数且 >= 0 */
  votes: number
  /** 该席位是否出席（由席位圆点手动切换） */
  present: boolean
}

export interface Delegation {
  id: string
  name: string
  /** 票权，整数且 >= 0，新建默认 1 */
  votes: number
  /** 全局一票否决权 */
  globalVeto: boolean
  /** 阁首席位；只有阁首可以以代表团身份上传文件 */
  headSeatId: string | null
  seats: Seat[]
}

export interface Topic {
  id: string
  name: string
}

export interface Session {
  id: string
  name: string
  topics: Topic[]
}

export interface Settings {
  defaultMajority: MajorityRule
  skipVetoStep: boolean
  skipMajorityStep: boolean
  /** 是否允许普通代表上传个人文件；关闭时只有阁首可上传代表团文件 */
  allowPersonalFiles: boolean
}

export type FileScope = 'PERSONAL' | 'DELEGATION'

export interface FileType {
  id: string
  name: string
  allowPersonal: boolean
  forceCoSign: boolean
  allowPublic: boolean
}

export interface FileCosigner {
  delegationId: string
  delegationName: string
  confirmedAt: number | null
  confirmedByName: string | null
}

export interface MotionType {
  id: string
  name: string
  hasTopic: boolean
  hasSpeakersList: boolean
  needsTotalDuration: boolean
  hasUnitDuration: boolean
}

export interface MotionSpeaker {
  delegationId: string
  name: string
}

export interface ActiveMotion {
  id: string
  typeId: string
  typeName: string
  proposerDelegationId: string
  proposerName: string
  topic: string
  totalSeconds: number
  unitSeconds: number
  speakers: MotionSpeaker[]
  startedAt: number
  endedAt: number | null
}

export interface Author {
  name: string
  xiaohongshuId: string
  xiaohongshuUrl: string
}

/** 表决时逐团留存的快照，保证事后改名/改票权不影响历史结果 */
export interface BallotRecord {
  delegationId: string
  name: string
  votes: number
  ballot: Ballot
  /** 该团是否属于本次表决的否决国名单 */
  veto: boolean
}

export interface VoteResult {
  majority: MajorityRule
  vetoDelegationIds: string[]
  ballots: BallotRecord[]
  yesVotes: number
  noVotes: number
  abstainVotes: number
  /** 有效票 = 赞成 + 反对（弃权不计入） */
  totalCast: number
  vetoedBy: string[]
  passed: boolean
  reason: VoteReason
  votedAt: number
}

export interface Resolution {
  id: string
  title: string
  sessionId: string
  topicId: string
  status: ResolutionStatus
  result: VoteResult | null
  createdAt: number
}

export interface ConferenceState {
  schemaVersion: number
  theme: string
  author: Author
  attendanceRule: AttendanceRule
  voteMode: VoteMode
  delegations: Delegation[]
  sessions: Session[]
  currentSessionId: string | null
  currentTopicId: string | null
  resolutions: Resolution[]
  motionTypes: MotionType[]
  activeMotion: ActiveMotion | null
  fileTypes: FileType[]
  settings: Settings
  updatedAt: number
}

/* ======================= 账号 / 时间 / 事件 / 文件 ======================= */

export type Role = 'chair' | 'delegate'

export interface ConferenceSummary {
  id: string
  name: string
  role: Role
}

export interface SessionUser {
  id: string
  username: string
  name: string
  role: Role
  conferenceId: string
  conferenceName: string
}

export interface DataCategory {
  id: 'info' | 'seats' | 'sessions' | 'motions' | 'time' | 'events' | 'files' | 'accounts'
  label: string
  description: string
}

export interface AccountInfo {
  id: string
  username: string
  name: string
  role: Role
  createdAt: number
  seatId: string | null
  seatName: string | null
  delegationName: string | null
}

export interface TimeState {
  /** 当前会议时间（毫秒时间戳） */
  nowMs: number
  /** 时间流速：1 = 真实速度 */
  rate: number
  running: boolean
  /** 是否因危机事件而暂停 */
  crisisPaused: boolean
  crisisEventId: string | null
  /** 服务端计算出的当前值，方便前端直接显示 */
  currentMs: number
  updatedAt: number
}

export interface EventAttachment {
  id: string
  filename: string
  mime: string
  size: number
}

export interface EventRecipientView {
  accountId: string
  name: string
  read: boolean
}

export interface CouncilEvent {
  id: string
  title: string
  content: string
  /** 事件时间（会议时间） */
  eventTime: number
  isCrisis: boolean
  isRealtime: boolean
  attachment: EventAttachment | null
  /** 公开：所有账号可见；秘密：仅 recipients 可见 */
  visibility: EventVisibility
  /** 当前账号是否属于该事件的展示对象（主席管理列表里也用于弹窗） */
  inAudience: boolean
  /** null = 尚未发布（定时） */
  publishedAt: number | null
  createdAt: number
  createdBy: string
  recipients: EventRecipientView[]
  /** 代表自己的已读状态；主席为 null */
  read: boolean | null
  readCount: number
  recipientCount: number
}

export interface SubmittedFile {
  id: string
  title: string
  filename: string
  mime: string
  size: number
  fileTypeId: string | null
  fileType: string
  textContent: string
  scope: FileScope
  delegationId: string | null
  delegationName: string | null
  coSign: boolean
  cosigners: FileCosigner[]
  myConfirmation: 'PENDING' | 'CONFIRMED' | null
  canConfirm: boolean
  submittedAt: number
  submittedById: string
  submittedByName: string
  read: boolean
}

export interface ArchiveInfo {
  id: string
  name: string
  createdAt: number
  included: DataCategory['id'][]
}

export interface MyMembership {
  seatId: string
  delegationId: string
  delegationName: string
  isHead: boolean
}

export interface Bootstrap {
  me: SessionUser
  conference: ConferenceState
  time: TimeState
  events: CouncilEvent[]
  files: SubmittedFile[]
  accounts: AccountInfo[]
  conferences: ConferenceSummary[]
  myMembership: MyMembership | null
  revision: number
  serverNow: number
}
