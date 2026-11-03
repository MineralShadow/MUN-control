import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { serve } from '@hono/node-server'
import { createClient } from '@libsql/client/node'
import { setLocalClient } from './api/db.ts'
import { app } from './api/app.ts'

if (!process.env.TURSO_DATABASE_URL) {
  const file = process.env.LOCAL_DB_FILE ?? './.data/mun.db'
  mkdirSync(dirname(file), { recursive: true })
  setLocalClient(createClient({ url: `file:${file}` }))
}

const port = Number(process.env.PORT ?? 8787)
const hostname = process.env.HOST ?? '127.0.0.1'

serve(
  {
    fetch: app.fetch,
    port,
    hostname,
  },
  (info) => {
    console.log(`MUN API listening on http://${hostname}:${info.port}`)
  },
)
