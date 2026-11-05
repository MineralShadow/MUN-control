import { randomBytes } from 'node:crypto'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import type { ConferenceSummary, Role, SessionUser } from '../../src/types.ts'
import { getDb } from './db.ts'
import { hashPassword, verifyPassword } from './password.ts'

export const SESSION_COOKIE = 'mun_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface AccountRow {
  id: string
  username: string
  password: string
  name: string
  role: string
  created_at: number
}

interface MembershipRow {
  conference_id: string
  role: string
  conference_name: string
}

function toUser(row: AccountRow, membership: MembershipRow): SessionUser {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: membership.role === 'chair' ? 'chair' : 'delegate',
    conferenceId: membership.conference_id,
    conferenceName: membership.conference_name,
  }
}

const secureCookies =
  Boolean(process.env.VERCEL) || process.env.COOKIE_SECURE === 'true'

export async function listMemberships(accountId: string): Promise<ConferenceSummary[]> {
  const result = await getDb().execute({
    sql: `SELECT c.id, c.name, cm.role
          FROM conference_members cm
          JOIN conferences c ON c.id = cm.conference_id
          WHERE cm.account_id = ?
          ORDER BY c.created_at ASC`,
    args: [accountId],
  })
  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    role: String(row.role) === 'chair' ? 'chair' : 'delegate',
  }))
}

async function findMembership(
  accountId: string,
  conferenceId?: string,
): Promise<MembershipRow | undefined> {
  const result = await getDb().execute({
    sql: `SELECT cm.conference_id, cm.role, c.name AS conference_name
          FROM conference_members cm
          JOIN conferences c ON c.id = cm.conference_id
          WHERE cm.account_id = ?
          ORDER BY CASE WHEN cm.conference_id = ? THEN 0 ELSE 1 END, c.created_at ASC
          LIMIT 1`,
    args: [accountId, conferenceId ?? ''],
  })
  return result.rows[0] as unknown as MembershipRow | undefined
}

export async function loginUser(
  c: Context,
  usernameRaw: string,
  password: string,
): Promise<SessionUser> {
  const username = usernameRaw.trim()
  if (!username || !password) {
    throw new HTTPException(400, { message: '请输入账号和密码' })
  }

  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM accounts WHERE username = ? LIMIT 1',
    args: [username],
  })
  const row = result.rows[0] as unknown as AccountRow | undefined
  if (!row || !verifyPassword(password, row.password)) {
    throw new HTTPException(401, { message: '账号或密码错误' })
  }

  const membership = await findMembership(row.id)
  if (!membership) {
    throw new HTTPException(403, { message: '该账号还没有加入任何会场' })
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = Date.now() + SESSION_TTL_MS

  await db.execute({
    sql: 'DELETE FROM sessions WHERE expires_at < ?',
    args: [Date.now()],
  })
  await db.execute({
    sql: 'INSERT INTO sessions (token, account_id, conference_id, expires_at) VALUES (?, ?, ?, ?)',
    args: [token, row.id, membership.conference_id, expiresAt],
  })

  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    secure: secureCookies,
  })

  return toUser(row, membership)
}

export async function logoutUser(c: Context): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) {
    await getDb().execute({
      sql: 'DELETE FROM sessions WHERE token = ?',
      args: [token],
    })
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}

export async function getSessionUser(c: Context): Promise<SessionUser | null> {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null

  const db = getDb()
  const result = await db.execute({
    sql: `SELECT a.id, a.username, a.name, a.role, a.created_at,
                 s.conference_id, s.expires_at,
                 cm.role AS member_role, c.name AS conference_name
          FROM sessions s
          JOIN accounts a ON a.id = s.account_id
          LEFT JOIN conference_members cm
            ON cm.conference_id = s.conference_id AND cm.account_id = a.id
          LEFT JOIN conferences c ON c.id = s.conference_id
          WHERE s.token = ?
          LIMIT 1`,
    args: [token],
  })

  const row = result.rows[0] as unknown as
    | (AccountRow & {
        expires_at: number
        conference_id: string | null
        member_role: string | null
        conference_name: string | null
      })
    | undefined

  if (!row) return null
  if (Number(row.expires_at) < Date.now()) {
    await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] })
    return null
  }

  if (!row.conference_id || !row.member_role) {
    const membership = await findMembership(row.id)
    if (!membership) return null
    await db.execute({
      sql: 'UPDATE sessions SET conference_id = ? WHERE token = ?',
      args: [membership.conference_id, token],
    })
    return toUser(row, membership)
  }

  return toUser(row, {
    conference_id: row.conference_id,
    role: row.member_role,
    conference_name: row.conference_name ?? '会场',
  })
}

export async function requireUser(c: Context): Promise<SessionUser> {
  const user = await getSessionUser(c)
  if (!user) throw new HTTPException(401, { message: '请先登录' })
  c.set('conferenceId' as never, user.conferenceId as never)
  return user
}

export async function requireChair(c: Context): Promise<SessionUser> {
  const user = await requireUser(c)
  if (user.role !== 'chair') {
    throw new HTTPException(403, { message: '只有主席可以执行此操作' })
  }
  return user
}

export async function switchConference(
  c: Context,
  conferenceId: string,
): Promise<SessionUser> {
  const user = await requireUser(c)
  const db = getDb()
  const token = getCookie(c, SESSION_COOKIE)
  const membership = await db.execute({
    sql: `SELECT cm.conference_id, cm.role, c.name AS conference_name
          FROM conference_members cm
          JOIN conferences c ON c.id = cm.conference_id
          WHERE cm.account_id = ? AND cm.conference_id = ?
          LIMIT 1`,
    args: [user.id, conferenceId],
  })
  const row = membership.rows[0] as unknown as MembershipRow | undefined
  if (!row || !token) {
    throw new HTTPException(403, { message: '你不是该会场成员' })
  }
  await db.execute({
    sql: 'UPDATE sessions SET conference_id = ? WHERE token = ?',
    args: [conferenceId, token],
  })
  const account = await db.execute({
    sql: 'SELECT * FROM accounts WHERE id = ? LIMIT 1',
    args: [user.id],
  })
  const accountRow = account.rows[0] as unknown as AccountRow
  return toUser(accountRow, row)
}

export async function setAccountPassword(accountId: string, password: string): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: 'UPDATE accounts SET password = ? WHERE id = ?',
    args: [hashPassword(password), accountId],
  })
  await db.execute({
    sql: 'DELETE FROM sessions WHERE account_id = ?',
    args: [accountId],
  })
}

export function roleLabel(role: Role): string {
  return role === 'chair' ? '主席' : '代表'
}
