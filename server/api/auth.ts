import { randomBytes } from 'node:crypto'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import type { SessionUser } from '../../src/types.ts'
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

function toUser(row: AccountRow): SessionUser {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role === 'chair' ? 'chair' : 'delegate',
  }
}

const secureCookies = Boolean(process.env.VERCEL)

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

  const token = randomBytes(32).toString('hex')
  const expiresAt = Date.now() + SESSION_TTL_MS

  await db.execute({
    sql: 'DELETE FROM sessions WHERE expires_at < ?',
    args: [Date.now()],
  })
  await db.execute({
    sql: 'INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, ?)',
    args: [token, row.id, expiresAt],
  })

  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    secure: secureCookies,
  })

  return toUser(row)
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
    sql: `SELECT a.id, a.username, a.name, a.role, s.expires_at
          FROM sessions s
          JOIN accounts a ON a.id = s.account_id
          WHERE s.token = ?
          LIMIT 1`,
    args: [token],
  })

  const row = result.rows[0] as unknown as (AccountRow & { expires_at: number }) | undefined
  if (!row) return null

  if (Number(row.expires_at) < Date.now()) {
    await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] })
    return null
  }

  return toUser(row)
}

export async function requireUser(c: Context): Promise<SessionUser> {
  const user = await getSessionUser(c)
  if (!user) throw new HTTPException(401, { message: '请先登录' })
  return user
}

export async function requireChair(c: Context): Promise<SessionUser> {
  const user = await requireUser(c)
  if (user.role !== 'chair') {
    throw new HTTPException(403, { message: '只有主席可以执行此操作' })
  }
  return user
}

export async function setAccountPassword(accountId: string, password: string): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: 'UPDATE accounts SET password = ? WHERE id = ?',
    args: [hashPassword(password), accountId],
  })
  // 改密后让该账号的旧会话失效
  await db.execute({
    sql: 'DELETE FROM sessions WHERE account_id = ?',
    args: [accountId],
  })
}
