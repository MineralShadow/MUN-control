import { Hono } from 'hono'

const app = new Hono()
app.get('/api/diag-hono', (c) => c.json({ ok: true, lib: 'hono' }))

export default {
  fetch(request: Request) {
    return app.fetch(request)
  },
}
