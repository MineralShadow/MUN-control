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

async function loadRow(): Promise<TimeRow> {
  const db = getDb()
  const result = await db.execute('SELECT * FROM time_state WHERE id = 1 LIMIT 1')
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
    sql: `INSERT OR IGNORE INTO time_state
          (id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
          VALUES (1, ?, ?, 0, ?, 0, NULL, ?)`,
    args: [now, DEFAULT_RATE, now, now],
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

async function saveRow(row: TimeRow): Promise<void> {
  await getDb().execute({
    sql: `UPDATE time_state SET
            now_ms = ?, rate = ?, running = ?, anchor_ms = ?,
            crisis_paused = ?, crisis_event_id = ?, updated_at = ?
          WHERE id = 1`,
    args: [
      Math.round(row.now_ms),
      row.rate,
      row.running,
      row.anchor_ms,
      row.crisis_paused,
      row.crisis_event_id,
      row.updated_at,
    ],
  })
}

export async function getTimeState(): Promise<TimeState> {
  const row = await loadRow()
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

export async function getCurrentTime(): Promise<number> {
  const row = await loadRow()
  return Math.round(currentFromRow(row))
}

export async function setCurrentTime(ms: number): Promise<void> {
  const row = await loadRow()
  const at = Date.now()
  await saveRow({
    ...row,
    now_ms: Math.round(ms),
    anchor_ms: at,
    updated_at: at,
  })
}

export async function startTimeFlow(): Promise<void> {
  const row = await loadRow()
  const at = Date.now()
  await saveRow({
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    running: 1,
    updated_at: at,
  })
}

export async function pauseTimeFlow(): Promise<void> {
  const row = await loadRow()
  const at = Date.now()
  await saveRow({
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    running: 0,
    updated_at: at,
  })
}

export async function setTimeRate(rate: number): Promise<void> {
  const row = await loadRow()
  const at = Date.now()
  await saveRow({
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    rate,
    updated_at: at,
  })
}

/** 危机事件发布时调用：时间停在当前值，并标记危机暂停 */
export async function pauseForCrisis(eventId: string): Promise<void> {
  const row = await loadRow()
  const at = Date.now()
  await saveRow({
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    running: 0,
    crisis_paused: 1,
    crisis_event_id: eventId,
    updated_at: at,
  })
}

/** 解除危机暂停；若传入 eventId，则只解除该事件造成的暂停 */
export async function clearCrisisPause(eventId?: string): Promise<boolean> {
  const row = await loadRow()
  if (row.crisis_paused !== 1) return false
  if (eventId && row.crisis_event_id && row.crisis_event_id !== eventId) return false
  await saveRow({
    ...row,
    crisis_paused: 0,
    crisis_event_id: null,
    updated_at: Date.now(),
  })
  return true
}
