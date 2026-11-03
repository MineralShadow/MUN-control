import type { Client } from '@libsql/client'
import { createClient } from '@tursodatabase/serverless/compat'
import { createInitialState } from '../../src/state/defaults.ts'
import { createId } from '../../src/lib/id.ts'
import { hashPassword } from './password.ts'

export const DEFAULT_CONFERENCE_ID = 'default'
const DEFAULT_CONFERENCE_NAME = '历史委员会'

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    seat_id TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS conferences (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    created_by TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS conference_members (
    conference_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    role TEXT NOT NULL,
    seat_id TEXT,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (conference_id, account_id)
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    conference_id TEXT,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS conference_meeting (
    conference_id TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS conference_time (
    conference_id TEXT PRIMARY KEY,
    now_ms INTEGER NOT NULL,
    rate REAL NOT NULL,
    running INTEGER NOT NULL,
    anchor_ms INTEGER NOT NULL,
    crisis_paused INTEGER NOT NULL DEFAULT 0,
    crisis_event_id TEXT,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS meeting (
    id INTEGER PRIMARY KEY,
    state TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS time_state (
    id INTEGER PRIMARY KEY,
    now_ms INTEGER NOT NULL,
    rate REAL NOT NULL,
    running INTEGER NOT NULL,
    anchor_ms INTEGER NOT NULL,
    crisis_paused INTEGER NOT NULL DEFAULT 0,
    crisis_event_id TEXT,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    conference_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    event_time INTEGER NOT NULL,
    is_crisis INTEGER NOT NULL DEFAULT 0,
    visibility TEXT NOT NULL DEFAULT 'SECRET',
    published_at INTEGER,
    created_at INTEGER NOT NULL,
    created_by TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS event_recipients (
    event_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, account_id)
  )`,
  `CREATE TABLE IF NOT EXISTS event_reads (
    event_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, account_id)
  )`,
  `CREATE TABLE IF NOT EXISTS archives (
    id TEXT PRIMARY KEY,
    conference_id TEXT,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    data BLOB NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    conference_id TEXT,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    file_type TEXT NOT NULL DEFAULT '其他',
    scope TEXT NOT NULL DEFAULT 'DELEGATION',
    delegation_id TEXT,
    co_sign INTEGER NOT NULL DEFAULT 0,
    data BLOB NOT NULL,
    submitted_by TEXT NOT NULL,
    submitted_at INTEGER NOT NULL,
    read INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS push_config (
    id INTEGER PRIMARY KEY,
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL,
    subject TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    conference_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
]

let localClient: Client | null = null
let remotePromise: Promise<Client> | null = null
let resolvedClient: Client | null = null
let initPromise: Promise<void> | null = null

export function setLocalClient(client: Client): void {
  localClient = client
  resolvedClient = client
}

function createRemoteClient(): Client {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) {
    throw new Error('未配置 TURSO_DATABASE_URL，请在环境变量中设置数据库地址')
  }
  return createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  }) as unknown as Client
}

function getClient(): Promise<Client> {
  if (localClient) return Promise.resolve(localClient)
  if (resolvedClient) return Promise.resolve(resolvedClient)
  if (!remotePromise) {
    remotePromise = Promise.resolve()
      .then(() => createRemoteClient())
      .then((client) => {
        resolvedClient = client
        return client
      })
      .catch((error) => {
        remotePromise = null
        throw error
      })
  }
  return remotePromise
}

const clientProxy = new Proxy({} as Client, {
  get(_target, property) {
    if (property === 'then') return undefined
    return (...args: unknown[]) =>
      getClient().then((client) => {
        const value = (client as unknown as Record<string | symbol, unknown>)[property]
        if (typeof value === 'function') {
          return value.apply(client, args)
        }
        return value
      })
  },
})

export function getDb(): Client {
  return clientProxy
}

async function ensureColumn(
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  const db = getDb()
  const info = await db.execute(`PRAGMA table_info(${table})`)
  if (!info.rows.some((row) => String(row.name) === column)) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${definition}`)
  }
}

async function ensureInitialChair(): Promise<void> {
  const db = getDb()
  const existing = await db.execute({
    sql: 'SELECT id FROM accounts WHERE username = ? LIMIT 1',
    args: ['123456'],
  })
  if (existing.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO accounts (id, username, password, name, role, created_at)
            VALUES (?, ?, ?, ?, 'chair', ?)`,
      args: ['chair', '123456', hashPassword('abcd'), '主席团', Date.now()],
    })
  }
}

async function ensureDefaultConference(): Promise<void> {
  const db = getDb()
  const existing = await db.execute('SELECT id FROM conferences LIMIT 1')
  if (existing.rows.length > 0) return

  const now = Date.now()
  const legacyMeeting = await db.execute(
    'SELECT state, revision FROM meeting WHERE id = 1 LIMIT 1',
  )
  let state = createInitialState()
  let revision = 0
  if (legacyMeeting.rows[0]) {
    revision = Number(legacyMeeting.rows[0].revision ?? 0)
    try {
      const parsed = JSON.parse(String(legacyMeeting.rows[0].state))
      if (parsed && typeof parsed === 'object') {
        state = { ...state, ...parsed }
      }
    } catch {
      // 保留初始状态
    }
  }
  const name =
    typeof state.theme === 'string' && state.theme.trim()
      ? state.theme.trim().slice(0, 80)
      : DEFAULT_CONFERENCE_NAME
  state = { ...state, theme: name }

  await db.batch([
    {
      sql: 'INSERT INTO conferences (id, name, created_at, created_by) VALUES (?, ?, ?, ?)',
      args: [DEFAULT_CONFERENCE_ID, name, now, 'chair'],
    },
    {
      sql: `INSERT INTO conference_meeting (conference_id, state, revision, updated_at)
            VALUES (?, ?, ?, ?)`,
      args: [DEFAULT_CONFERENCE_ID, JSON.stringify(state), revision, now],
    },
  ])

  const legacyTime = await db.execute('SELECT * FROM time_state WHERE id = 1 LIMIT 1')
  if (legacyTime.rows[0]) {
    const row = legacyTime.rows[0]
    await db.execute({
      sql: `INSERT INTO conference_time
            (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        DEFAULT_CONFERENCE_ID,
        Number(row.now_ms),
        Number(row.rate),
        Number(row.running),
        Number(row.anchor_ms),
        Number(row.crisis_paused),
        row.crisis_event_id ? String(row.crisis_event_id) : null,
        Number(row.updated_at),
      ],
    })
  } else {
    await db.execute({
      sql: `INSERT INTO conference_time
            (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (?, ?, 1, 0, ?, 0, NULL, ?)`,
      args: [DEFAULT_CONFERENCE_ID, now, now, now],
    })
  }

  await db.execute('UPDATE events SET conference_id = ? WHERE conference_id IS NULL', [
    DEFAULT_CONFERENCE_ID,
  ])
  await db.execute('UPDATE files SET conference_id = ? WHERE conference_id IS NULL', [
    DEFAULT_CONFERENCE_ID,
  ])
  await db.execute('UPDATE archives SET conference_id = ? WHERE conference_id IS NULL', [
    DEFAULT_CONFERENCE_ID,
  ])
  await db.execute('UPDATE sessions SET conference_id = ? WHERE conference_id IS NULL', [
    DEFAULT_CONFERENCE_ID,
  ])

  const accounts = await db.execute(
    'SELECT id, role, seat_id FROM accounts ORDER BY created_at ASC',
  )
  for (const account of accounts.rows) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO conference_members
            (conference_id, account_id, role, seat_id, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        DEFAULT_CONFERENCE_ID,
        String(account.id),
        String(account.role) === 'chair' ? 'chair' : 'delegate',
        account.seat_id ? String(account.seat_id) : null,
        now,
      ],
    })
  }
}

async function seed(): Promise<void> {
  const db = getDb()
  await ensureInitialChair()

  const meeting = await db.execute(
    'SELECT conference_id FROM conference_meeting LIMIT 1',
  )
  if (meeting.rows.length === 0) {
    const state = createInitialState()
    await db.execute({
      sql: `INSERT OR IGNORE INTO conference_meeting
            (conference_id, state, revision, updated_at) VALUES (?, ?, 0, ?)`,
      args: [DEFAULT_CONFERENCE_ID, JSON.stringify(state), Date.now()],
    })
  }

  const time = await db.execute(
    'SELECT conference_id FROM conference_time LIMIT 1',
  )
  if (time.rows.length === 0) {
    const now = Date.now()
    await db.execute({
      sql: `INSERT OR IGNORE INTO conference_time
            (conference_id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (?, ?, 1, 0, ?, 0, NULL, ?)`,
      args: [DEFAULT_CONFERENCE_ID, now, now, now],
    })
  }
}

async function init(): Promise<void> {
  const db = getDb()
  await db.batch(SCHEMA)
  await ensureColumn('accounts', 'seat_id', 'seat_id TEXT')
  await ensureColumn(
    'events',
    'visibility',
    "visibility TEXT NOT NULL DEFAULT 'SECRET'",
  )
  await ensureColumn('events', 'conference_id', 'conference_id TEXT')
  await ensureColumn('files', 'conference_id', 'conference_id TEXT')
  await ensureColumn('archives', 'conference_id', 'conference_id TEXT')
  await ensureColumn('sessions', 'conference_id', 'conference_id TEXT')
  await ensureColumn('files', 'file_type', "file_type TEXT NOT NULL DEFAULT '其他'")
  await ensureColumn('files', 'scope', "scope TEXT NOT NULL DEFAULT 'DELEGATION'")
  await ensureColumn('files', 'delegation_id', 'delegation_id TEXT')
  await ensureColumn('files', 'co_sign', 'co_sign INTEGER NOT NULL DEFAULT 0')
  await ensureInitialChair()
  await ensureDefaultConference()
  await db.execute(
    `INSERT OR IGNORE INTO event_reads (event_id, account_id, read)
     SELECT event_id, account_id, read FROM event_recipients`,
  )
  await seed()
}

export function ensureDb(): Promise<void> {
  if (!initPromise) {
    initPromise = init().catch((error) => {
      initPromise = null
      throw error
    })
  }
  return initPromise
}

/** 仅测试 / 工具使用 */
export function createTestAccountId(): string {
  return createId('acc')
}
