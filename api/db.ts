import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Client } from '@libsql/client'
import { createInitialState } from '../src/state/defaults.ts'
import { createId } from '../src/lib/id.ts'
import { hashPassword } from './password.ts'

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL
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
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    event_time INTEGER NOT NULL,
    is_crisis INTEGER NOT NULL DEFAULT 0,
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
  `CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    data BLOB NOT NULL,
    submitted_by TEXT NOT NULL,
    submitted_at INTEGER NOT NULL,
    read INTEGER NOT NULL DEFAULT 0
  )`,
]

let clientPromise: Promise<Client> | null = null
let resolvedClient: Client | null = null
let initPromise: Promise<void> | null = null

function resolveDatabaseUrl(): string {
  const configured = process.env.TURSO_DATABASE_URL
  if (!configured && process.env.VERCEL) {
    throw new Error('未配置 TURSO_DATABASE_URL，请在 Vercel 环境变量中设置数据库地址')
  }
  return configured ?? 'file:./.data/mun.db'
}

/**
 * 本地开发用 file:（Node + 原生 SQLite），线上用Turso HTTP 客户端。
 * 注意：不能用 `@libsql/client` 默认入口静态导入——它在 Vercel 上可能加载
 * 原生 libsql 二进制并导致 FUNCTION_INVOCATION_FAILED。
 */
async function createDbClient(): Promise<Client> {
  const url = resolveDatabaseUrl()

  if (url.startsWith('file:')) {
    const filePath = url.slice('file:'.length)
    mkdirSync(dirname(filePath), { recursive: true })
    const { createClient } = await import('@libsql/client/node')
    return createClient({ url })
  }

  const { createClient } = await import('@libsql/client/http')
  return createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
}

function getClient(): Promise<Client> {
  if (resolvedClient) return Promise.resolve(resolvedClient)
  if (!clientPromise) {
    clientPromise = createDbClient()
      .then((client) => {
        resolvedClient = client
        return client
      })
      .catch((error) => {
        clientPromise = null
        throw error
      })
  }
  return clientPromise
}

/**
 * 同步返回一个惰性代理：真正的方法调用（execute/batch）才触发连接初始化。
 * 这样现有业务代码可以继续写 `const db = getDb(); await db.execute(...)`。
 */
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

async function seed(): Promise<void> {
  const db = getDb()

  const chair = await db.execute(
    "SELECT id FROM accounts WHERE role = 'chair' LIMIT 1",
  )
  if (chair.rows.length === 0) {
    const now = Date.now()
    await db.execute({
      sql: `INSERT OR IGNORE INTO accounts (id, username, password, name, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['chair', '123456', hashPassword('abcd'), '主席团', 'chair', now],
    })
  }

  const meeting = await db.execute('SELECT id FROM meeting WHERE id = 1')
  if (meeting.rows.length === 0) {
    const state = createInitialState()
    await db.execute({
      sql: 'INSERT OR IGNORE INTO meeting (id, state, revision, updated_at) VALUES (1, ?, 0, ?)',
      args: [JSON.stringify(state), Date.now()],
    })
  }

  const time = await db.execute('SELECT id FROM time_state WHERE id = 1')
  if (time.rows.length === 0) {
    const now = Date.now()
    await db.execute({
      sql: `INSERT OR IGNORE INTO time_state
            (id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (1, ?, 1, 0, ?, 0, NULL, ?)`,
      args: [now, now, now],
    })
  }
}

async function init(): Promise<void> {
  const db = getDb()
  await db.batch(SCHEMA)
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
