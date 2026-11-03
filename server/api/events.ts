import type {
  CouncilEvent,
  EventRecipientView,
  EventVisibility,
  SessionUser,
} from '../../src/types.ts'
import { createId } from '../../src/lib/id.ts'
import { getDb } from './db.ts'
import { sendEventPush } from './push.ts'
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
  isRealtime: boolean
  visibility: EventVisibility
  recipientIds: string[]
}

interface EventRow {
  id: string
  conference_id: string
  title: string
  content: string
  event_time: number
  is_crisis: number
  is_realtime: number
  visibility: string
  published_at: number | null
  created_at: number
  created_by: string
}

function toEventRow(row: Record<string, unknown>): EventRow {
  return {
    id: String(row.id),
    conference_id: String(row.conference_id),
    title: String(row.title),
    content: String(row.content),
    event_time: Number(row.event_time),
    is_crisis: Number(row.is_crisis),
    is_realtime: Number(row.is_realtime ?? 0),
    visibility: row.visibility === 'PUBLIC' ? 'PUBLIC' : 'SECRET',
    published_at: row.published_at === null ? null : Number(row.published_at),
    created_at: Number(row.created_at),
    created_by: String(row.created_by),
  }
}

/** 发布某个会场到点的事件；危机事件会暂停该会场时间 */
export async function publishDueEvents(conferenceId: string): Promise<void> {
  const db = getDb()
  const now = await getCurrentTime(conferenceId)
  const due = await db.execute({
    sql: 'SELECT id, is_crisis FROM events WHERE conference_id = ? AND published_at IS NULL AND event_time <= ?',
    args: [conferenceId, now],
  })

  for (const row of due.rows) {
    const eventId = String(row.id)
    const updated = await db.execute({
      sql: 'UPDATE events SET published_at = ? WHERE id = ? AND published_at IS NULL',
      args: [Date.now(), eventId],
    })
    if (updated.rowsAffected > 0) {
      if (Number(row.is_crisis) === 1) {
        await pauseForCrisis(conferenceId, eventId)
      }
      await sendEventPush(conferenceId, eventId)
    }
  }
}

export async function publishAllDueEvents(): Promise<void> {
  const result = await getDb().execute('SELECT id FROM conferences ORDER BY created_at ASC')
  for (const row of result.rows) {
    await publishDueEvents(String(row.id))
  }
}

async function getRecipients(eventId: string): Promise<EventRecipientView[]> {
  const result = await getDb().execute({
    sql: `SELECT r.account_id, COALESCE(er.read, r.read) AS read,
                 COALESCE(a.name, '已删除账号') AS name
          FROM event_recipients r
          LEFT JOIN event_reads er
            ON er.event_id = r.event_id AND er.account_id = r.account_id
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

async function getMyRead(eventId: string, accountId: string): Promise<boolean> {
  const result = await getDb().execute({
    sql: 'SELECT read FROM event_reads WHERE event_id = ? AND account_id = ? LIMIT 1',
    args: [eventId, accountId],
  })
  return Number(result.rows[0]?.read ?? 0) === 1
}

async function countAccounts(conferenceId: string): Promise<number> {
  const result = await getDb().execute({
    sql: 'SELECT COUNT(*) AS n FROM conference_members WHERE conference_id = ?',
    args: [conferenceId],
  })
  return Number(result.rows[0]?.n ?? 0)
}

async function countReads(eventId: string): Promise<number> {
  const result = await getDb().execute({
    sql: 'SELECT COUNT(*) AS n FROM event_reads WHERE event_id = ? AND read = 1',
    args: [eventId],
  })
  return Number(result.rows[0]?.n ?? 0)
}

async function isRecipient(eventId: string, accountId: string): Promise<boolean> {
  const result = await getDb().execute({
    sql: 'SELECT 1 AS ok FROM event_recipients WHERE event_id = ? AND account_id = ? LIMIT 1',
    args: [eventId, accountId],
  })
  return result.rows.length > 0
}

function baseEvent(
  row: EventRow,
): Omit<CouncilEvent, 'recipients' | 'read' | 'readCount' | 'recipientCount' | 'inAudience'> {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    eventTime: row.event_time,
    isCrisis: row.is_crisis === 1,
    isRealtime: row.is_realtime === 1,
    attachment: null,
    visibility: row.visibility === 'PUBLIC' ? 'PUBLIC' : 'SECRET',
    publishedAt: row.published_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

async function getAttachment(eventId: string) {
  const result = await getDb().execute({
    sql: 'SELECT id, filename, mime, size FROM event_attachments WHERE event_id = ? LIMIT 1',
    args: [eventId],
  })
  const row = result.rows[0]
  return row
    ? {
        id: String(row.id),
        filename: String(row.filename),
        mime: String(row.mime),
        size: Number(row.size),
      }
    : null
}

export async function listEventsForChair(
  user: SessionUser,
  conferenceId: string,
): Promise<CouncilEvent[]> {
  const result = await getDb().execute({
    sql: 'SELECT * FROM events WHERE conference_id = ? ORDER BY event_time DESC, created_at DESC',
    args: [conferenceId],
  })
  const totalAccounts = await countAccounts(conferenceId)
  const events: CouncilEvent[] = []
  for (const raw of result.rows) {
    const row = toEventRow(raw)
    const publicEvent = row.visibility === 'PUBLIC'
    const recipients = publicEvent ? [] : await getRecipients(row.id)
    const inAudience = publicEvent || (await isRecipient(row.id, user.id))
    const read = inAudience ? await getMyRead(row.id, user.id) : null
    const readCount = publicEvent
      ? await countReads(row.id)
      : recipients.filter((item) => item.read).length
    events.push({
      ...baseEvent(row),
      attachment: await getAttachment(row.id),
      recipients,
      inAudience,
      read,
      readCount,
      recipientCount: publicEvent ? totalAccounts : recipients.length,
    })
  }
  return events
}

export async function listEventsForDelegate(
  user: SessionUser,
  conferenceId: string,
): Promise<CouncilEvent[]> {
  const result = await getDb().execute({
    sql: `SELECT e.*, COALESCE(er.read, 0) AS my_read
          FROM events e
          LEFT JOIN event_reads er
            ON er.event_id = e.id AND er.account_id = ?
          WHERE e.conference_id = ? AND e.published_at IS NOT NULL
            AND (
              e.visibility = 'PUBLIC'
              OR EXISTS (
                SELECT 1 FROM event_recipients r
                WHERE r.event_id = e.id AND r.account_id = ?
              )
            )
          ORDER BY e.event_time DESC, e.created_at DESC`,
    args: [user.id, conferenceId, user.id],
  })

  const events: CouncilEvent[] = []
  for (const raw of result.rows) {
    const row = toEventRow(raw)
    events.push({
      ...baseEvent(row),
      attachment: await getAttachment(row.id),
      recipients: [],
      inAudience: true,
      read: Number(raw.my_read) === 1,
      readCount: Number(raw.my_read) === 1 ? 1 : 0,
      recipientCount: 0,
    })
  }
  return events
}

export async function listEvents(user: SessionUser): Promise<CouncilEvent[]> {
  return user.role === 'chair'
    ? listEventsForChair(user, user.conferenceId)
    : listEventsForDelegate(user, user.conferenceId)
}

export async function getEventForChair(
  user: SessionUser,
  eventId: string,
): Promise<CouncilEvent | null> {
  const result = await getDb().execute({
    sql: 'SELECT * FROM events WHERE id = ? AND conference_id = ? LIMIT 1',
    args: [eventId, user.conferenceId],
  })
  const raw = result.rows[0]
  if (!raw) return null
  const row = toEventRow(raw)
  const publicEvent = row.visibility === 'PUBLIC'
  const recipients = publicEvent ? [] : await getRecipients(row.id)
  const inAudience = publicEvent || (await isRecipient(row.id, user.id))
  const read = inAudience ? await getMyRead(row.id, user.id) : null
  const readCount = publicEvent
    ? await countReads(row.id)
    : recipients.filter((item) => item.read).length
  const totalAccounts = publicEvent ? await countAccounts(user.conferenceId) : recipients.length
  return {
    ...baseEvent(row),
    attachment: await getAttachment(row.id),
    recipients,
    inAudience,
    read,
    readCount,
    recipientCount: totalAccounts,
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
  const visibility: EventVisibility = input.isCrisis ? 'PUBLIC' : input.visibility
  await db.execute({
    sql: `INSERT INTO events
          (id, conference_id, title, content, event_time, is_crisis, is_realtime, visibility, published_at, created_at, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    args: [
      id,
      user.conferenceId,
      input.title,
      input.content,
      input.eventTime,
      input.isCrisis ? 1 : 0,
      input.isRealtime ? 1 : 0,
      visibility,
      createdAt,
      user.id,
    ],
  })
  if (visibility === 'SECRET') {
    await replaceRecipients(id, input.recipientIds)
  }
  await publishDueEvents(user.conferenceId)
  return id
}

export async function updateEvent(
  eventId: string,
  user: SessionUser,
  input: EventInput,
): Promise<boolean> {
  const db = getDb()
  const existing = await db.execute({
    sql: 'SELECT * FROM events WHERE id = ? AND conference_id = ? LIMIT 1',
    args: [eventId, user.conferenceId],
  })
  const raw = existing.rows[0]
  if (!raw) return false
  const row = toEventRow(raw)
  const visibility: EventVisibility = input.isCrisis ? 'PUBLIC' : input.visibility

  await db.execute({
    sql: `UPDATE events SET title = ?, content = ?, event_time = ?, is_crisis = ?,
            visibility = ?
          WHERE id = ? AND conference_id = ?`,
    args: [
      input.title,
      input.content,
      row.published_at ? row.event_time : input.eventTime,
      input.isCrisis ? 1 : 0,
      input.isRealtime ? 1 : 0,
      visibility,
      eventId,
      user.conferenceId,
    ],
  })
  if (visibility === 'SECRET') {
    await replaceRecipients(eventId, input.recipientIds)
  } else {
    await replaceRecipients(eventId, [])
  }

  if (row.published_at && !input.isCrisis) {
    await clearCrisisPause(user.conferenceId, eventId)
  }
  if (row.published_at && input.isCrisis) {
    await pauseForCrisis(user.conferenceId, eventId)
  }

  await publishDueEvents(user.conferenceId)
  return true
}

export async function deleteEvent(
  eventId: string,
  user: SessionUser,
): Promise<boolean> {
  const db = getDb()
  const existing = await db.execute({
    sql: 'SELECT id FROM events WHERE id = ? AND conference_id = ? LIMIT 1',
    args: [eventId, user.conferenceId],
  })
  if (existing.rows.length === 0) return false
  await db.execute({ sql: 'DELETE FROM event_recipients WHERE event_id = ?', args: [eventId] })
  await db.execute({ sql: 'DELETE FROM event_reads WHERE event_id = ?', args: [eventId] })
  await db.execute({ sql: 'DELETE FROM event_attachments WHERE event_id = ?', args: [eventId] })
  await db.execute({ sql: 'DELETE FROM events WHERE id = ?', args: [eventId] })
  await clearCrisisPause(user.conferenceId, eventId)
  return true
}

export async function setEventRead(
  user: SessionUser,
  eventId: string,
  read: boolean,
): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT visibility, published_at FROM events WHERE id = ? AND conference_id = ? LIMIT 1',
    args: [eventId, user.conferenceId],
  })
  const row = result.rows[0]
  if (!row || row.published_at === null) return false

  const publicEvent = row.visibility === 'PUBLIC'
  if (!publicEvent && !(await isRecipient(eventId, user.id))) return false

  await db.execute({
    sql: `INSERT INTO event_reads (event_id, account_id, read) VALUES (?, ?, ?)
          ON CONFLICT(event_id, account_id) DO UPDATE SET read = excluded.read`,
    args: [eventId, user.id, read ? 1 : 0],
  })
  if (!publicEvent) {
    await db.execute({
      sql: 'UPDATE event_recipients SET read = ? WHERE event_id = ? AND account_id = ?',
      args: [read ? 1 : 0, eventId, user.id],
    })
  }
  return true
}

export async function setEventAttachment(
  user: SessionUser,
  eventId: string,
  input: { filename: string; mime: string; size: number; bytes: Uint8Array },
): Promise<boolean> {
  if (user.role !== 'chair') return false
  const db = getDb()
  const event = await db.execute({
    sql: 'SELECT id FROM events WHERE id = ? AND conference_id = ? LIMIT 1',
    args: [eventId, user.conferenceId],
  })
  if (event.rows.length === 0) return false
  await db.execute({
    sql: 'DELETE FROM event_attachments WHERE event_id = ?',
    args: [eventId],
  })
  await db.execute({
    sql: `INSERT INTO event_attachments
          (id, event_id, conference_id, filename, mime, size, data)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      createId('att'),
      eventId,
      user.conferenceId,
      input.filename.slice(0, 200),
      input.mime,
      input.size,
      input.bytes,
    ],
  })
  return true
}

export async function getEventAttachmentForDownload(
  user: SessionUser,
  eventId: string,
): Promise<{ filename: string; mime: string; bytes: Uint8Array } | null> {
  const db = getDb()
  const event = await db.execute({
    sql: 'SELECT visibility, published_at FROM events WHERE id = ? AND conference_id = ? LIMIT 1',
    args: [eventId, user.conferenceId],
  })
  const eventRow = event.rows[0]
  if (!eventRow) return null
  if (user.role !== 'chair') {
    if (eventRow.published_at === null) return null
    const publicEvent = eventRow.visibility === 'PUBLIC'
    if (!publicEvent && !(await isRecipient(eventId, user.id))) return null
  }
  const result = await db.execute({
    sql: 'SELECT filename, mime, data FROM event_attachments WHERE event_id = ? LIMIT 1',
    args: [eventId],
  })
  const row = result.rows[0]
  if (!row) return null
  const data = row.data
  const bytes =
    data instanceof Uint8Array
      ? data
      : data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(Buffer.from(String(data), 'base64'))
  return { filename: String(row.filename), mime: String(row.mime), bytes }
}
