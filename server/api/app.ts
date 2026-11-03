import { Hono, type Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Action } from '../../src/state/reducer.ts'
import { createId } from '../../src/lib/id.ts'
import { normalizeFileType } from '../../src/lib/fileTypes.ts'
import type { AccountInfo, EventVisibility } from '../../src/types.ts'
import { hashPassword } from './password.ts'
import {
  getSessionUser,
  listMemberships,
  loginUser,
  logoutUser,
  requireChair,
  requireUser,
  setAccountPassword,
  switchConference,
} from './auth.ts'
import { ensureDb, getDb } from './db.ts'
import {
  createEvent,
  deleteEvent,
  listEvents,
  publishAllDueEvents,
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
import { addExistingChair, createConference } from './conferences.ts'
import { createArchive, deleteArchive, listArchives, restoreArchive } from './archives.ts'
import { clearConferenceData } from './admin.ts'
import {
  getPushPublicKey,
  removePushSubscription,
  savePushSubscription,
} from './push.ts'

const app = new Hono()

function isHealthRequest(c: Context): boolean {
  return (
    c.req.path === '/api/health' ||
    (c.req.path === '/api' && c.req.query('route') === '/health')
  )
}

app.use('*', async (c, next) => {
  if (isHealthRequest(c)) return next()
  await ensureDb()
  await next()
})

app.get('/api/health', async (c) => {
  const env = {
    hasDatabaseUrl: Boolean(process.env.TURSO_DATABASE_URL),
    hasAuthToken: Boolean(process.env.TURSO_AUTH_TOKEN),
    vercel: Boolean(process.env.VERCEL),
    node: process.version,
  }

  try {
    const result = await getDb().execute('SELECT 1 AS ok')
    return c.json({ ok: true, env, database: 'ok', probe: Number(result.rows[0]?.ok ?? 0) })
  } catch (error) {
    console.error('[health]', error)
    return c.json(
      {
        ok: false,
        env,
        database: 'error',
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    )
  }
})

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
    duplex: 'half',
  } as RequestInit)
  return app.fetch(request)
})

const ALLOWED_ACTIONS = new Set([
  'theme/set',
  'author/set',
  'attendanceRule/set',
  'voteMode/set',
  'delegation/add',
  'delegation/rename',
  'delegation/delete',
  'delegation/setVotes',
  'delegation/setHead',
  'delegation/toggleVeto',
  'seat/add',
  'seat/rename',
  'seat/delete',
  'seat/togglePresent',
  'seat/setVotes',
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
  'motionType/add',
  'motionType/update',
  'motionType/delete',
  'motion/start',
  'motion/end',
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

async function listAccounts(conferenceId: string): Promise<AccountInfo[]> {
  const db = getDb()
  const [result, meeting] = await Promise.all([
    db.execute({
      sql: `SELECT a.id, a.username, a.name, a.created_at, cm.role, cm.seat_id
            FROM conference_members cm
            JOIN accounts a ON a.id = cm.account_id
            WHERE cm.conference_id = ?
            ORDER BY CASE cm.role WHEN 'chair' THEN 0 ELSE 1 END, a.created_at ASC`,
      args: [conferenceId],
    }),
    loadMeeting(conferenceId),
  ])
  const seats = new Map<string, { seatName: string; delegationName: string }>()
  for (const delegation of meeting.state.delegations) {
    for (const seat of delegation.seats) {
      seats.set(seat.id, { seatName: seat.name, delegationName: delegation.name })
    }
  }
  return result.rows.map((row) => {
    const seatId = row.seat_id ? String(row.seat_id) : null
    const seat = seatId ? seats.get(seatId) : undefined
    return {
      id: String(row.id),
      username: String(row.username),
      name: String(row.name),
      role: String(row.role) === 'chair' ? 'chair' : 'delegate',
      createdAt: Number(row.created_at),
      seatId: seat ? seatId : null,
      seatName: seat?.seatName ?? null,
      delegationName: seat?.delegationName ?? null,
    }
  })
}

async function getMyMembership(user: { id: string; conferenceId: string }) {
  const member = await getDb().execute({
    sql: 'SELECT seat_id FROM conference_members WHERE conference_id = ? AND account_id = ? LIMIT 1',
    args: [user.conferenceId, user.id],
  })
  const seatId = member.rows[0]?.seat_id
    ? String(member.rows[0].seat_id)
    : null
  if (!seatId) return null
  const meeting = await loadMeeting(user.conferenceId)
  for (const delegation of meeting.state.delegations) {
    const seat = delegation.seats.find((item) => item.id === seatId)
    if (seat) {
      return {
        seatId,
        delegationId: delegation.id,
        delegationName: delegation.name,
        isHead: delegation.headSeatId === seatId,
      }
    }
  }
  return null
}

async function validateRecipients(
  conferenceId: string,
  ids: unknown,
): Promise<string[]> {
  if (!Array.isArray(ids)) return []
  const unique = [...new Set(ids.filter((item): item is string => typeof item === 'string'))]
  if (unique.length === 0) return []
  const placeholders = unique.map(() => '?').join(',')
  const result = await getDb().execute({
    sql: `SELECT account_id FROM conference_members
          WHERE conference_id = ? AND role = 'delegate'
            AND account_id IN (${placeholders})`,
    args: [conferenceId, ...unique],
  })
  const found = new Set(result.rows.map((row) => String(row.account_id)))
  return unique.filter((id) => found.has(id))
}

async function validateEventInput(
  conferenceId: string,
  body: Record<string, unknown>,
  currentTime: number,
): Promise<EventInput> {
  const title = text(body.title, 80)
  const content = text(body.content, 8000)
  if (!title) throw new HTTPException(400, { message: '事件标题不能为空' })

  const eventTimeRaw = Number(body.eventTime)
  const eventTime =
    Number.isFinite(eventTimeRaw) && Math.abs(eventTimeRaw) <= 8.64e15
      ? Math.round(eventTimeRaw)
      : currentTime

  const isCrisis = body.isCrisis === true
  const visibility: EventVisibility = isCrisis
    ? 'PUBLIC'
    : body.visibility === 'PUBLIC'
      ? 'PUBLIC'
      : 'SECRET'
  const recipientIds =
    visibility === 'SECRET'
      ? await validateRecipients(conferenceId, body.recipientIds)
      : []

  return { title, content, eventTime, isCrisis, visibility, recipientIds }
}

/* ---------------- 认证 / 会场 ---------------- */

app.post('/api/auth/login', async (c) => {
  const body = await readJson(c)
  const user = await loginUser(c, text(body.username, 40), String(body.password ?? ''))
  return c.json({ me: user, conferences: await listMemberships(user.id) })
})

app.post('/api/auth/logout', async (c) => {
  await logoutUser(c)
  return c.json({ ok: true })
})

app.get('/api/auth/me', async (c) => {
  const user = await getSessionUser(c)
  if (!user) return c.json({ me: null, conferences: [] })
  return c.json({ me: user, conferences: await listMemberships(user.id) })
})

app.post('/api/auth/switch', async (c) => {
  const body = await readJson(c)
  const conferenceId = text(body.conferenceId, 100)
  const user = await switchConference(c, conferenceId)
  return c.json({ me: user, conferences: await listMemberships(user.id) })
})

app.get('/api/conferences', async (c) => {
  const user = await requireUser(c)
  return c.json({ conferences: await listMemberships(user.id) })
})

app.post('/api/conferences', async (c) => {
  const user = await requireChair(c)
  const body = await readJson(c)
  const conference = await createConference(user, text(body.name, 80))
  return c.json({ conference, conferences: await listMemberships(user.id) })
})

app.post('/api/conferences/chairs', async (c) => {
  const user = await requireChair(c)
  const body = await readJson(c)
  const accountId = text(body.accountId, 100)
  const ok = await addExistingChair(user.conferenceId, accountId)
  if (!ok) throw new HTTPException(404, { message: '主席账号不存在' })
  return c.json({ ok: true })
})

/* ---------------- 全量同步 ---------------- */

app.get('/api/bootstrap', async (c) => {
  const user = await requireUser(c)
  await publishDueEvents(user.conferenceId)

  const [meeting, time] = await Promise.all([
    loadMeeting(user.conferenceId),
    getTimeState(user.conferenceId),
  ])
  const [events, files, conferences] = await Promise.all([
    listEvents(user),
    listFiles(user),
    listMemberships(user.id),
  ])
  const accounts = user.role === 'chair' ? await listAccounts(user.conferenceId) : []
  const myMembership = await getMyMembership(user)

  return c.json({
    me: user,
    conference: meeting.state,
    time,
    events,
    files,
    accounts,
    conferences,
    myMembership,
    revision: meeting.revision,
    serverNow: Date.now(),
  })
})

/* ---------------- 会议数据 ---------------- */

app.post('/api/conference/action', async (c) => {
  const user = await requireChair(c)
  const body = await readJson(c)
  const action = body.action as Action | undefined
  if (!action || typeof action !== 'object' || !ALLOWED_ACTIONS.has(String(action.type))) {
    throw new HTTPException(400, { message: '未知操作' })
  }
  try {
    const snapshot = await applyConferenceAction(user.conferenceId, action)
    return c.json({ conference: snapshot.state, revision: snapshot.revision })
  } catch (error) {
    console.error('[conference action]', error)
    throw new HTTPException(400, { message: '操作未能完成' })
  }
})

/* ---------------- 时间 ---------------- */

app.post('/api/time', async (c) => {
  const user = await requireChair(c)
  const body = await readJson(c)
  const action = String(body.action ?? '')
  const value = Number(body.value)

  if (action === 'set') {
    if (!Number.isFinite(value) || Math.abs(value) > 8.64e15) {
      throw new HTTPException(400, { message: '时间格式不正确' })
    }
    await setCurrentTime(user.conferenceId, value)
  } else if (action === 'start') {
    await startTimeFlow(user.conferenceId)
  } else if (action === 'pause') {
    await pauseTimeFlow(user.conferenceId)
  } else if (action === 'rate') {
    if (!Number.isFinite(value) || value <= 0 || value > 1000) {
      throw new HTTPException(400, { message: '流速需在 0–1000 之间' })
    }
    await setTimeRate(user.conferenceId, value)
  } else if (action === 'clearCrisis') {
    await clearCrisisPause(user.conferenceId)
  } else {
    throw new HTTPException(400, { message: '未知时间操作' })
  }

  await publishDueEvents(user.conferenceId)
  return c.json({ time: await getTimeState(user.conferenceId) })
})

/* ---------------- 事件 ---------------- */

app.post('/api/events', async (c) => {
  const user = await requireChair(c)
  const body = await readJson(c)
  const current = await getTimeState(user.conferenceId)
  const input = await validateEventInput(user.conferenceId, body, current.currentMs)
  const id = await createEvent(user, input)
  return c.json({ id, time: await getTimeState(user.conferenceId) })
})

app.patch('/api/events/:id', async (c) => {
  const user = await requireChair(c)
  const body = await readJson(c)
  const current = await getTimeState(user.conferenceId)
  const input = await validateEventInput(user.conferenceId, body, current.currentMs)
  const ok = await updateEvent(c.req.param('id'), user, input)
  if (!ok) throw new HTTPException(404, { message: '事件不存在' })
  return c.json({ ok: true, time: await getTimeState(user.conferenceId) })
})

app.delete('/api/events/:id', async (c) => {
  const user = await requireChair(c)
  const ok = await deleteEvent(c.req.param('id'), user)
  if (!ok) throw new HTTPException(404, { message: '事件不存在' })
  return c.json({ ok: true, time: await getTimeState(user.conferenceId) })
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
  const meeting = await loadMeeting(user.conferenceId)
  const scope = String(form.get('scope') ?? '') === 'PERSONAL' ? 'PERSONAL' : 'DELEGATION'
  const fileType = normalizeFileType(form.get('type'))
  const membership = await getMyMembership(user)
  let delegationId: string | null = null

  if (user.role === 'chair') {
    if (scope === 'DELEGATION') {
      const requested = text(form.get('delegationId'), 100)
      const delegation = meeting.state.delegations.find((item) => item.id === requested)
      if (!delegation) throw new HTTPException(400, { message: '请选择代表团' })
      delegationId = delegation.id
    }
  } else if (scope === 'DELEGATION') {
    if (!membership) throw new HTTPException(403, { message: '你还没有绑定席位' })
    const delegation = meeting.state.delegations.find(
      (item) => item.id === membership.delegationId,
    )
    if (!delegation || delegation.headSeatId !== membership.seatId) {
      throw new HTTPException(403, { message: '只有阁首可以提交代表团文件' })
    }
    delegationId = delegation.id
  } else if (!meeting.state.settings.allowPersonalFiles) {
    throw new HTTPException(403, { message: '主席团尚未开放个人文件权限' })
  }

  const coSign = scope === 'DELEGATION' && form.get('coSign') === 'true'
  const bytes = new Uint8Array(await actual.arrayBuffer())
  await createFile(user, {
    title,
    filename: actual.name.slice(0, 200),
    mime: actual.type || 'application/octet-stream',
    size: actual.size,
    fileType,
    scope,
    delegationId,
    coSign,
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
  const user = await requireChair(c)
  const body = await readJson(c)
  const username = text(body.username, 32)
  const password = String(body.password ?? '')
  const name = text(body.name, 40) || username
  const role = body.role === 'chair' ? 'chair' : 'delegate'

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

  const id = createId('acc')
  await db.batch([
    {
      sql: `INSERT INTO accounts (id, username, password, name, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, username, hashPassword(password), name, role, Date.now()],
    },
    {
      sql: `INSERT INTO conference_members
            (conference_id, account_id, role, seat_id, created_at)
            VALUES (?, ?, ?, NULL, ?)`,
      args: [user.conferenceId, id, role, Date.now()],
    },
  ])
  return c.json({ ok: true })
})

app.patch('/api/accounts/:id', async (c) => {
  const chair = await requireChair(c)
  const id = c.req.param('id')
  const body = await readJson(c)
  const db = getDb()

  const target = await db.execute({
    sql: `SELECT a.id, a.role, cm.role AS member_role
          FROM conference_members cm
          JOIN accounts a ON a.id = cm.account_id
          WHERE cm.conference_id = ? AND a.id = ? LIMIT 1`,
    args: [chair.conferenceId, id],
  })
  if (target.rows.length === 0) throw new HTTPException(404, { message: '账号不存在' })

  const name = text(body.name, 40)
  if (name) {
    await db.execute({ sql: 'UPDATE accounts SET name = ? WHERE id = ?', args: [name, id] })
  }

  if ('seatId' in body) {
    const rawSeatId = body.seatId
    if (rawSeatId === null || rawSeatId === '') {
      await db.execute({
        sql: 'UPDATE conference_members SET seat_id = NULL WHERE conference_id = ? AND account_id = ?',
        args: [chair.conferenceId, id],
      })
    } else if (typeof rawSeatId === 'string') {
      const meeting = await loadMeeting(chair.conferenceId)
      const seat = meeting.state.delegations
        .flatMap((delegation) => delegation.seats)
        .find((item) => item.id === rawSeatId)
      if (!seat) throw new HTTPException(404, { message: '席位不存在' })
      await db.execute({
        sql: 'UPDATE conference_members SET seat_id = NULL WHERE conference_id = ? AND seat_id = ? AND account_id <> ?',
        args: [chair.conferenceId, rawSeatId, id],
      })
      await db.execute({
        sql: 'UPDATE conference_members SET seat_id = ? WHERE conference_id = ? AND account_id = ?',
        args: [rawSeatId, chair.conferenceId, id],
      })
    } else {
      throw new HTTPException(400, { message: '席位参数不正确' })
    }
  }

  if (typeof body.password === 'string' && body.password.length > 0) {
    if (body.password.length < 4) {
      throw new HTTPException(400, { message: '密码至少 4 个字符' })
    }
    await setAccountPassword(id, body.password)
    if (id === chair.id) await logoutUser(c)
  }
  return c.json({ ok: true })
})

app.delete('/api/accounts/:id', async (c) => {
  const chair = await requireChair(c)
  const id = c.req.param('id')
  if (id === chair.id) throw new HTTPException(400, { message: '不能删除当前登录账号' })

  const db = getDb()
  const target = await db.execute({
    sql: `SELECT a.role, a.username, cm.role AS member_role
          FROM conference_members cm
          JOIN accounts a ON a.id = cm.account_id
          WHERE cm.conference_id = ? AND a.id = ? LIMIT 1`,
    args: [chair.conferenceId, id],
  })
  if (target.rows.length === 0) throw new HTTPException(404, { message: '账号不存在' })
  const row = target.rows[0]
  if (String(row.username) === '123456') {
    throw new HTTPException(400, { message: '不能删除初始主席账号' })
  }
  if (String(row.member_role) === 'chair') {
    const count = await db.execute({
      sql: "SELECT COUNT(*) AS n FROM conference_members WHERE conference_id = ? AND role = 'chair'",
      args: [chair.conferenceId],
    })
    if (Number(count.rows[0]?.n ?? 0) <= 1) {
      throw new HTTPException(400, { message: '会场至少需要保留一个主席账号' })
    }
  }

  await db.execute({
    sql: `DELETE FROM event_recipients WHERE account_id = ?
          AND event_id IN (SELECT id FROM events WHERE conference_id = ?)`,
    args: [id, chair.conferenceId],
  })
  await db.execute({
    sql: `DELETE FROM event_reads WHERE account_id = ?
          AND event_id IN (SELECT id FROM events WHERE conference_id = ?)`,
    args: [id, chair.conferenceId],
  })
  await db.execute({
    sql: 'DELETE FROM conference_members WHERE conference_id = ? AND account_id = ?',
    args: [chair.conferenceId, id],
  })
  await db.execute({
    sql: 'DELETE FROM sessions WHERE account_id = ? AND conference_id = ?',
    args: [id, chair.conferenceId],
  })
  const others = await db.execute({
    sql: 'SELECT 1 AS ok FROM conference_members WHERE account_id = ? LIMIT 1',
    args: [id],
  })
  if (others.rows.length === 0) {
    await db.execute({ sql: 'DELETE FROM push_subscriptions WHERE account_id = ?', args: [id] })
    await db.execute({ sql: 'DELETE FROM accounts WHERE id = ?', args: [id] })
  }
  return c.json({ ok: true })
})

/* ---------------- 定时发布 ---------------- */

app.get('/api/cron', async (c) => {
  const secret = process.env.CRON_SECRET
  if (secret && c.req.header('authorization') !== `Bearer ${secret}`) {
    throw new HTTPException(401, { message: 'unauthorized' })
  }
  await publishAllDueEvents()
  return c.json({ ok: true, at: Date.now() })
})

app.post('/api/cron', async (c) => {
  const secret = process.env.CRON_SECRET
  if (secret && c.req.header('authorization') !== `Bearer ${secret}`) {
    throw new HTTPException(401, { message: 'unauthorized' })
  }
  await publishAllDueEvents()
  return c.json({ ok: true, at: Date.now() })
})

/* ---------------- 在线存档 ---------------- */

app.get('/api/archives', async (c) => {
  const user = await requireChair(c)
  return c.json({ archives: await listArchives(user.conferenceId) })
})

app.post('/api/archives', async (c) => {
  const user = await requireChair(c)
  const body = await readJson(c)
  const name = text(body.name, 80)
  return c.json({
    archive: await createArchive(user.conferenceId, name, body.include),
  })
})

app.delete('/api/archives/:id', async (c) => {
  const user = await requireChair(c)
  const ok = await deleteArchive(user.conferenceId, c.req.param('id'))
  if (!ok) throw new HTTPException(404, { message: '存档不存在' })
  return c.json({ ok: true })
})

app.post('/api/archives/:id/restore', async (c) => {
  const user = await requireChair(c)
  try {
    await restoreArchive(user.conferenceId, c.req.param('id'))
  } catch (error) {
    throw new HTTPException(400, {
      message: error instanceof Error ? error.message : '存档读取失败',
    })
  }
  return c.json({ ok: true })
})

/* ---------------- Web Push ---------------- */

app.get('/api/push/public-key', async (c) => {
  await requireUser(c)
  const publicKey = await getPushPublicKey()
  if (!publicKey) throw new HTTPException(500, { message: 'Web Push 未就绪' })
  return c.json({ publicKey })
})

app.post('/api/push/subscribe', async (c) => {
  const user = await requireUser(c)
  const body = await readJson(c)
  const ok = await savePushSubscription(user.id, user.conferenceId, body)
  if (!ok) throw new HTTPException(400, { message: '订阅信息不完整' })
  return c.json({ ok: true })
})

app.delete('/api/push/subscribe', async (c) => {
  const user = await requireUser(c)
  const body = await readJson(c)
  await removePushSubscription(user.id, String(body.endpoint ?? ''))
  return c.json({ ok: true })
})

/* ---------------- 清除当前会场数据 ---------------- */

app.post('/api/admin/clear', async (c) => {
  const user = await requireChair(c)
  const body = await readJson(c)
  await clearConferenceData(user.conferenceId, user.id, body.include)
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
