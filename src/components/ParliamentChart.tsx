import { BALLOT_LABEL } from '../lib/voting'
import type { Ballot, BallotRecord, VoteResult } from '../types'

const FILL: Record<Ballot, string> = {
  YES: '#2f7d5c',
  NO: '#b23b3b',
  ABSTAIN: '#b7791f',
  ABSENT: '#d3ccbd',
}

// 图上从左到右：赞成 → 弃权 → 反对 → 缺席，便于一眼看出票型分布
const BALLOT_ORDER: Record<Ballot, number> = {
  YES: 0,
  ABSTAIN: 1,
  NO: 2,
  ABSENT: 3,
}

const WIDTH = 660
const HEIGHT = 360
const CX = WIDTH / 2
const CY = HEIGHT - 22
const OUTER = 300
const INNER = Math.max(76, OUTER * 0.3)

interface SeatDot {
  record: BallotRecord
  x: number
  y: number
}

/**
 * 半圆席位图：
 * - 每个代表团占“票权”个圆点，所有圆点同尺寸（Q4 口径）；
 * - 圆点按代表团顺序连续分布，颜色表示票向；
 * - 排布算法参考《议题态度分析器》的按弧长分行方案。
 */
export function ParliamentChart({ result }: { result: VoteResult }) {
  const orderedBallots = [...result.ballots].sort(
    (a, b) => BALLOT_ORDER[a.ballot] - BALLOT_ORDER[b.ballot],
  )

  const seats: BallotRecord[] = []
  for (const record of orderedBallots) {
    const weight = Math.max(0, Math.round(record.votes))
    for (let index = 0; index < weight; index += 1) seats.push(record)
  }

  const total = seats.length
  if (total === 0) {
    return <div className="chart-empty">没有加权的席位数据，无法绘制半圆图。</div>
  }

  // 席位少时单排半圆更清晰；席位多时再按弧长分成多排
  const rows = Math.max(1, Math.min(12, Math.ceil(total / 26)))
  const rowStep = (OUTER - INNER) / rows
  const radii = Array.from({ length: rows }, (_, row) => OUTER - rowStep * (row + 0.5))
  const radiusSum = radii.reduce((sum, radius) => sum + radius, 0)

  const exact = radii.map((radius) => (total * radius) / radiusSum)
  const perRow = exact.map((value) => Math.floor(value))
  let remainder = total - perRow.reduce((sum, value) => sum + value, 0)
  const byFraction = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)
  for (let index = 0; index < remainder; index += 1) {
    perRow[byFraction[index % rows].index] += 1
  }

  const positions: { x: number; y: number; angle: number }[] = []
  perRow.forEach((count, row) => {
    const radius = radii[row]
    for (let index = 0; index < count; index += 1) {
      const angle =
        count <= 1 ? Math.PI / 2 : Math.PI - (Math.PI * (index + 0.5)) / count
      positions.push({
        x: CX + radius * Math.cos(angle),
        y: CY - radius * Math.sin(angle),
        angle,
      })
    }
  })
  // 从左侧（角度 π）开始排，让第一组“赞成”落在左边
  positions.sort((a, b) => b.angle - a.angle)

  const minGap = Math.min(
    ...perRow
      .map((count, row) => (count > 0 ? (Math.PI * radii[row]) / count : Number.POSITIVE_INFINITY))
      .filter((gap) => Number.isFinite(gap)),
  )
  const dotRadius = Math.max(
    2.2,
    Math.min(19, minGap * 0.36, rowStep * 0.42),
  )

  const dots: SeatDot[] = []
  const limit = Math.min(seats.length, positions.length)
  for (let index = 0; index < limit; index += 1) {
    dots.push({
      record: seats[index],
      x: positions[index].x,
      y: positions[index].y,
    })
  }

  const chartLabel = `半圆席位图：赞成 ${result.yesVotes} 票，反对 ${result.noVotes} 票，弃权 ${result.abstainVotes} 票`

  return (
    <div className="parliament">
      <svg
        className="parliament-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={chartLabel}
      >
        <text x={CX} y={CY - 74} textAnchor="middle" className="chart-caption">
          加权票数
        </text>
        <text x={CX} y={CY - 48} textAnchor="middle" className="chart-count chart-yes">
          赞成 {result.yesVotes}
        </text>
        <text x={CX} y={CY - 26} textAnchor="middle" className="chart-count chart-no">
          反对 {result.noVotes}
        </text>
        <text x={CX} y={CY - 4} textAnchor="middle" className="chart-count chart-abstain">
          弃权 {result.abstainVotes}
        </text>

        {dots.map((dot, index) => (
          <circle
            key={`${dot.record.delegationId}-${index}`}
            cx={dot.x}
            cy={dot.y}
            r={dotRadius}
            fill={FILL[dot.record.ballot]}
            stroke="#fffdf8"
            strokeWidth={dotRadius > 4 ? 0.8 : 0.4}
            opacity={dot.record.ballot === 'ABSENT' ? 0.72 : 1}
          >
            <title>
              {`${dot.record.name} · 票权 ${dot.record.votes} · ${BALLOT_LABEL[dot.record.ballot]}`}
            </title>
          </circle>
        ))}
      </svg>
    </div>
  )
}
