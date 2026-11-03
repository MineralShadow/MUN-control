import type { TimeState } from '../../src/types.ts'
import { getDb } from './db.ts'

export interface TimeRow {
  now_ms: number
  rate: number
  running: number
  anchor_ms: number
  crisis_paused: number
  crisis_event_id: string | null
  updated_at: number
}

const DEFAULT_RATE = 1

async function loadRow(conferenceId: string): Promise<TimeRow> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM conference_time WHERE conference_id = ? LIMIT 1',
    args: [conferenceId],
  })
  const row = result.rows[0]
  if (row) {
    return {
      now_ms: Number(row.now_ms),
      rate: Number(row.rate),
      running: Number(row.running),
      anchor_ms: Number(row.anchor_ms),
      crisis_paused: Number(row.crisis_paused),
      crisis_event_id: row.crisis_event_id ? String(row.crisis_event_id) : null,
      updated_at: Number(row.updated_at),
    }
  }

  const now = Date.now()
  await db.execute({
    sql: `INSERT OR IGNORE INTO conference_time
          (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
          VALUES (?, ?, ?, 0, ?, 0, NULL, ?)`,
    args: [conferenceId, now, DEFAULT_RATE, now, now],
  })
  return {
    now_ms: now,
    rate: DEFAULT_RATE,
    running: 0,
    anchor_ms: now,
    crisis_paused: 0,
    crisis_event_id: null,
    updated_at: now,
  }
}

function currentFromRow(row: TimeRow, at = Date.now()): number {
  if (!row.running) return row.now_ms
  return row.now_ms + Math.max(0, at - row.anchor_ms) * row.rate
}

async function saveRow(conferenceId: string, row: TimeRow): Promise<void> {
  await getDb().execute({
    sql: `UPDATE conference_time SET
            now_ms = ?, rate = ?, running = ?, anchor_ms = ?,
            crisis_paused = ?, crisis_event_id = ?, updated_at = ?
          WHERE conference_id = ?`,
    args: [
      Math.round(row.now_ms),
      row.rate,
      row.running,
      row.anchor_ms,
      row.crisis_paused,
      row.crisis_event_id,
      row.updated_at,
      conferenceId,
    ],
  })
}

export async function getTimeState(conferenceId: string): Promise<TimeState> {
  const row = await loadRow(conferenceId)
  const at = Date.now()
  return {
    nowMs: row.now_ms,
    rate: row.rate,
    running: row.running === 1,
    crisisPaused: row.crisis_paused === 1,
    crisisEventId: row.crisis_event_id,
    currentMs: Math.round(currentFromRow(row, at)),
    updatedAt: row.updated_at,
  }
}

export async function getCurrentTime(conferenceId: string): Promise<number> {
  const row = await loadRow(conferenceId)
  return Math.round(currentFromRow(row))
}

export async function setCurrentTime(conferenceId: string, ms: number): Promise<void> {
  const row = await loadRow(conferenceId)
  const at = Date.now()
  await saveRow(conferenceId, {
    ...row,
    now_ms: Math.round(ms),
    anchor_ms: at,
    updated_at: at,
  })
}

export async function startTimeFlow(conferenceId: string): Promise<void> {
  const row = await loadRow(conferenceId)
  const at = Date.now()
  await saveRow(conferenceId, {
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    running: 1,
    updated_at: at,
  })
}

export async function pauseTimeFlow(conferenceId: string): Promise<void> {
  const row = await loadRow(conferenceId)
  const at = Date.now()
  await saveRow(conferenceId, {
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    running: 0,
    updated_at: at,
  })
}

export async function setTimeRate(conferenceId: string, rate: number): Promise<void> {
  const row = await loadRow(conferenceId)
  const at = Date.now()
  await saveRow(conferenceId, {
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    rate,
    updated_at: at,
  })
}

export async function pauseForCrisis(conferenceId: string, eventId: string): Promise<void> {
  const row = await loadRow(conferenceId)
  const at = Date.now()
  await saveRow(conferenceId, {
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    running: 0,
    crisis_paused: 1,
    crisis_event_id: eventId,
    updated_at: at,
  })
}

export async function clearCrisisPause(conferenceId: string, eventId?: string): Promise<void> {
  const row = await loadRow(conferenceId)
  if (eventId && row.crisis_event_id && row.crisis_event_id !== eventId) return
  const at = Date.now()
  await saveRow(conferenceId, {
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    crisis_paused: 0,
    crisis_event_id: null,
    updated_at: at,
  })
}
