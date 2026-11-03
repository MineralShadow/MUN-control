import * as webpushModule from 'web-push'

const webpush =
  (webpushModule as unknown as { default?: typeof webpushModule }).default ?? webpushModule
import { createId } from '../../src/lib/id.ts'
import { getDb } from './db.ts'

interface VapidConfig {
  publicKey: string
  privateKey: string
  subject: string
}

let cachedConfig: VapidConfig | null = null

async function getVapidConfig(): Promise<VapidConfig | null> {
  if (cachedConfig) return cachedConfig
  const db = getDb()
  let result = await db.execute('SELECT public_key, private_key, subject FROM push_config WHERE id = 1')
  let row = result.rows[0]
  if (!row) {
    const generated = webpush.generateVAPIDKeys()
    const subject =
      process.env.VAPID_SUBJECT?.trim() || 'mailto:admin@example.com'
    await db.execute({
      sql: `INSERT OR IGNORE INTO push_config (id, public_key, private_key, subject)
            VALUES (1, ?, ?, ?)`,
      args: [generated.publicKey, generated.privateKey, subject],
    })
    result = await db.execute('SELECT public_key, private_key, subject FROM push_config WHERE id = 1')
    row = result.rows[0]
  }
  if (!row) return null
  cachedConfig = {
    publicKey: String(row.public_key),
    privateKey: String(row.private_key),
    subject: String(row.subject),
  }
  webpush.setVapidDetails(
    cachedConfig.subject,
    cachedConfig.publicKey,
    cachedConfig.privateKey,
  )
  return cachedConfig
}

export async function getPushPublicKey(): Promise<string | null> {
  const config = await getVapidConfig()
  return config?.publicKey ?? null
}

export async function savePushSubscription(
  accountId: string,
  conferenceId: string,
  subscription: {
    endpoint?: unknown
    keys?: { p256dh?: unknown; auth?: unknown }
  },
): Promise<boolean> {
  const endpoint = typeof subscription.endpoint === 'string' ? subscription.endpoint : ''
  const p256dh = typeof subscription.keys?.p256dh === 'string' ? subscription.keys.p256dh : ''
  const auth = typeof subscription.keys?.auth === 'string' ? subscription.keys.auth : ''
  if (!endpoint || !p256dh || !auth) return false
  await getDb().execute({
    sql: `INSERT INTO push_subscriptions
          (id, conference_id, account_id, endpoint, p256dh, auth, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(endpoint) DO UPDATE SET
            conference_id = excluded.conference_id,
            account_id = excluded.account_id,
            p256dh = excluded.p256dh,
            auth = excluded.auth`,
    args: [createId('sub'), conferenceId, accountId, endpoint, p256dh, auth, Date.now()],
  })
  return true
}

export async function removePushSubscription(
  accountId: string,
  endpoint: string,
): Promise<void> {
  await getDb().execute({
    sql: 'DELETE FROM push_subscriptions WHERE account_id = ? AND endpoint = ?',
    args: [accountId, endpoint],
  })
}

export async function removePushSubscriptionsForAccount(accountId: string): Promise<void> {
  await getDb().execute({
    sql: 'DELETE FROM push_subscriptions WHERE account_id = ?',
    args: [accountId],
  })
}

export async function sendPushToAccounts(
  accountIds: string[],
  payload: { title: string; body: string; url?: string; tag?: string },
): Promise<void> {
  const ids = [...new Set(accountIds)]
  if (ids.length === 0) return
  const config = await getVapidConfig()
  if (!config) return
  const placeholders = ids.map(() => '?').join(',')
  const result = await getDb().execute({
    sql: `SELECT id, endpoint, p256dh, auth FROM push_subscriptions
          WHERE account_id IN (${placeholders})`,
    args: ids,
  })
  for (const row of result.rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: String(row.endpoint),
          keys: { p256dh: String(row.p256dh), auth: String(row.auth) },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url ?? '/#/events',
          tag: payload.tag ?? 'mun-event',
        }),
        { TTL: 60 * 60 * 24 },
      )
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode
      if (statusCode === 404 || statusCode === 410) {
        await getDb().execute({
          sql: 'DELETE FROM push_subscriptions WHERE id = ?',
          args: [String(row.id)],
        }).catch(() => undefined)
      } else {
        console.warn('[push] send failed', statusCode ?? error)
      }
    }
  }
}

/** 事件发布后向公开受众或秘密收件人推送系统通知 */
export async function sendEventPush(
  conferenceId: string,
  eventId: string,
): Promise<void> {
  const db = getDb()
  const event = await db.execute({
    sql: 'SELECT title, content, visibility FROM events WHERE id = ? AND conference_id = ? LIMIT 1',
    args: [eventId, conferenceId],
  })
  const row = event.rows[0]
  if (!row) return

  let audience: string[]
  if (String(row.visibility) === 'PUBLIC') {
    const members = await db.execute({
      sql: 'SELECT account_id FROM conference_members WHERE conference_id = ?',
      args: [conferenceId],
    })
    audience = members.rows.map((item) => String(item.account_id))
  } else {
    const recipients = await db.execute({
      sql: 'SELECT account_id FROM event_recipients WHERE event_id = ?',
      args: [eventId],
    })
    audience = recipients.rows.map((item) => String(item.account_id))
  }

  await sendPushToAccounts(audience, {
    title: String(row.title),
    body: String(row.content).slice(0, 140) || '会场有一则新事件',
    url: '/#/events',
    tag: `mun-event-${eventId}`,
  })
}
