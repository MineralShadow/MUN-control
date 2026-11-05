import type { ConferenceState } from '../../src/types.ts'
import type { InStatement } from '@tursodatabase/serverless/compat'
import { createId } from '../../src/lib/id.ts'
import { normalizeState } from '../../src/state/storage.ts'
import { createInitialState } from '../../src/state/defaults.ts'
import {
  ALL_CATEGORY_IDS,
  normalizeCategories,
  type DataCategoryId,
} from '../../src/lib/dataCategories.ts'
import { getDb } from './db.ts'
import { getTimeState } from './time.ts'
import { loadMeeting } from './meeting.ts'

export interface ArchiveInfo {
  id: string
  name: string
  createdAt: number
  included: DataCategoryId[]
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
  isRealtime: boolean
  visibility: string
  publishedAt: number | null
  createdAt: number
  createdBy: string
  recipients: Array<{ accountId: string; read: boolean }>
  reads: Array<{ accountId: string; read: boolean }>
  attachment: { filename: string; mime: string; size: number; data: string } | null
}

interface ArchiveFile {
  id: string
  title: string
  filename: string
  mime: string
  size: number
  fileType: string
  scope: string
  delegationId: string | null
  coSign: boolean
  cosigners: Array<{ delegationId: string; confirmedAt: number | null; confirmedBy: string | null }>
  data: string
  submittedBy: string
  submittedAt: number
  read: boolean
}

interface ArchiveData {
  version: 2
  archivedAt: number
  conferenceName: string
  included: DataCategoryId[]
  conference: ConferenceState
  revision: number
  accounts: ArchiveAccount[]
  time: {
    nowMs: number
    rate: number
    running: boolean
    crisisPaused: boolean
    crisisEventId: string | null
  } | null
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
  const parsed = JSON.parse(text) as Record<string, unknown>
  const included = normalizeCategories(parsed.included ?? ALL_CATEGORY_IDS)
  return {
    ...(parsed as unknown as ArchiveData),
    version: 2,
    included: included.length > 0 ? included : [...ALL_CATEGORY_IDS],
  }
}

function trimmedState(
  state: ConferenceState,
  included: DataCategoryId[],
): ConferenceState {
  const base = createInitialState()
  const has = (id: DataCategoryId) => included.includes(id)
  return {
    ...state,
    theme: has('info') ? state.theme : base.theme,
    author: has('info') ? state.author : base.author,
    attendanceRule: has('info') ? state.attendanceRule : base.attendanceRule,
    voteMode: has('info') ? state.voteMode : base.voteMode,
    settings: has('info') ? state.settings : base.settings,
    delegations: has('seats') ? state.delegations : [],
    sessions: has('sessions') ? state.sessions : [],
    currentSessionId: has('sessions') ? state.currentSessionId : null,
    currentTopicId: has('sessions') ? state.currentTopicId : null,
    resolutions: has('sessions') ? state.resolutions : [],
    liveVote: has('sessions') ? state.liveVote : null,
    motionTypes: has('motions') ? state.motionTypes : createInitialState().motionTypes,
    activeMotion: has('motions') ? state.activeMotion : null,
    fileTypes: has('files') ? state.fileTypes : createInitialState().fileTypes,
  }
}

export async function listArchives(conferenceId: string): Promise<ArchiveInfo[]> {
  const result = await getDb().execute({
    sql: 'SELECT id, name, created_at, data FROM archives WHERE conference_id = ? ORDER BY created_at DESC',
    args: [conferenceId],
  })
  const archives: ArchiveInfo[] = []
  for (const row of result.rows) {
    try {
      const data = await readArchiveData(row.data)
      archives.push({
        id: String(row.id),
        name: String(row.name),
        createdAt: Number(row.created_at),
        included: data.included,
      })
    } catch {
      archives.push({
        id: String(row.id),
        name: String(row.name),
        createdAt: Number(row.created_at),
        included: [...ALL_CATEGORY_IDS],
      })
    }
  }
  return archives
}

export async function createArchive(
  conferenceId: string,
  nameRaw: string,
  includedRaw: unknown,
): Promise<ArchiveInfo> {
  const db = getDb()
  const included = normalizeCategories(includedRaw)
  const has = (id: DataCategoryId) => included.includes(id)
  const [meeting, conference, time, members, events, recipients, reads, attachments, files, fileCosigners] =
    await Promise.all([
      loadMeeting(conferenceId),
      db.execute({
        sql: 'SELECT id, name FROM conferences WHERE id = ? LIMIT 1',
        args: [conferenceId],
      }),
      has('time') ? getTimeState(conferenceId) : Promise.resolve(null),
      has('accounts')
        ? db.execute({
            sql: `SELECT a.id, a.username, a.password, a.name, a.created_at,
                         cm.role, cm.seat_id
                  FROM conference_members cm
                  JOIN accounts a ON a.id = cm.account_id
                  WHERE cm.conference_id = ?
                  ORDER BY a.created_at ASC`,
            args: [conferenceId],
          })
        : Promise.resolve({ rows: [] }),
      has('events')
        ? db.execute({
            sql: 'SELECT * FROM events WHERE conference_id = ? ORDER BY created_at ASC',
            args: [conferenceId],
          })
        : Promise.resolve({ rows: [] }),
      has('events')
        ? db.execute({
            sql: `SELECT r.event_id, r.account_id, r.read
                  FROM event_recipients r
                  JOIN events e ON e.id = r.event_id
                  WHERE e.conference_id = ?`,
            args: [conferenceId],
          })
        : Promise.resolve({ rows: [] }),
      has('events')
        ? db.execute({
            sql: `SELECT er.event_id, er.account_id, er.read
                  FROM event_reads er
                  JOIN events e ON e.id = er.event_id
                  WHERE e.conference_id = ?`,
            args: [conferenceId],
          })
        : Promise.resolve({ rows: [] }),
      has('events')
        ? db.execute({
            sql: `SELECT a.* FROM event_attachments a
                  JOIN events e ON e.id = a.event_id
                  WHERE e.conference_id = ?`,
            args: [conferenceId],
          })
        : Promise.resolve({ rows: [] }),
      has('files')
        ? db.execute({
            sql: 'SELECT * FROM files WHERE conference_id = ? ORDER BY submitted_at ASC',
            args: [conferenceId],
          })
        : Promise.resolve({ rows: [] }),
      has('files')
        ? db.execute({
            sql: 'SELECT * FROM file_cosigners WHERE conference_id = ?',
            args: [conferenceId],
          })
        : Promise.resolve({ rows: [] }),
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
    version: 2,
    archivedAt: Date.now(),
    conferenceName: String(conference.rows[0]?.name ?? meeting.state.theme),
    included,
    conference: trimmedState(meeting.state, included),
    revision: meeting.revision,
    accounts: members.rows.map((row) => ({
      id: String(row.id),
      username: String(row.username),
      password: String(row.password),
      name: String(row.name),
      role: String(row.role) === 'chair' ? 'chair' : 'delegate',
      seatId: has('seats') && row.seat_id ? String(row.seat_id) : null,
      createdAt: Number(row.created_at),
    })),
    time: time
      ? {
          nowMs: time.currentMs,
          rate: time.rate,
          running: time.running,
          crisisPaused: time.crisisPaused,
          crisisEventId: time.crisisEventId,
        }
      : null,
    events: events.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      content: String(row.content),
      eventTime: Number(row.event_time),
      isCrisis: Number(row.is_crisis) === 1,
      isRealtime: Number(row.is_realtime ?? 0) === 1,
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
      attachment: (() => {
        const att = attachments.rows.find((item) => String(item.event_id) === String(row.id))
        return att
          ? {
              filename: String(att.filename),
              mime: String(att.mime),
              size: Number(att.size),
              data: bytesToBase64(att.data),
            }
          : null
      })(),
    })),
    files: files.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      filename: String(row.filename),
      mime: String(row.mime),
      size: Number(row.size),
      fileType: String(row.file_type ?? '其他'),
      scope: String(row.scope ?? 'DELEGATION'),
      delegationId: row.delegation_id ? String(row.delegation_id) : null,
      coSign: Number(row.co_sign ?? 0) === 1,
      cosigners: fileCosigners.rows
        .filter((item) => String(item.file_id) === String(row.id))
        .map((item) => ({
          delegationId: String(item.delegation_id),
          confirmedAt: item.confirmed_at === null ? null : Number(item.confirmed_at),
          confirmedBy: item.confirmed_by ? String(item.confirmed_by) : null,
        })),
      data: bytesToBase64(row.data),
      submittedBy: String(row.submitted_by),
      submittedAt: Number(row.submitted_at),
      read: Number(row.read) === 1,
    })),
  }

  const id = createId('arc')
  const name =
    nameRaw.trim().slice(0, 80) ||
    `${data.conferenceName || '会场'} · ${new Date().toLocaleString('zh-CN')}`
  const createdAt = Date.now()
  await db.execute({
    sql: 'INSERT INTO archives (id, conference_id, name, created_at, data) VALUES (?, ?, ?, ?, ?)',
    args: [id, conferenceId, name, createdAt, new TextEncoder().encode(JSON.stringify(data))],
  })
  return { id, name, createdAt, included }
}

export async function deleteArchive(
  conferenceId: string,
  id: string,
): Promise<boolean> {
  const result = await getDb().execute({
    sql: 'DELETE FROM archives WHERE id = ? AND conference_id = ?',
    args: [id, conferenceId],
  })
  return result.rowsAffected > 0
}

export async function restoreArchive(
  conferenceId: string,
  id: string,
): Promise<void> {
  const db = getDb()
  const found = await db.execute({
    sql: 'SELECT data FROM archives WHERE id = ? AND conference_id = ? LIMIT 1',
    args: [id, conferenceId],
  })
  const row = found.rows[0]
  if (!row) throw new Error('存档不存在')

  const data = await readArchiveData(row.data)
  const included = data.included
  const has = (category: DataCategoryId) => included.includes(category)
  const current = await loadMeeting(conferenceId)
  const currentState = current.state
  const archivedState = normalizeState(data.conference) ?? createInitialState()
  const nextState: ConferenceState = {
    ...currentState,
    ...(has('info')
      ? {
          theme: archivedState.theme,
          author: archivedState.author,
          attendanceRule: archivedState.attendanceRule,
          voteMode: archivedState.voteMode,
          settings: archivedState.settings,
        }
      : {}),
    ...(has('seats') ? { delegations: archivedState.delegations } : {}),
    ...(has('sessions')
      ? {
          liveVote: archivedState.liveVote,
          sessions: archivedState.sessions,
          currentSessionId: archivedState.currentSessionId,
          currentTopicId: archivedState.currentTopicId,
          resolutions: archivedState.resolutions,
        }
      : {}),
    ...(has('motions')
      ? {
          motionTypes: archivedState.motionTypes,
          activeMotion: archivedState.activeMotion,
        }
      : {}),
    ...(has('files') ? { fileTypes: archivedState.fileTypes } : {}),
    updatedAt: Date.now(),
  }
  const revision = current.revision + 1
  const now = Date.now()

  const statements: InStatement[] = [
    {
      sql: `UPDATE conference_meeting SET state = ?, revision = ?, updated_at = ?
            WHERE conference_id = ?`,
      args: [JSON.stringify(nextState), revision, now, conferenceId],
    },
  ]
  if (has('info')) {
    statements.push({
      sql: 'UPDATE conferences SET name = ? WHERE id = ?',
      args: [nextState.theme.slice(0, 80) || '会场', conferenceId],
    })
  }
  if (has('time') && data.time) {
    statements.push(
      { sql: 'DELETE FROM conference_time WHERE conference_id = ?', args: [conferenceId] },
      {
        sql: `INSERT INTO conference_time
              (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          conferenceId,
          data.time.nowMs,
          data.time.rate,
          data.time.running ? 1 : 0,
          now,
          data.time.crisisPaused ? 1 : 0,
          data.time.crisisEventId,
          now,
        ],
      },
    )
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
    for (const event of data.events) {
      statements.push({
        sql: `INSERT INTO events
              (id, conference_id, title, content, event_time, is_crisis, is_realtime, visibility, published_at, created_at, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          event.id,
          conferenceId,
          event.title,
          event.content,
          event.eventTime,
          event.isCrisis ? 1 : 0,
          event.isRealtime ? 1 : 0,
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
      if (event.attachment) {
        statements.push({
          sql: `INSERT INTO event_attachments
                (id, event_id, conference_id, filename, mime, size, data)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            createId('att'),
            event.id,
            conferenceId,
            event.attachment.filename,
            event.attachment.mime,
            event.attachment.size,
            base64ToBytes(event.attachment.data),
          ],
        })
      }
    }
  }
  if (has('files')) {
    statements.push({
      sql: 'DELETE FROM file_cosigners WHERE conference_id = ?',
      args: [conferenceId],
    })
    statements.push({
      sql: 'DELETE FROM files WHERE conference_id = ?',
      args: [conferenceId],
    })
    for (const file of data.files) {
      statements.push({
        sql: `INSERT INTO files
              (id, conference_id, title, filename, mime, size, file_type, scope, delegation_id, co_sign, data, submitted_by, submitted_at, read)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          file.id,
          conferenceId,
          file.title,
          file.filename,
          file.mime,
          file.size,
          file.fileType ?? '其他',
          file.scope ?? 'DELEGATION',
          file.delegationId ?? null,
          file.coSign ? 1 : 0,
          base64ToBytes(file.data),
          file.submittedBy,
          file.submittedAt,
          file.read ? 1 : 0,
        ],
      })
      for (const cosigner of file.cosigners ?? []) {
        statements.push({
          sql: `INSERT INTO file_cosigners
                (file_id, conference_id, delegation_id, confirmed_at, confirmed_by)
                VALUES (?, ?, ?, ?, ?)`,
          args: [
            file.id,
            conferenceId,
            cosigner.delegationId,
            cosigner.confirmedAt,
            cosigner.confirmedBy,
          ],
        })
      }
    }
  }
  if (has('accounts')) {
    statements.push(
      { sql: 'DELETE FROM conference_members WHERE conference_id = ?', args: [conferenceId] },
      { sql: 'DELETE FROM sessions WHERE conference_id = ?', args: [conferenceId] },
    )
    for (const account of data.accounts) {
      statements.push({
        sql: `INSERT INTO accounts (id, username, password, name, role, created_at)
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                username = excluded.username,
                password = excluded.password,
                name = excluded.name,
                role = excluded.role,
                created_at = excluded.created_at`,
        args: [
          account.id,
          account.username,
          account.password,
          account.name,
          account.role,
          account.createdAt,
        ],
      })
      statements.push({
        sql: `INSERT INTO conference_members
              (conference_id, account_id, role, seat_id, created_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          conferenceId,
          account.id,
          account.role,
          has('seats') ? account.seatId : null,
          account.createdAt,
        ],
      })
    }
  }

  await db.batch(statements)
}
