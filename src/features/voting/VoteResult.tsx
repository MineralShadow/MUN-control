import { ParliamentChart } from '../../components/ParliamentChart'
import { formatDateTime } from '../../lib/format'
import {
  BALLOT_LABEL,
  majorityLabel,
  resultReasonText,
} from '../../lib/voting'
import type { VoteResult as VoteResultData } from '../../types'

export function VoteResult({ result }: { result: VoteResultData }) {
  const nameById = new Map(result.ballots.map((ballot) => [ballot.delegationId, ballot.name]))
  const vetoNames = result.vetoDelegationIds
    .map((id) => nameById.get(id))
    .filter((name): name is string => Boolean(name))

  const absentVotes = result.ballots
    .filter((ballot) => ballot.ballot === 'ABSENT')
    .reduce((sum, ballot) => sum + ballot.votes, 0)

  return (
    <div className="vote-result">
      <div className={`result-banner ${result.passed ? 'is-passed' : 'is-failed'}`}>
        <span className="result-verdict">{result.passed ? '通过' : '未通过'}</span>
        <p>{resultReasonText(result)}</p>
      </div>

      <div className="result-chart-wrap">
        <ParliamentChart result={result} />
      </div>

      <ul className="legend" aria-label="图例">
        <li>
          <span className="legend-dot legend-yes" aria-hidden="true" />
          赞成 <strong>{result.yesVotes}</strong>
        </li>
        <li>
          <span className="legend-dot legend-no" aria-hidden="true" />
          反对 <strong>{result.noVotes}</strong>
        </li>
        <li>
          <span className="legend-dot legend-abstain" aria-hidden="true" />
          弃权 <strong>{result.abstainVotes}</strong>
        </li>
        <li>
          <span className="legend-dot legend-absent" aria-hidden="true" />
          缺席 <strong>{absentVotes}</strong>
        </li>
      </ul>

      <div className="result-stats">
        <div className="result-stat">
          <span>赞成</span>
          <strong className="yes">{result.yesVotes}</strong>
        </div>
        <div className="result-stat">
          <span>反对</span>
          <strong className="no">{result.noVotes}</strong>
        </div>
        <div className="result-stat">
          <span>弃权</span>
          <strong className="abstain">{result.abstainVotes}</strong>
        </div>
        <div className="result-stat">
          <span>有效票</span>
          <strong>{result.totalCast}</strong>
        </div>
      </div>

      <div className="result-meta">
        <span>
          多数规则：<strong>{majorityLabel(result.majority)}</strong>
        </span>
        <span>
          否决国：<strong>{vetoNames.length > 0 ? vetoNames.join('、') : '无'}</strong>
        </span>
        <span>
          表决时间：<strong>{formatDateTime(result.votedAt)}</strong>
        </span>
      </div>

      <details className="result-details">
        <summary>逐团明细（{result.ballots.length} 个代表团）</summary>
        <div className="result-table-wrap">
          <table className="result-table">
            <thead>
              <tr>
                <th>代表团</th>
                <th>票权</th>
                <th>票向</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {result.ballots.map((ballot) => (
                <tr
                  key={ballot.delegationId}
                  className={ballot.ballot === 'ABSENT' ? 'muted' : undefined}
                >
                  <td>{ballot.name}</td>
                  <td>{ballot.votes}</td>
                  <td>
                    <span className={`ballot-tag ballot-${ballot.ballot.toLowerCase()}`}>
                      {BALLOT_LABEL[ballot.ballot]}
                    </span>
                  </td>
                  <td>
                    {ballot.veto
                      ? ballot.ballot === 'NO'
                        ? '否决国 · 触发否决'
                        : '否决国'
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
