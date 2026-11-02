import { ensureDb, getDb } from './db.ts'

export default {
  async fetch() {
    const env = {
      hasDatabaseUrl: Boolean(process.env.TURSO_DATABASE_URL),
      hasAuthToken: Boolean(process.env.TURSO_AUTH_TOKEN),
      node: process.version,
    }
    try {
      await ensureDb()
      const result = await getDb().execute('SELECT 1 AS ok')
      return Response.json({
        ok: true,
        env,
        probe: Number(result.rows[0]?.ok ?? 0),
      })
    } catch (error) {
      return Response.json(
        {
          ok: false,
          env,
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  },
}
