import type { ConferenceState } from '../../src/types.ts'
import type { InStatement } from '@tursodatabase/serverless/compat'
import { createId } from '../../src/lib/id.ts'
import { normalizeState } from '../../src/state/storage.ts'
import { createInitialState } from '../../src/state/defaults.ts'
import { getDb } from './db.ts'
import { getTimeState } from './time.ts'
import { loadMeeting } from './meeting.ts'

export interface ArchiveInfo {
  id: string
  name: string
  createdAt: number
}

interface ArchiveAccount {
  id: string
  username: string
  password: string
  name: string
  role: string
  seatId: string | null
  createdAt: number
}

interface ArchiveEvent {
  id: string
  title: string
  content: string
  eventTime: number
  isCrisis: boolean
  visibility: string
  publishedAt: number | null
  createdAt: number
  createdBy: string
  recipients: Array<{ accountId: string; read: boolean }>
  reads: Array<{ accountId: string; read: boolean }>
}

interface ArchiveFile {
  id: string
  title: string
  filename: string
  mime: string
  size: number
  data: string
  submittedBy: string
  submittedAt: number
  read: boolean
}

interface ArchiveData {
  version: 1
  archivedAt: number
  conference: ConferenceState
  revision: number
  accounts: ArchiveAccount[]
  time: {
    nowMs: number
    rate: number
    running: boolean
    crisisPaused: boolean
    crisisEventId: string | null
  }
  events: ArchiveEvent[]
  files: ArchiveFile[]
}

function bytesToBase64(value: unknown): string {
  const bytes =
    value instanceof Uint8Array
      ? value
      : value instanceof ArrayBuffer
        ? new Uint8Array(value)
        : new Uint8Array()
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function readArchiveData(value: unknown): Promise<ArchiveData> {
  let text = ''
  if (value instanceof Uint8Array) {
    text = new TextDecoder().decode(value)
  } else if (value instanceof ArrayBuffer) {
    text = new TextDecoder().decode(new Uint8Array(value))
  } else if (typeof value === 'string') {
    text = value
  }
  const parsed = JSON.parse(text) as ArchiveData
  if (!parsed || parsed.version !== 1) throw new Error('存档格式不受支持')
  return parsed
}

export async function listArchives(): Promise<ArchiveInfo[]> {
  const result = await getDb().execute(
    'SELECT id, name, created_at FROM archives ORDER BY created_at DESC',
  )
  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    createdAt: Number(row.created_at),
  }))
}

export async function createArchive(nameRaw?: string): Promise<ArchiveInfo> {
  const db = getDb()
  const [meeting, time, accounts, events, recipients, reads, files] = await Promise.all([
    loadMeeting(),
    getTimeState(),
    db.execute('SELECT id, username, password, name, role, seat_id, created_at FROM accounts ORDER BY created_at ASC'),
    db.execute('SELECT * FROM events ORDER BY created_at ASC'),
    db.execute('SELECT event_id, account_id, read FROM event_recipients'),
    db.execute('SELECT event_id, account_id, read FROM event_reads'),
    db.execute('SELECT * FROM files ORDER BY submitted_at ASC'),
  ])

  const recipientRows = recipients.rows.map((row) => ({
    eventId: String(row.event_id),
    accountId: String(row.account_id),
    read: Number(row.read) === 1,
  }))
  const readRows = reads.rows.map((row) => ({
    eventId: String(row.event_id),
    accountId: String(row.account_id),
    read: Number(row.read) === 1,
  }))

  const data: ArchiveData = {
    version: 1,
    archivedAt: Date.now(),
    conference: meeting.state,
    revision: meeting.revision,
    accounts: accounts.rows.map((row) => ({
      id: String(row.id),
      username: String(row.username),
      password: String(row.password),
      name: String(row.name),
      role: String(row.role),
      seatId: row.seat_id ? String(row.seat_id) : null,
      createdAt: Number(row.created_at),
    })),
    time: {
      nowMs: time.currentMs,
      rate: time.rate,
      running: time.running,
      crisisPaused: time.crisisPaused,
      crisisEventId: time.crisisEventId,
    },
    events: events.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      content: String(row.content),
      eventTime: Number(row.event_time),
      isCrisis: Number(row.is_crisis) === 1,
      visibility: String(row.visibility ?? 'SECRET'),
      publishedAt: row.published_at === null ? null : Number(row.published_at),
      createdAt: Number(row.created_at),
      createdBy: String(row.created_by),
      recipients: recipientRows
        .filter((item) => item.eventId === String(row.id))
        .map((item) => ({ accountId: item.accountId, read: item.read })),
      reads: readRows
        .filter((item) => item.eventId === String(row.id))
        .map((item) => ({ accountId: item.accountId, read: item.read })),
    })),
    files: files.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      filename: String(row.filename),
      mime: String(row.mime),
      size: Number(row.size),
      data: bytesToBase64(row.data),
      submittedBy: String(row.submitted_by),
      submittedAt: Number(row.submitted_at),
      read: Number(row.read) === 1,
    })),
  }

  const id = createId('arc')
  const name =
    (nameRaw ?? '').trim().slice(0, 80) ||
    `${meeting.state.theme || '会场'} · ${new Date().toLocaleString('zh-CN')}`
  const createdAt = Date.now()
  const encoded = new TextEncoder().encode(JSON.stringify(data))
  await db.execute({
    sql: 'INSERT INTO archives (id, name, created_at, data) VALUES (?, ?, ?, ?)',
    args: [id, name, createdAt, encoded],
  })
  return { id, name, createdAt }
}

export async function deleteArchive(id: string): Promise<boolean> {
  const db = getDb()
  const result = await db.execute('DELETE FROM archives WHERE id = ?', [id])
  return result.rowsAffected > 0
}

export async function restoreArchive(id: string): Promise<void> {
  const db = getDb()
  const found = await db.execute({
    sql: 'SELECT data FROM archives WHERE id = ? LIMIT 1',
    args: [id],
  })
  const row = found.rows[0]
  if (!row) throw new Error('存档不存在')

  const data = await readArchiveData(row.data)
  const state = normalizeState(data.conference) ?? createInitialState()
  const current = await loadMeeting()
  const revision = current.revision + 1
  const now = Date.now()

  const statements: InStatement[] = [
    { sql: 'DELETE FROM event_recipients' },
    { sql: 'DELETE FROM event_reads' },
    { sql: 'DELETE FROM events' },
    { sql: 'DELETE FROM files' },
    { sql: 'DELETE FROM accounts' },
    { sql: 'DELETE FROM sessions' },
    { sql: 'DELETE FROM meeting' },
    { sql: 'DELETE FROM time_state' },
    {
      sql: `INSERT INTO meeting (id, state, revision, updated_at) VALUES (1, ?, ?, ?)`,
      args: [JSON.stringify(state), revision, now],
    },
    {
      sql: `INSERT INTO time_state
            (id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.time.nowMs,
        data.time.rate,
        data.time.running ? 1 : 0,
        now,
        data.time.crisisPaused ? 1 : 0,
        data.time.crisisEventId,
        now,
      ],
    },
  ]

  for (const account of data.accounts) {
    statements.push({
      sql: `INSERT INTO accounts (id, username, password, name, role, seat_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        account.id,
        account.username,
        account.password,
        account.name,
        account.role,
        account.seatId,
        account.createdAt,
      ],
    })
  }

  for (const event of data.events) {
    statements.push({
      sql: `INSERT INTO events
            (id, title, content, event_time, is_crisis, visibility, published_at, created_at, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        event.id,
        event.title,
        event.content,
        event.eventTime,
        event.isCrisis ? 1 : 0,
        event.visibility,
        event.publishedAt,
        event.createdAt,
        event.createdBy,
      ],
    })
    for (const recipient of event.recipients) {
      statements.push({
        sql: 'INSERT INTO event_recipients (event_id, account_id, read) VALUES (?, ?, ?)',
        args: [event.id, recipient.accountId, recipient.read ? 1 : 0],
      })
    }
    for (const read of event.reads) {
      statements.push({
        sql: 'INSERT INTO event_reads (event_id, account_id, read) VALUES (?, ?, ?)',
        args: [event.id, read.accountId, read.read ? 1 : 0],
      })
    }
  }

  for (const file of data.files) {
    statements.push({
      sql: `INSERT INTO files
            (id, title, filename, mime, size, data, submitted_by, submitted_at, read)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        file.id,
        file.title,
        file.filename,
        file.mime,
        file.size,
        base64ToBytes(file.data),
        file.submittedBy,
        file.submittedAt,
        file.read ? 1 : 0,
      ],
    })
  }

  await db.batch(statements)
}
