import { ensureDb } from './api/db.ts'
import { publishAllDueEvents } from './api/events.ts'

/**
 * 由 GitHub Actions（或 Pro 计划的 Vercel Cron）定时调用。
 * 不在网站时也能把到点的会议事件发布出去。
 */
const handler = async (request: Request) => {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }
  }
  await ensureDb()
  await publishAllDueEvents()
  return Response.json({ ok: true, at: Date.now() })
}

export const GET = handler
export const POST = handler
