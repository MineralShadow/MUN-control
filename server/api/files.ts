import type { SessionUser, SubmittedFile } from '../../src/types.ts'
import { createId } from '../../src/lib/id.ts'
import { getDb } from './db.ts'

interface FileRow {
  id: string
  title: string
  filename: string
  mime: string
  size: number
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
    submittedAt: Number(row.submitted_at),
    submittedById: String(row.submitted_by),
    submittedByName: row.submitted_name ? String(row.submitted_name) : '已删除账号',
    read: Number(row.read) === 1,
  }
}

export async function listFiles(user: SessionUser): Promise<SubmittedFile[]> {
  const db = getDb()
  const sql = user.role === 'chair'
    ? `SELECT f.*, a.name AS submitted_name
       FROM files f LEFT JOIN accounts a ON a.id = f.submitted_by
       ORDER BY f.submitted_at DESC`
    : `SELECT f.*, a.name AS submitted_name
       FROM files f LEFT JOIN accounts a ON a.id = f.submitted_by
       WHERE f.submitted_by = ?
       ORDER BY f.submitted_at DESC`

  const result = await db.execute(
    user.role === 'chair' ? { sql } : { sql, args: [user.id] },
  )
  return result.rows.map((row) => toFile(row))
}

export interface UploadFileInput {
  title: string
  filename: string
  mime: string
  size: number
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
          (id, title, filename, mime, size, data, submitted_by, submitted_at, read)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    args: [
      id,
      input.title,
      input.filename,
      input.mime,
      input.size,
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
          WHERE f.id = ? LIMIT 1`,
    args: [fileId],
  })
  const row = result.rows[0]
  if (!row) return null
  const file = toFile(row)
  if (user.role !== 'chair' && file.submittedById !== user.id) return null

  const dataResult = await db.execute({
    sql: 'SELECT data FROM files WHERE id = ? LIMIT 1',
    args: [fileId],
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
    sql: 'SELECT id FROM files WHERE id = ? LIMIT 1',
    args: [fileId],
  })
  if (result.rows.length === 0) return false
  await db.execute({
    sql: 'UPDATE files SET read = ? WHERE id = ?',
    args: [read ? 1 : 0, fileId],
  })
  return true
}
