import type { ConferenceSummary, SessionUser } from '../../src/types.ts'
import { createId } from '../../src/lib/id.ts'
import { createInitialState } from '../../src/state/defaults.ts'
import { getDb } from './db.ts'

export async function createConference(
  user: SessionUser,
  nameRaw: string,
): Promise<ConferenceSummary> {
  const db = getDb()
  const name = nameRaw.trim().slice(0, 80) || '新会场'
  const id = createId('conf')
  const now = Date.now()
  const state = { ...createInitialState(), theme: name }

  await db.batch([
    {
      sql: 'INSERT INTO conferences (id, name, created_at, created_by) VALUES (?, ?, ?, ?)',
      args: [id, name, now, user.id],
    },
    {
      sql: `INSERT INTO conference_members
            (conference_id, account_id, role, seat_id, created_at)
            VALUES (?, ?, 'chair', NULL, ?)`,
      args: [id, user.id, now],
    },
    {
      sql: `INSERT INTO conference_meeting
            (conference_id, state, revision, updated_at) VALUES (?, ?, 0, ?)`,
      args: [id, JSON.stringify(state), now],
    },
    {
      sql: `INSERT INTO conference_time
            (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (?, ?, 1, 0, ?, 0, NULL, ?)`,
      args: [id, now, now, now],
    },
  ])

  return { id, name, role: 'chair' }
}

export async function addExistingChair(
  conferenceId: string,
  accountId: string,
): Promise<boolean> {
  const db = getDb()
  const account = await db.execute({
    sql: "SELECT id FROM accounts WHERE id = ? AND role = 'chair' LIMIT 1",
    args: [accountId],
  })
  if (account.rows.length === 0) return false
  await db.execute({
    sql: `INSERT OR IGNORE INTO conference_members
          (conference_id, account_id, role, seat_id, created_at)
          VALUES (?, ?, 'chair', NULL, ?)`,
    args: [conferenceId, accountId, Date.now()],
  })
  return true
}
