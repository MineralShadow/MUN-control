import { Hono, type Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Action } from '../src/state/reducer.ts'
import { createId } from '../src/lib/id.ts'
import type { AccountInfo } from '../src/types.ts'
import { hashPassword } from './password.ts'
import {
  getSessionUser,
  loginUser,
  logoutUser,
  requireChair,
  requireUser,
  setAccountPassword,
} from './auth.ts'
import { ensureDb, getDb } from './db.ts'
import {
  createEvent,
  deleteEvent,
  listEvents,
  publishDueEvents,
  setEventRead,
  updateEvent,
  type EventInput,
} from './events.ts'
import {
  createFile,
  getFileForDownload,
  listFiles,
  setFileRead,
} from './files.ts'
import { applyConferenceAction, loadMeeting } from './meeting.ts'
import {
  clearCrisisPause,
  getTimeState,
  pauseTimeFlow,
  setCurrentTime,
  setTimeRate,
  startTimeFlow,
} from './time.ts'

const app = new Hono()

app.use('*', async (c, next) => {
  await ensureDb()
  await next()
})

/**
 * 单函数网关：线上 Vercel 只部署 /api 一个函数，
 * 前端把真实接口放在 ?route=/auth/login 这类查询参数里。
 * 这样不依赖 Vercel 的动态文件名或 rewrite 规则。
 */
app.all('/api', async (c) => {
  const route = c.req.query('route')
  if (!route || !route.startsWith('/')) {
    throw new HTTPException(400, { message: '缺少接口路由' })
  }

  const url = new URL(c.req.url)
  url.pathname = `/api${route}`
  url.searchParams.delete('route')

  const request = new Request(url.toString(), {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.method === 'GET' || c.req.method === 'HEAD' ? null : c.req.raw.body,
    // Node 的 fetch 在流式请求体上要求 duplex
    duplex: 'half',
  } as RequestInit)

  return app.fetch(request)
})

const ALLOWED_ACTIONS = new Set([
  'theme/set',
  'author/set',
  'attendanceRule/set',
  'delegation/add',
  'delegation/rename',
  'delegation/delete',
  'delegation/setVotes',
  'delegation/toggleVeto',
  'seat/add',
  'seat/rename',
  'seat/delete',
  'seat/togglePresent',
  'session/add',
  'session/rename',
  'session/delete',
  'topic/add',
  'topic/rename',
  'topic/delete',
  'current/set',
  'current/clear',
  'resolution/add',
  'resolution/rename',
  'resolution/delete',
  'resolution/finish',
  'settings/patch',
  'state/replace',
  'state/reset',
])

async function readJson(c: Context): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await c.req.json()
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('not object')
    }
    return value as Record<string, unknown>
  } catch {
    throw new HTTPException(400, { message: '请求体格式错误' })
  }
}

function text(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

async function listAccounts(): Promise<AccountInfo[]> {
  const result = await getDb().execute(
    `SELECT id, username, name, role, created_at FROM accounts
     ORDER BY CASE role WHEN 'chair' THEN 0 ELSE 1 END, created_at ASC`,
  )
  return result.rows.map((row) => ({
    id: String(row.id),
    username: String(row.username),
    name: String(row.name),
    role: row.role === 'chair' ? 'chair' : 'delegate',
    createdAt: Number(row.created_at),
  }))
}

async function validateRecipients(ids: unknown): Promise<string[]> {
  if (!Array.isArray(ids)) return []
  const unique = [...new Set(ids.filter((item): item is string => typeof item === 'string'))]
  if (unique.length === 0) return []
  const placeholders = unique.map(() => '?').join(',')
  const result = await getDb().execute({
    sql: `SELECT id FROM accounts WHERE role = 'delegate' AND id IN (${placeholders})`,
    args: unique,
  })
  const found = new Set(result.rows.map((row) => String(row.id)))
  return unique.filter((id) => found.has(id))
}

async function validateEventInput(
  body: Record<string, unknown>,
  currentTime: number,
): Promise<EventInput> {
  const title = text(body.title, 80)
  const content = text(body.content, 8000)
  if (!title) throw new HTTPException(400, { message: '事件标题不能为空' })

  const eventTimeRaw = Number(body.eventTime)
  const eventTime = Number.isFinite(eventTimeRaw) && eventTimeRaw > 0
    ? Math.round(eventTimeRaw)
    : currentTime

  const isCrisis = body.isCrisis === true
  const recipientIds = await validateRecipients(body.recipientIds)

  return { title, content, eventTime, isCrisis, recipientIds }
}

/* ---------------- 认证 ---------------- */

app.post('/api/auth/login', async (c) => {
  const body = await readJson(c)
  const user = await loginUser(c, text(body.username, 40), String(body.password ?? ''))
  return c.json({ me: user })
})

app.post('/api/auth/logout', async (c) => {
  await logoutUser(c)
  return c.json({ ok: true })
})

app.get('/api/auth/me', async (c) => {
  const user = await getSessionUser(c)
  return c.json({ me: user })
})

/* ---------------- 全量同步 ---------------- */

app.get('/api/bootstrap', async (c) => {
  const user = await requireUser(c)
  await publishDueEvents()

  const [meeting, time] = await Promise.all([loadMeeting(), getTimeState()])
  const [events, files] = await Promise.all([listEvents(user), listFiles(user)])
  const accounts = user.role === 'chair' ? await listAccounts() : []

  return c.json({
    me: user,
    conference: meeting.state,
    time,
    events,
    files,
    accounts,
    revision: meeting.revision,
    serverNow: Date.now(),
  })
})

/* ---------------- 会议数据 ---------------- */

app.post('/api/conference/action', async (c) => {
  await requireChair(c)
  const body = await readJson(c)
  const action = body.action as Action | undefined
  if (!action || typeof action !== 'object' || !ALLOWED_ACTIONS.has(String(action.type))) {
    throw new HTTPException(400, { message: '未知操作' })
  }

  try {
    const snapshot = await applyConferenceAction(action)
    return c.json({ conference: snapshot.state, revision: snapshot.revision })
  } catch (error) {
    console.error('[conference action]', error)
    throw new HTTPException(400, { message: '操作未能完成' })
  }
})

/* ---------------- 时间 ---------------- */

app.post('/api/time', async (c) => {
  await requireChair(c)
  const body = await readJson(c)
  const action = String(body.action ?? '')
  const value = Number(body.value)

  if (action === 'set') {
    if (!Number.isFinite(value) || value < 0) {
      throw new HTTPException(400, { message: '时间格式不正确' })
    }
    await setCurrentTime(value)
  } else if (action === 'start') {
    await startTimeFlow()
  } else if (action === 'pause') {
    await pauseTimeFlow()
  } else if (action === 'rate') {
    if (!Number.isFinite(value) || value <= 0 || value > 1000) {
      throw new HTTPException(400, { message: '流速需在 0–1000 之间' })
    }
    await setTimeRate(value)
  } else if (action === 'clearCrisis') {
    await clearCrisisPause()
  } else {
    throw new HTTPException(400, { message: '未知时间操作' })
  }

  await publishDueEvents()
  return c.json({ time: await getTimeState() })
})

/* ---------------- 事件 ---------------- */

app.post('/api/events', async (c) => {
  const user = await requireChair(c)
  const body = await readJson(c)
  const current = await getTimeState()
  const input = await validateEventInput(body, current.currentMs)
  const id = await createEvent(user, input)
  return c.json({ id, time: await getTimeState() })
})

app.patch('/api/events/:id', async (c) => {
  await requireChair(c)
  const body = await readJson(c)
  const current = await getTimeState()
  const input = await validateEventInput(body, current.currentMs)
  const ok = await updateEvent(c.req.param('id'), input)
  if (!ok) throw new HTTPException(404, { message: '事件不存在' })
  return c.json({ ok: true, time: await getTimeState() })
})

app.delete('/api/events/:id', async (c) => {
  await requireChair(c)
  const ok = await deleteEvent(c.req.param('id'))
  if (!ok) throw new HTTPException(404, { message: '事件不存在' })
  return c.json({ ok: true, time: await getTimeState() })
})

app.post('/api/events/:id/read', async (c) => {
  const user = await requireUser(c)
  const body = await readJson(c)
  const ok = await setEventRead(user, c.req.param('id'), body.read === true)
  if (!ok) throw new HTTPException(404, { message: '没有找到该事件' })
  return c.json({ ok: true })
})

/* ---------------- 文件 ---------------- */

const MAX_FILE_SIZE = 2 * 1024 * 1024

app.post('/api/files', async (c) => {
  const user = await requireUser(c)
  let form: FormData
  try {
    form = await c.req.formData()
  } catch {
    throw new HTTPException(400, { message: '文件上传格式错误' })
  }

  const file = form.get('file')
  if (!file || typeof file === 'string' || !('arrayBuffer' in file)) {
    throw new HTTPException(400, { message: '请选择要提交的文件' })
  }

  const actual = file as File
  if (actual.size <= 0) throw new HTTPException(400, { message: '文件为空' })
  if (actual.size > MAX_FILE_SIZE) {
    throw new HTTPException(400, { message: '文件不能超过 2 MB' })
  }

  const title = text(form.get('title'), 80) || actual.name
  const bytes = new Uint8Array(await actual.arrayBuffer())
  await createFile(user, {
    title,
    filename: actual.name.slice(0, 200),
    mime: actual.type || 'application/octet-stream',
    size: actual.size,
    bytes,
  })
  return c.json({ ok: true })
})

app.get('/api/files/:id/download', async (c) => {
  const user = await requireUser(c)
  const found = await getFileForDownload(user, c.req.param('id'))
  if (!found) throw new HTTPException(404, { message: '文件不存在或无权下载' })
  const encoded = encodeURIComponent(found.file.filename)
  const body = new Blob([found.bytes as unknown as BlobPart], {
    type: found.file.mime,
  })
  return new Response(body, {
    headers: {
      'Content-Type': found.file.mime,
      'Content-Length': String(found.file.size),
      'Content-Disposition': `attachment; filename*=UTF-8''${encoded}`,
      'Cache-Control': 'private, no-store',
    },
  })
})

app.post('/api/files/:id/read', async (c) => {
  const user = await requireChair(c)
  const body = await readJson(c)
  const ok = await setFileRead(user, c.req.param('id'), body.read === true)
  if (!ok) throw new HTTPException(404, { message: '文件不存在' })
  return c.json({ ok: true })
})

/* ---------------- 账号 ---------------- */

app.post('/api/accounts', async (c) => {
  await requireChair(c)
  const body = await readJson(c)
  const username = text(body.username, 32)
  const password = String(body.password ?? '')
  const name = text(body.name, 40) || username

  if (username.length < 2) throw new HTTPException(400, { message: '账号至少 2 个字符' })
  if (password.length < 4) throw new HTTPException(400, { message: '密码至少 4 个字符' })

  const db = getDb()
  const exists = await db.execute({
    sql: 'SELECT id FROM accounts WHERE username = ? LIMIT 1',
    args: [username],
  })
  if (exists.rows.length > 0) {
    throw new HTTPException(409, { message: '该账号已存在' })
  }

  await db.execute({
    sql: `INSERT INTO accounts (id, username, password, name, role, created_at)
          VALUES (?, ?, ?, ?, 'delegate', ?)`,
    args: [createId('acc'), username, hashPassword(password), name, Date.now()],
  })
  return c.json({ ok: true })
})

app.patch('/api/accounts/:id', async (c) => {
  const chair = await requireChair(c)
  const id = c.req.param('id')
  const body = await readJson(c)
  const db = getDb()

  const target = await db.execute({
    sql: 'SELECT * FROM accounts WHERE id = ? LIMIT 1',
    args: [id],
  })
  if (target.rows.length === 0) throw new HTTPException(404, { message: '账号不存在' })

  const name = text(body.name, 40)
  if (name) {
    await db.execute({ sql: 'UPDATE accounts SET name = ? WHERE id = ?', args: [name, id] })
  }

  if (typeof body.password === 'string' && body.password.length > 0) {
    if (body.password.length < 4) {
      throw new HTTPException(400, { message: '密码至少 4 个字符' })
    }
    await setAccountPassword(id, body.password)
    if (id === chair.id) {
      // 主席修改自己的密码会注销当前会话，前端会回到登录页
      await logoutUser(c)
    }
  }
  return c.json({ ok: true })
})

app.delete('/api/accounts/:id', async (c) => {
  const chair = await requireChair(c)
  const id = c.req.param('id')
  if (id === chair.id) throw new HTTPException(400, { message: '不能删除当前登录账号' })

  const db = getDb()
  const target = await db.execute({
    sql: 'SELECT role FROM accounts WHERE id = ? LIMIT 1',
    args: [id],
  })
  if (target.rows.length === 0) throw new HTTPException(404, { message: '账号不存在' })
  if (target.rows[0].role === 'chair') {
    throw new HTTPException(400, { message: '不能删除主席账号' })
  }

  await db.execute({ sql: 'DELETE FROM sessions WHERE account_id = ?', args: [id] })
  await db.execute({ sql: 'DELETE FROM event_recipients WHERE account_id = ?', args: [id] })
  await db.execute({ sql: 'DELETE FROM accounts WHERE id = ?', args: [id] })
  return c.json({ ok: true })
})

/* ---------------- 错误处理 ---------------- */

app.notFound((c) => c.json({ error: '接口不存在' }, 404))

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message || '请求失败' }, error.status)
  }
  console.error('[api]', error)
  return c.json({ error: error instanceof Error ? error.message : '服务器错误' }, 500)
})

export { app }
