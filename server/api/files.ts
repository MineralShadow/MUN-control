import type { FileCosigner, SessionUser, SubmittedFile } from '../../src/types.ts'
import { createId } from '../../src/lib/id.ts'
import { getDb } from './db.ts'
import { loadMeeting } from './meeting.ts'

interface FileRow {
  id: string
  conference_id: string
  title: string
  filename: string
  mime: string
  size: number
  file_type_id: string | null
  file_type: string
  text_content: string
  scope: string
  delegation_id: string | null
  co_sign: number
  submitted_by: string
  submitted_at: number
  read: number
  submitted_name: string | null
}

interface MyMembershipInfo {
  delegationId: string
  delegationName: string
  seatId: string
  isHead: boolean
}

async function getMyMembershipInfo(user: SessionUser): Promise<MyMembershipInfo | null> {
  if (user.role === 'chair') return null
  const member = await getDb().execute({
    sql: 'SELECT seat_id FROM conference_members WHERE conference_id = ? AND account_id = ? LIMIT 1',
    args: [user.conferenceId, user.id],
  })
  const seatId = member.rows[0]?.seat_id ? String(member.rows[0].seat_id) : null
  if (!seatId) return null
  const meeting = await loadMeeting(user.conferenceId)
  for (const delegation of meeting.state.delegations) {
    if (delegation.seats.some((seat) => seat.id === seatId)) {
      return {
        delegationId: delegation.id,
        delegationName: delegation.name,
        seatId,
        isHead: delegation.headSeatId === seatId,
      }
    }
  }
  return null
}

export async function getMyDelegationId(user: SessionUser): Promise<string | null> {
  return (await getMyMembershipInfo(user))?.delegationId ?? null
}

async function getCosigners(
  fileId: string,
  delegationNames: Map<string, string>,
): Promise<FileCosigner[]> {
  const result = await getDb().execute({
    sql: `SELECT fc.delegation_id, fc.confirmed_at, a.name AS confirmed_name
          FROM file_cosigners fc
          LEFT JOIN accounts a ON a.id = fc.confirmed_by
          WHERE fc.file_id = ?
          ORDER BY fc.delegation_id ASC`,
    args: [fileId],
  })
  return result.rows.map((row) => ({
    delegationId: String(row.delegation_id),
    delegationName: delegationNames.get(String(row.delegation_id)) ?? '已删除代表团',
    confirmedAt: row.confirmed_at === null ? null : Number(row.confirmed_at),
    confirmedByName: row.confirmed_name ? String(row.confirmed_name) : null,
  }))
}

function toFile(
  row: Record<string, unknown>,
  cosigners: FileCosigner[],
  myMembership: MyMembershipInfo | null,
  isChair: boolean,
): SubmittedFile {
  const mine = myMembership
    ? cosigners.find((item) => item.delegationId === myMembership.delegationId)
    : undefined
  return {
    id: String(row.id),
    title: String(row.title),
    filename: String(row.filename),
    mime: String(row.mime),
    size: Number(row.size),
    fileTypeId: row.file_type_id ? String(row.file_type_id) : null,
    fileType: String(row.file_type ?? '其他'),
    textContent: String(row.text_content ?? ''),
    scope: row.scope === 'PERSONAL' ? 'PERSONAL' : 'DELEGATION',
    delegationId: row.delegation_id ? String(row.delegation_id) : null,
    delegationName: row.delegation_name ? String(row.delegation_name) : null,
    coSign: Number(row.co_sign ?? 0) === 1,
    cosigners,
    myConfirmation: mine
      ? mine.confirmedAt
        ? 'CONFIRMED'
        : 'PENDING'
      : null,
    canConfirm: Boolean(
      mine && myMembership?.isHead && !mine.confirmedAt && !isChair,
    ),
    submittedAt: Number(row.submitted_at),
    submittedById: String(row.submitted_by),
    submittedByName: row.submitted_name ? String(row.submitted_name) : '已删除账号',
    read: Number(row.read) === 1,
  }
}

export async function listFiles(user: SessionUser): Promise<SubmittedFile[]> {
  const db = getDb()
  const meeting = await loadMeeting(user.conferenceId)
  const delegationNames = new Map(
    meeting.state.delegations.map((delegation) => [delegation.id, delegation.name]),
  )
  const myMembership = await getMyMembershipInfo(user)
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
    result = await db.execute({
      sql: `SELECT f.*, a.name AS submitted_name
            FROM files f LEFT JOIN accounts a ON a.id = f.submitted_by
            WHERE f.conference_id = ?
              AND (
                f.submitted_by = ?
                OR (f.scope = 'DELEGATION' AND f.delegation_id = ?)
                OR EXISTS (
                  SELECT 1 FROM file_cosigners fc
                  WHERE fc.file_id = f.id AND fc.delegation_id = ?
                )
              )
            ORDER BY f.submitted_at DESC`,
      args: [
        user.conferenceId,
        user.id,
        myMembership?.delegationId ?? '',
        myMembership?.delegationId ?? '',
      ],
    })
  }

  const files: SubmittedFile[] = []
  for (const row of result.rows) {
    const cosigners = await getCosigners(String(row.id), delegationNames)
    files.push(
      toFile(
        {
          ...row,
          delegation_name: row.delegation_id
            ? delegationNames.get(String(row.delegation_id)) ?? null
            : null,
        },
        cosigners,
        myMembership,
        user.role === 'chair',
      ),
    )
  }
  return files
}

export interface UploadFileInput {
  title: string
  filename: string
  mime: string
  size: number
  fileTypeId: string | null
  fileType: string
  textContent: string
  scope: 'PERSONAL' | 'DELEGATION'
  delegationId: string | null
  coSign: boolean
  cosignerDelegationIds: string[]
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
          (id, conference_id, title, filename, mime, size, file_type_id, file_type,
           text_content, scope, delegation_id, co_sign, data, submitted_by, submitted_at, read)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    args: [
      id,
      user.conferenceId,
      input.title,
      input.filename,
      input.mime,
      input.size,
      input.fileTypeId,
      input.fileType,
      input.textContent,
      input.scope,
      input.delegationId,
      input.coSign ? 1 : 0,
      input.bytes,
      user.id,
      Date.now(),
    ],
  })
  for (const delegationId of input.cosignerDelegationIds) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO file_cosigners
            (file_id, conference_id, delegation_id, confirmed_at, confirmed_by)
            VALUES (?, ?, ?, NULL, NULL)`,
      args: [id, user.conferenceId, delegationId],
    })
  }
  return id
}

export async function getFileForDownload(
  user: SessionUser,
  fileId: string,
): Promise<{ file: SubmittedFile; bytes: Uint8Array } | null> {
  const db = getDb()
  const meeting = await loadMeeting(user.conferenceId)
  const delegationNames = new Map(
    meeting.state.delegations.map((delegation) => [delegation.id, delegation.name]),
  )
  const result = await db.execute({
    sql: `SELECT f.*, a.name AS submitted_name
          FROM files f LEFT JOIN accounts a ON a.id = f.submitted_by
          WHERE f.id = ? AND f.conference_id = ? LIMIT 1`,
    args: [fileId, user.conferenceId],
  })
  const row = result.rows[0]
  if (!row) return null

  const myMembership = await getMyMembershipInfo(user)
  const allowed =
    user.role === 'chair' ||
    String(row.submitted_by) === user.id ||
    (String(row.scope) === 'DELEGATION' &&
      (String(row.delegation_id) === myMembership?.delegationId ||
        Boolean(
          myMembership &&
            (
              await db.execute({
                sql: 'SELECT 1 AS ok FROM file_cosigners WHERE file_id = ? AND delegation_id = ? LIMIT 1',
                args: [fileId, myMembership.delegationId],
              })
            ).rows.length,
        )))
  if (!allowed) return null

  const cosigners = await getCosigners(fileId, delegationNames)
  const file = toFile(
    {
      ...row,
      delegation_name: row.delegation_id
        ? delegationNames.get(String(row.delegation_id)) ?? null
        : null,
    },
    cosigners,
    myMembership,
    user.role === 'chair',
  )

  const dataResult = await db.execute({
    sql: 'SELECT data FROM files WHERE id = ? AND conference_id = ? LIMIT 1',
    args: [fileId, user.conferenceId],
  })
  const data = dataResult.rows[0]?.data
  if (!data) return { file, bytes: new Uint8Array() }
  const bytes =
    data instanceof Uint8Array
      ? data
      : data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(Buffer.from(String(data), 'base64'))
  return { file, bytes }
}

export async function confirmFile(
  user: SessionUser,
  fileId: string,
): Promise<boolean> {
  const membership = await getMyMembershipInfo(user)
  if (!membership?.isHead) return false
  const db = getDb()
  const row = await db.execute({
    sql: `SELECT 1 AS ok FROM file_cosigners
          WHERE file_id = ? AND conference_id = ? AND delegation_id = ?
          LIMIT 1`,
    args: [fileId, user.conferenceId, membership.delegationId],
  })
  if (row.rows.length === 0) return false
  await db.execute({
    sql: `UPDATE file_cosigners SET confirmed_at = ?, confirmed_by = ?
          WHERE file_id = ? AND delegation_id = ?`,
    args: [Date.now(), user.id, fileId, membership.delegationId],
  })
  return true
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

export async function getCosignerHeadAccountIds(
  user: SessionUser,
  delegationIds: string[],
): Promise<string[]> {
  if (delegationIds.length === 0) return []
  const meeting = await loadMeeting(user.conferenceId)
  const headSeatIds = new Map<string, string>()
  for (const delegation of meeting.state.delegations) {
    if (delegation.headSeatId) headSeatIds.set(delegation.id, delegation.headSeatId)
  }
  const seats = delegationIds
    .map((id) => headSeatIds.get(id))
    .filter((id): id is string => Boolean(id))
  if (seats.length === 0) return []
  const placeholders = seats.map(() => '?').join(',')
  const result = await getDb().execute({
    sql: `SELECT account_id FROM conference_members
          WHERE conference_id = ? AND seat_id IN (${placeholders})`,
    args: [user.conferenceId, ...seats],
  })
  return result.rows.map((row) => String(row.account_id))
}
