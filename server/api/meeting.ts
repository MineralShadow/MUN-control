import type { ConferenceState } from '../../src/types.ts'
import { createInitialState } from '../../src/state/defaults.ts'
import { reducer, type Action } from '../../src/state/reducer.ts'
import { normalizeState } from '../../src/state/storage.ts'
import { getDb } from './db.ts'

export interface MeetingSnapshot {
  state: ConferenceState
  revision: number
}

export async function loadMeeting(conferenceId: string): Promise<MeetingSnapshot> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT state, revision FROM conference_meeting WHERE conference_id = ?',
    args: [conferenceId],
  })
  let row = result.rows[0]
  if (!row) {
    const state = createInitialState()
    await db.execute({
      sql: `INSERT OR IGNORE INTO conference_meeting
            (conference_id, state, revision, updated_at) VALUES (?, ?, 0, ?)`,
      args: [conferenceId, JSON.stringify(state), Date.now()],
    })
    row = (
      await db.execute({
        sql: 'SELECT state, revision FROM conference_meeting WHERE conference_id = ?',
        args: [conferenceId],
      })
    ).rows[0]
  }
  if (!row) return { state: createInitialState(), revision: 0 }
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
  conferenceId: string,
  action: Action,
): Promise<MeetingSnapshot> {
  const current = await loadMeeting(conferenceId)
  const next = reducer(current.state, action)
  const normalized = normalizeState(next) ?? next
  const revision = current.revision + 1
  const db = getDb()

  await db.execute({
    sql: `UPDATE conference_meeting SET state = ?, revision = ?, updated_at = ?
          WHERE conference_id = ?`,
    args: [JSON.stringify(normalized), revision, Date.now(), conferenceId],
  })
  await db.execute({
    sql: 'UPDATE conferences SET name = ? WHERE id = ?',
    args: [normalized.theme.slice(0, 80) || '会场', conferenceId],
  })

  const seatIds = new Set(
    normalized.delegations.flatMap((delegation) =>
      delegation.seats.map((seat) => seat.id),
    ),
  )
  const bound = await db.execute({
    sql: 'SELECT account_id, seat_id FROM conference_members WHERE conference_id = ? AND seat_id IS NOT NULL',
    args: [conferenceId],
  })
  for (const row of bound.rows) {
    if (!seatIds.has(String(row.seat_id))) {
      await db.execute({
        sql: 'UPDATE conference_members SET seat_id = NULL WHERE conference_id = ? AND account_id = ?',
        args: [conferenceId, String(row.account_id)],
      })
    }
  }

  return { state: normalized, revision }
}
