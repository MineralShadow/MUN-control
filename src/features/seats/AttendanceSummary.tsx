import { attendanceRuleLabel } from '../../lib/attendance'
import type { AttendanceRule } from '../../types'
import type { VoteStats } from '../../state/selectors'

interface AttendanceSummaryProps {
  stats: VoteStats
  rule: AttendanceRule
}

export function AttendanceSummary({ stats, rule }: AttendanceSummaryProps) {
  return (
    <section className="stat-grid" aria-label="票数统计">
      <div className="stat-card stat-primary">
        <div className="stat-label">出席总票数</div>
        <div className="stat-value">{stats.presentVotes}</div>
        <div className="stat-note">
          全体 {stats.totalVotes} 票 · {attendanceRuleLabel(rule)}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">加权简单多数</div>
        <div className="stat-value">{stats.simpleMajority ?? '—'}</div>
        <div className="stat-note">
          {stats.presentVotes > 0 ? `⌊${stats.presentVotes} ÷ 2⌋ + 1` : '暂无出席票'}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">加权 2/3 多数</div>
        <div className="stat-value">{stats.twoThirdsMajority ?? '—'}</div>
        <div className="stat-note">
          {stats.presentVotes > 0 ? `⌈${stats.presentVotes} × 2/3⌉` : '暂无出席票'}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">代表团 / 席位</div>
        <div className="stat-value stat-value-sm">
          {stats.presentDelegations}
          <span className="stat-divider">/</span>
          {stats.totalDelegations}
        </div>
        <div className="stat-note">
          出席席位 {stats.presentSeats} / {stats.totalSeats}
        </div>
      </div>
    </section>
  )
}
