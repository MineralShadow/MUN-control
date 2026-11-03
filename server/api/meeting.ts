import type { ConferenceState } from '../../src/types.ts'
import { createInitialState } from '../../src/state/defaults.ts'
import { reducer, type Action } from '../../src/state/reducer.ts'
import { normalizeState } from '../../src/state/storage.ts'
import { getDb } from './db.ts'

export interface MeetingSnapshot {
  state: ConferenceState
  revision: number
}

export async function loadMeeting(): Promise<MeetingSnapshot> {
  const result = await getDb().execute('SELECT state, revision FROM meeting WHERE id = 1')
  const row = result.rows[0]
  if (!row) {
    return { state: createInitialState(), revision: 0 }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(String(row.state))
  } catch {
    parsed = null
  }
  return {
    state: normalizeState(parsed) ?? createInitialState(),
    revision: Number(row.revision),
  }
}

export async function applyConferenceAction(
  action: Action,
): Promise<MeetingSnapshot> {
  const current = await loadMeeting()
  const next = reducer(current.state, action)
  const normalized = normalizeState(next) ?? next
  const revision = current.revision + 1

  const db = getDb()
  await db.execute({
    sql: 'UPDATE meeting SET state = ?, revision = ?, updated_at = ? WHERE id = 1',
    args: [JSON.stringify(normalized), revision, Date.now()],
  })

  // 删除席位/代表团后，账号不删除，只解绑已经消失的席位
  const seatIds = new Set(
    normalized.delegations.flatMap((delegation) =>
      delegation.seats.map((seat) => seat.id),
    ),
  )
  const bound = await db.execute(
    'SELECT id, seat_id FROM accounts WHERE seat_id IS NOT NULL',
  )
  for (const row of bound.rows) {
    if (!seatIds.has(String(row.seat_id))) {
      await db.execute({
        sql: 'UPDATE accounts SET seat_id = NULL WHERE id = ?',
        args: [String(row.id)],
      })
    }
  }

  return { state: normalized, revision }
}
