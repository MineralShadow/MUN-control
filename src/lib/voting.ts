import type {
  Ballot,
  BallotRecord,
  MajorityRule,
  VoteReason,
  VoteResult,
} from '../types'

export interface MajorityOption {
  value: MajorityRule
  label: string
  hint: string
}

export const MAJORITY_OPTIONS: MajorityOption[] = [
  {
    value: 'SIMPLE',
    label: '简单多数',
    hint: '赞成票多于反对票即通过。',
  },
  {
    value: 'TWO_THIRDS',
    label: '2/3 多数',
    hint: '赞成票达到有效票的 2/3 即通过（向上取整）。',
  },
  {
    value: 'UNANIMOUS',
    label: '一致同意',
    hint: '没有反对票即通过。',
  },
]

export const BALLOT_LABEL: Record<Ballot, string> = {
  YES: '赞成',
  NO: '反对',
  ABSTAIN: '弃权',
  ABSENT: '缺席',
}

export function majorityLabel(majority: MajorityRule): string {
  return MAJORITY_OPTIONS.find((item) => item.value === majority)?.label ?? '简单多数'
}

/**
 * 需要多少张赞成票。
 * 注意：分母是“有效票”（赞成 + 反对），弃权不计入。
 */
export function requiredYesVotes(majority: MajorityRule, totalCast: number): number {
  if (totalCast <= 0) return 0
  switch (majority) {
    case 'SIMPLE':
      return Math.floor(totalCast / 2) + 1
    case 'TWO_THIRDS':
      return Math.ceil((totalCast * 2) / 3)
    case 'UNANIMOUS':
      return totalCast
  }
}

export interface Tally {
  yesVotes: number
  noVotes: number
  abstainVotes: number
  /** 有效票 = 赞成 + 反对 */
  totalCast: number
  /** 出席票数（含弃权） */
  presentVotes: number
}

export function tallyBallots(ballots: BallotRecord[]): Tally {
  let yesVotes = 0
  let noVotes = 0
  let abstainVotes = 0
  let presentVotes = 0

  for (const record of ballots) {
    if (record.ballot === 'ABSENT') continue
    presentVotes += record.votes
    if (record.ballot === 'YES') yesVotes += record.votes
    else if (record.ballot === 'NO') noVotes += record.votes
    else abstainVotes += record.votes
  }

  return {
    yesVotes,
    noVotes,
    abstainVotes,
    totalCast: yesVotes + noVotes,
    presentVotes,
  }
}

export interface JudgeOutcome {
  yesVotes: number
  noVotes: number
  abstainVotes: number
  totalCast: number
  vetoedBy: string[]
  passed: boolean
  reason: VoteReason
}

export function judgeVote(
  majority: MajorityRule,
  vetoDelegationIds: string[],
  ballots: BallotRecord[],
): JudgeOutcome {
  const tally = tallyBallots(ballots)

  const vetoedBy = ballots
    .filter(
      (record) =>
        record.ballot === 'NO' &&
        (record.veto || vetoDelegationIds.includes(record.delegationId)),
    )
    .map((record) => record.name)

  if (tally.totalCast <= 0) {
    return {
      ...tally,
      vetoedBy,
      passed: false,
      reason: 'NO_VALID_VOTES',
    }
  }

  if (vetoedBy.length > 0) {
    return {
      ...tally,
      vetoedBy,
      passed: false,
      reason: 'VETOED',
    }
  }

  let passed = false
  switch (majority) {
    case 'SIMPLE':
      passed = tally.yesVotes > tally.noVotes
      break
    case 'TWO_THIRDS':
      passed = tally.yesVotes >= Math.ceil((tally.totalCast * 2) / 3)
      break
    case 'UNANIMOUS':
      passed = tally.noVotes === 0
      break
  }

  return {
    ...tally,
    vetoedBy,
    passed,
    reason: passed ? 'MAJORITY_MET' : 'MAJORITY_NOT_MET',
  }
}

export function toVoteResult(
  majority: MajorityRule,
  vetoDelegationIds: string[],
  ballots: BallotRecord[],
  votedAt = Date.now(),
): VoteResult {
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
    reason: outcome.reason,
    votedAt,
  }
}

/** 结果说明文案 */
export function resultReasonText(result: VoteResult): string {
  switch (result.reason) {
    case 'VETOED':
      return `${result.vetoedBy.join('、')} 投出反对票，行使一票否决，决议直接不通过。`
    case 'NO_VALID_VOTES':
      return '本次没有有效票（弃权与缺席不计入），决议不通过。'
    case 'MAJORITY_MET':
      return `已达到「${majorityLabel(result.majority)}」要求。`
    case 'MAJORITY_NOT_MET':
      return `未达到「${majorityLabel(result.majority)}」要求。`
  }
}
