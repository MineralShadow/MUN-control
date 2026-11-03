import { createInitialState } from '../../src/state/defaults.ts'
import { getDb } from './db.ts'
import { loadMeeting } from './meeting.ts'

/**
 * 彻底清空会场数据：
 * - 会场名称/主题、席位、会期、决议、设置、时间全部重置；
 * - 事件、事件已读、文件、线上存档全部删除；
 * - 删除所有代表账号；保留主席账号（含初始主席），避免把主席自己锁在门外。
 */
export async function clearAllData(): Promise<void> {
  const db = getDb()
  const current = await loadMeeting()
  const now = Date.now()
  const revision = current.revision + 1
  const state = createInitialState()

  await db.batch([
    { sql: 'DELETE FROM event_recipients' },
    { sql: 'DELETE FROM event_reads' },
    { sql: 'DELETE FROM events' },
    { sql: 'DELETE FROM files' },
    { sql: 'DELETE FROM archives' },
    { sql: "DELETE FROM sessions WHERE account_id IN (SELECT id FROM accounts WHERE role <> 'chair')" },
    { sql: "DELETE FROM accounts WHERE role <> 'chair'" },
    { sql: 'UPDATE accounts SET seat_id = NULL' },
    {
      sql: `INSERT INTO meeting (id, state, revision, updated_at) VALUES (1, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET state = excluded.state,
              revision = excluded.revision, updated_at = excluded.updated_at`,
      args: [JSON.stringify(state), revision, now],
    },
    {
      sql: `INSERT INTO time_state
            (id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (1, ?, 1, 0, ?, 0, NULL, ?)
            ON CONFLICT(id) DO UPDATE SET now_ms = excluded.now_ms,
              rate = 1, running = 0, anchor_ms = excluded.anchor_ms,
              crisis_paused = 0, crisis_event_id = NULL, updated_at = excluded.updated_at`,
      args: [now, now, now],
    },
  ])
}
