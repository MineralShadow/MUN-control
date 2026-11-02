import { BALLOT_LABEL } from '../../lib/voting'
import type { Ballot, Delegation } from '../../types'

interface VoteCastingProps {
  delegations: Delegation[]
  ballots: Record<string, Ballot | undefined>
  onBallot: (delegationId: string, ballot: Ballot) => void
  vetoIds: string[]
}

const OPTIONS: Ballot[] = ['YES', 'NO', 'ABSTAIN']

export function VoteCasting({
  delegations,
  ballots,
  onBallot,
  vetoIds,
}: VoteCastingProps) {
  return (
    <div className="ballot-list">
      {delegations.map((delegation, index) => {
        const current = ballots[delegation.id]
        return (
          <div className={`ballot-row${current ? ' voted' : ''}`} key={delegation.id}>
            <div className="ballot-id">
              <span className="ballot-index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="ballot-name">{delegation.name}</span>
              <span className="ballot-votes">{delegation.votes} 票</span>
              {vetoIds.includes(delegation.id) ? (
                <span className="badge badge-veto">否决国</span>
              ) : null}
            </div>
            <div className="ballot-buttons">
              {OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`ballot-btn ballot-${option.toLowerCase()}${
                    current === option ? ' active' : ''
                  }`}
                  aria-pressed={current === option}
                  onClick={() => onBallot(delegation.id, option)}
                >
                  {BALLOT_LABEL[option]}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
