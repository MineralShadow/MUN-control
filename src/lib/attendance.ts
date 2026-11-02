import type { AttendanceRule, Delegation } from '../types'

export interface AttendanceRuleOption {
  value: AttendanceRule
  label: string
  short: string
  hint: string
}

export const ATTENDANCE_RULES: AttendanceRuleOption[] = [
  {
    value: 'ALL',
    label: '全员出席',
    short: '全员',
    hint: '代表团所有席位均出席，才算该团出席。',
  },
  {
    value: 'TWO_THIRDS',
    label: '2/3 多数出席',
    short: '2/3',
    hint: '出席席位达到 ⌈席位总数 × 2/3⌉，该代表团即视为出席（向上取整）。',
  },
  {
    value: 'HALF',
    label: '半数出席',
    short: '半数',
    hint: '出席席位达到 ⌈席位总数 × 1/2⌉，该代表团即视为出席（向上取整）。',
  },
]

export function attendanceRuleLabel(rule: AttendanceRule): string {
  return ATTENDANCE_RULES.find((item) => item.value === rule)?.label ?? '全员出席'
}

export function attendanceRuleHint(rule: AttendanceRule): string {
  return ATTENDANCE_RULES.find((item) => item.value === rule)?.hint ?? ''
}

/** 按规则算出一个代表团至少需要多少个席位出席 */
export function requiredPresentSeats(seatCount: number, rule: AttendanceRule): number {
  if (seatCount <= 0) return 0
  switch (rule) {
    case 'ALL':
      return seatCount
    case 'HALF':
      return Math.ceil(seatCount / 2)
    case 'TWO_THIRDS':
      return Math.ceil((seatCount * 2) / 3)
  }
}

export function countPresentSeats(delegation: Delegation): number {
  return delegation.seats.filter((seat) => seat.present).length
}

/**
 * 代表团是否出席：只由“席位出席数 + 全局规则”决定。
 * 代表团右侧圆点不可点击，就是为了保证这个判定只能通过规则改变。
 */
export function isDelegationPresent(delegation: Delegation, rule: AttendanceRule): boolean {
  const seatCount = delegation.seats.length
  if (seatCount <= 0) return false
  return countPresentSeats(delegation) >= requiredPresentSeats(seatCount, rule)
}
