import { createInitialState } from '../../src/state/defaults.ts'
import { defaultMotionTypes } from '../../src/lib/motionTypes.ts'
import { defaultFileTypes } from '../../src/lib/fileTypes.ts'
import {
  ALL_CATEGORY_IDS,
  normalizeCategories,
  type DataCategoryId,
} from '../../src/lib/dataCategories.ts'
import { getDb } from './db.ts'
import { loadMeeting } from './meeting.ts'

/**
 * 清除当前会场的指定类别数据。
 * - 只影响当前会场；其他会场完全不受影响。
 * - archives 线上存档不在此清除范围内，保留为备份。
 * - 当前主席与初始主席的账号/会场成员关系始终保留，避免把主席锁在门外。
 */
export async function clearConferenceData(
  conferenceId: string,
  currentAccountId: string,
  includedRaw: unknown,
): Promise<void> {
  const db = getDb()
  const included = normalizeCategories(includedRaw)
  const has = (id: DataCategoryId) => included.includes(id)
  if (included.length === 0) return

  const current = await loadMeeting(conferenceId)
  const now = Date.now()
  const revision = current.revision + 1
  const defaults = createInitialState()
  let nextState = { ...current.state }

  if (has('info')) {
    nextState = {
      ...nextState,
      theme: defaults.theme,
      author: defaults.author,
      attendanceRule: defaults.attendanceRule,
      voteMode: defaults.voteMode,
      settings: defaults.settings,
    }
  }
  if (has('seats')) {
    nextState = { ...nextState, delegations: [] }
  }
  if (has('sessions')) {
    nextState = {
      ...nextState,
      sessions: [],
      currentSessionId: null,
      currentTopicId: null,
      resolutions: [],
      liveVote: null,
    }
  }
  if (has('motions')) {
    nextState = {
      ...nextState,
      motionTypes: defaultMotionTypes(),
      activeMotion: null,
    }
  }
  if (has('files')) {
    nextState = { ...nextState, fileTypes: defaultFileTypes() }
  }
  nextState = { ...nextState, updatedAt: now }

  const statements = [
    {
      sql: `UPDATE conference_meeting SET state = ?, revision = ?, updated_at = ?
            WHERE conference_id = ?`,
      args: [JSON.stringify(nextState), revision, now, conferenceId],
    },
  ]
  if (has('info')) {
    statements.push({
      sql: 'UPDATE conferences SET name = ? WHERE id = ?',
      args: [defaults.theme, conferenceId],
    })
  }
  if (has('seats')) {
    statements.push({
      sql: 'UPDATE conference_members SET seat_id = NULL WHERE conference_id = ?',
      args: [conferenceId],
    })
  }
  if (has('time')) {
    statements.push({
      sql: `INSERT INTO conference_time
            (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (?, ?, 1, 0, ?, 0, NULL, ?)
            ON CONFLICT(conference_id) DO UPDATE SET
              now_ms = excluded.now_ms, rate = 1, running = 0,
              anchor_ms = excluded.anchor_ms, crisis_paused = 0,
              crisis_event_id = NULL, updated_at = excluded.updated_at`,
      args: [conferenceId, now, now, now],
    })
  }
  if (has('events')) {
    statements.push(
      {
        sql: 'DELETE FROM event_attachments WHERE event_id IN (SELECT id FROM events WHERE conference_id = ?)',
        args: [conferenceId],
      },
      {
        sql: 'DELETE FROM event_recipients WHERE event_id IN (SELECT id FROM events WHERE conference_id = ?)',
        args: [conferenceId],
      },
      {
        sql: 'DELETE FROM event_reads WHERE event_id IN (SELECT id FROM events WHERE conference_id = ?)',
        args: [conferenceId],
      },
      { sql: 'DELETE FROM events WHERE conference_id = ?', args: [conferenceId] },
    )
  }
  if (has('files')) {
    statements.push(
      { sql: 'DELETE FROM file_cosigners WHERE conference_id = ?', args: [conferenceId] },
      { sql: 'DELETE FROM files WHERE conference_id = ?', args: [conferenceId] },
    )
  }

  if (has('accounts')) {
    const members = await db.execute({
      sql: `SELECT cm.account_id, a.username, cm.role
            FROM conference_members cm
            JOIN accounts a ON a.id = cm.account_id
            WHERE cm.conference_id = ?`,
      args: [conferenceId],
    })
    for (const member of members.rows) {
      const accountId = String(member.account_id)
      if (accountId === currentAccountId || String(member.username) === '123456') {
        continue
      }
      statements.push(
        {
          sql: `DELETE FROM event_recipients WHERE account_id = ?
                AND event_id IN (SELECT id FROM events WHERE conference_id = ?)`,
          args: [accountId, conferenceId],
        },
        {
          sql: `DELETE FROM event_reads WHERE account_id = ?
                AND event_id IN (SELECT id FROM events WHERE conference_id = ?)`,
          args: [accountId, conferenceId],
        },
        {
          sql: 'DELETE FROM conference_members WHERE conference_id = ? AND account_id = ?',
          args: [conferenceId, accountId],
        },
        { sql: 'DELETE FROM sessions WHERE account_id = ?', args: [accountId] },
      )
      const other = await db.execute({
        sql: 'SELECT 1 AS ok FROM conference_members WHERE account_id = ? LIMIT 1',
        args: [accountId],
      })
      if (other.rows.length === 0) {
        statements.push(
          { sql: 'DELETE FROM push_subscriptions WHERE account_id = ?', args: [accountId] },
          { sql: 'DELETE FROM accounts WHERE id = ?', args: [accountId] },
        )
      }
    }
  }

  await db.batch(statements)
}
