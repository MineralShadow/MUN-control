import type {
  CouncilEvent,
  EventRecipientView,
  SessionUser,
} from '../../src/types.ts'
import { createId } from '../../src/lib/id.ts'
import { getDb } from './db.ts'
import {
  clearCrisisPause,
  getCurrentTime,
  pauseForCrisis,
} from './time.ts'

export interface EventInput {
  title: string
  content: string
  eventTime: number
  isCrisis: boolean
  recipientIds: string[]
}

interface EventRow {
  id: string
  title: string
  content: string
  event_time: number
  is_crisis: number
  published_at: number | null
  created_at: number
  created_by: string
}

function toEventRow(row: Record<string, unknown>): EventRow {
  return {
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    event_time: Number(row.event_time),
    is_crisis: Number(row.is_crisis),
    published_at: row.published_at === null ? null : Number(row.published_at),
    created_at: Number(row.created_at),
    created_by: String(row.created_by),
  }
}

/** 把到达事件时间的定时事件发布出去；危机事件会暂停时间 */
export async function publishDueEvents(): Promise<void> {
  const db = getDb()
  const now = await getCurrentTime()
  const due = await db.execute({
    sql: 'SELECT id, is_crisis FROM events WHERE published_at IS NULL AND event_time <= ?',
    args: [now],
  })

  for (const row of due.rows) {
    const eventId = String(row.id)
    const updated = await db.execute({
      sql: 'UPDATE events SET published_at = ? WHERE id = ? AND published_at IS NULL',
      args: [Date.now(), eventId],
    })
    if (updated.rowsAffected > 0 && Number(row.is_crisis) === 1) {
      await pauseForCrisis(eventId)
    }
  }
}

async function getRecipients(eventId: string): Promise<EventRecipientView[]> {
  const result = await getDb().execute({
    sql: `SELECT r.account_id, r.read, COALESCE(a.name, '已删除账号') AS name
          FROM event_recipients r
          LEFT JOIN accounts a ON a.id = r.account_id
          WHERE r.event_id = ?
          ORDER BY a.created_at ASC`,
    args: [eventId],
  })
  return result.rows.map((row) => ({
    accountId: String(row.account_id),
    name: String(row.name),
    read: Number(row.read) === 1,
  }))
}

function baseEvent(row: EventRow): Omit<CouncilEvent, 'recipients' | 'read' | 'readCount' | 'recipientCount'> {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    eventTime: row.event_time,
    isCrisis: row.is_crisis === 1,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

export async function listEventsForChair(): Promise<CouncilEvent[]> {
  const result = await getDb().execute(
    'SELECT * FROM events ORDER BY event_time DESC, created_at DESC',
  )
  const events: CouncilEvent[] = []
  for (const raw of result.rows) {
    const row = toEventRow(raw)
    const recipients = await getRecipients(row.id)
    events.push({
      ...baseEvent(row),
      recipients,
      read: null,
      readCount: recipients.filter((item) => item.read).length,
      recipientCount: recipients.length,
    })
  }
  return events
}

export async function listEventsForDelegate(user: SessionUser): Promise<CouncilEvent[]> {
  const result = await getDb().execute({
    sql: `SELECT e.*, r.read AS my_read
          FROM events e
          JOIN event_recipients r ON r.event_id = e.id
          WHERE r.account_id = ? AND e.published_at IS NOT NULL
          ORDER BY e.event_time DESC, e.created_at DESC`,
    args: [user.id],
  })

  return result.rows.map((raw) => {
    const row = toEventRow(raw)
    return {
      ...baseEvent(row),
      recipients: [],
      read: Number(raw.my_read) === 1,
      readCount: Number(raw.my_read) === 1 ? 1 : 0,
      recipientCount: 0,
    }
  })
}

export async function listEvents(user: SessionUser): Promise<CouncilEvent[]> {
  return user.role === 'chair'
    ? listEventsForChair()
    : listEventsForDelegate(user)
}

export async function getEventForChair(eventId: string): Promise<CouncilEvent | null> {
  const result = await getDb().execute({
    sql: 'SELECT * FROM events WHERE id = ? LIMIT 1',
    args: [eventId],
  })
  const raw = result.rows[0]
  if (!raw) return null
  const row = toEventRow(raw)
  const recipients = await getRecipients(row.id)
  return {
    ...baseEvent(row),
    recipients,
    read: null,
    readCount: recipients.filter((item) => item.read).length,
    recipientCount: recipients.length,
  }
}

async function replaceRecipients(eventId: string, recipientIds: string[]): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: 'DELETE FROM event_recipients WHERE event_id = ?',
    args: [eventId],
  })
  for (const accountId of recipientIds) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO event_recipients (event_id, account_id, read) VALUES (?, ?, 0)',
      args: [eventId, accountId],
    })
  }
}

export async function createEvent(
  user: SessionUser,
  input: EventInput,
): Promise<string> {
  const db = getDb()
  const id = createId('evt')
  const createdAt = Date.now()
  await db.execute({
    sql: `INSERT INTO events
          (id, title, content, event_time, is_crisis, published_at, created_at, created_by)
          VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
    args: [
      id,
      input.title,
      input.content,
      input.eventTime,
      input.isCrisis ? 1 : 0,
      createdAt,
      user.id,
    ],
  })
  await replaceRecipients(id, input.recipientIds)
  await publishDueEvents()
  return id
}

export async function updateEvent(
  eventId: string,
  input: EventInput,
): Promise<boolean> {
  const db = getDb()
  const existing = await db.execute({
    sql: 'SELECT * FROM events WHERE id = ? LIMIT 1',
    args: [eventId],
  })
  const raw = existing.rows[0]
  if (!raw) return false
  const row = toEventRow(raw)

  await db.execute({
    sql: `UPDATE events SET title = ?, content = ?, event_time = ?, is_crisis = ?
          WHERE id = ?`,
    args: [
      input.title,
      input.content,
      row.published_at ? row.event_time : input.eventTime,
      input.isCrisis ? 1 : 0,
      eventId,
    ],
  })
  await replaceRecipients(eventId, input.recipientIds)

  if (row.published_at && !input.isCrisis) {
    await clearCrisisPause(eventId)
  }
  if (row.published_at && input.isCrisis) {
    await pauseForCrisis(eventId)
  }

  await publishDueEvents()
  return true
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  const db = getDb()
  const existing = await db.execute({
    sql: 'SELECT id FROM events WHERE id = ? LIMIT 1',
    args: [eventId],
  })
  if (existing.rows.length === 0) return false
  await db.execute({ sql: 'DELETE FROM event_recipients WHERE event_id = ?', args: [eventId] })
  await db.execute({ sql: 'DELETE FROM events WHERE id = ?', args: [eventId] })
  await clearCrisisPause(eventId)
  return true
}

export async function setEventRead(
  user: SessionUser,
  eventId: string,
  read: boolean,
): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT read FROM event_recipients WHERE event_id = ? AND account_id = ? LIMIT 1',
    args: [eventId, user.id],
  })
  if (result.rows.length === 0) return false
  await db.execute({
    sql: 'UPDATE event_recipients SET read = ? WHERE event_id = ? AND account_id = ?',
    args: [read ? 1 : 0, eventId, user.id],
  })
  return true
}
