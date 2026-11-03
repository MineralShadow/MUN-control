import type { SessionUser, SubmittedFile } from '../../src/types.ts'
import { createId } from '../../src/lib/id.ts'
import { getDb } from './db.ts'
import { loadMeeting } from './meeting.ts'

interface FileRow {
  id: string
  title: string
  filename: string
  mime: string
  size: number
  file_type: string
  scope: string
  delegation_id: string | null
  co_sign: number
  submitted_by: string
  submitted_at: number
  read: number
  submitted_name: string | null
}

function toFile(row: Record<string, unknown>): SubmittedFile {
  return {
    id: String(row.id),
    title: String(row.title),
    filename: String(row.filename),
    mime: String(row.mime),
    size: Number(row.size),
    fileType: String(row.file_type ?? '其他'),
    scope: row.scope === 'PERSONAL' ? 'PERSONAL' : 'DELEGATION',
    delegationId: row.delegation_id ? String(row.delegation_id) : null,
    delegationName: row.delegation_name ? String(row.delegation_name) : null,
    coSign: Number(row.co_sign ?? 0) === 1,
    submittedAt: Number(row.submitted_at),
    submittedById: String(row.submitted_by),
    submittedByName: row.submitted_name ? String(row.submitted_name) : '已删除账号',
    read: Number(row.read) === 1,
  }
}

export async function getMyDelegationId(user: SessionUser): Promise<string | null> {
  if (user.role === 'chair') return null
  const member = await getDb().execute({
    sql: 'SELECT seat_id FROM conference_members WHERE conference_id = ? AND account_id = ? LIMIT 1',
    args: [user.conferenceId, user.id],
  })
  const seatId = member.rows[0]?.seat_id ? String(member.rows[0].seat_id) : null
  if (!seatId) return null
  const meeting = await loadMeeting(user.conferenceId)
  return (
    meeting.state.delegations.find((delegation) =>
      delegation.seats.some((seat) => seat.id === seatId),
    )?.id ?? null
  )
}

export async function listFiles(user: SessionUser): Promise<SubmittedFile[]> {
  const db = getDb()
  const meeting = await loadMeeting(user.conferenceId)
  const delegationNames = new Map(
    meeting.state.delegations.map((delegation) => [delegation.id, delegation.name]),
  )
  let result
  if (user.role === 'chair') {
    result = await db.execute({
      sql: `SELECT f.*, a.name AS submitted_name
            FROM files f LEFT JOIN accounts a ON a.id = f.submitted_by
            WHERE f.conference_id = ?
            ORDER BY f.submitted_at DESC`,
      args: [user.conferenceId],
    })
  } else {
    const delegationId = await getMyDelegationId(user)
    result = await db.execute({
      sql: `SELECT f.*, a.name AS submitted_name
            FROM files f LEFT JOIN accounts a ON a.id = f.submitted_by
            WHERE f.conference_id = ?
              AND (f.submitted_by = ? OR (f.scope = 'DELEGATION' AND f.delegation_id = ?))
            ORDER BY f.submitted_at DESC`,
      args: [user.conferenceId, user.id, delegationId],
    })
  }
  return result.rows.map((row) => {
    const file = toFile({ ...row, delegation_name: row.delegation_id ? delegationNames.get(String(row.delegation_id)) ?? null : null })
    return file
  })
}

export interface UploadFileInput {
  title: string
  filename: string
  mime: string
  size: number
  fileType: string
  scope: 'PERSONAL' | 'DELEGATION'
  delegationId: string | null
  coSign: boolean
  bytes: Uint8Array
}

export async function createFile(
  user: SessionUser,
  input: UploadFileInput,
): Promise<string> {
  const db = getDb()
  const id = createId('file')
  await db.execute({
    sql: `INSERT INTO files
          (id, conference_id, title, filename, mime, size, file_type, scope, delegation_id, co_sign, data, submitted_by, submitted_at, read)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    args: [
      id,
      user.conferenceId,
      input.title,
      input.filename,
      input.mime,
      input.size,
      input.fileType,
      input.scope,
      input.delegationId,
      input.coSign ? 1 : 0,
      input.bytes,
      user.id,
      Date.now(),
    ],
  })
  return id
}

export async function getFileForDownload(
  user: SessionUser,
  fileId: string,
): Promise<{ file: SubmittedFile; bytes: Uint8Array } | null> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT f.*, a.name AS submitted_name
          FROM files f LEFT JOIN accounts a ON a.id = f.submitted_by
          WHERE f.id = ? AND f.conference_id = ? LIMIT 1`,
    args: [fileId, user.conferenceId],
  })
  const row = result.rows[0]
  if (!row) return null
  const file = toFile(row)
  if (user.role !== 'chair' && file.submittedById !== user.id) {
    const delegationId = await getMyDelegationId(user)
    if (file.scope !== 'DELEGATION' || !delegationId || file.delegationId !== delegationId) {
      return null
    }
  }

  const dataResult = await db.execute({
    sql: 'SELECT data FROM files WHERE id = ? AND conference_id = ? LIMIT 1',
    args: [fileId, user.conferenceId],
  })
  const data = dataResult.rows[0]?.data
  if (!data) return null

  const bytes =
    data instanceof Uint8Array
      ? data
      : data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(Buffer.from(String(data), 'base64'))

  return { file, bytes }
}

export async function setFileRead(
  user: SessionUser,
  fileId: string,
  read: boolean,
): Promise<boolean> {
  if (user.role !== 'chair') return false
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT id FROM files WHERE id = ? AND conference_id = ? LIMIT 1',
    args: [fileId, user.conferenceId],
  })
  if (result.rows.length === 0) return false
  await db.execute({
    sql: 'UPDATE files SET read = ? WHERE id = ? AND conference_id = ?',
    args: [read ? 1 : 0, fileId, user.conferenceId],
  })
  return true
}
