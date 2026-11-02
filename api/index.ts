import { getRequestListener } from '@hono/node-server'
import { app } from './app.ts'

const nodeHandler = getRequestListener(app.fetch)

/**
 * Vercel 函数入口。
 * - 新版 Web Handler 只传 request：直接交给 Hono；
 * - 如果运行时仍使用 Node 的 (req, res) 形式：退回 Node listener，兼容两种模式。
 * 真实接口路由在 ?route=/auth/login 这类查询参数中。
 */
function handler(request: Request, response?: unknown) {
  if (
    response &&
    typeof (response as { setHeader?: unknown }).setHeader === 'function'
  ) {
    return nodeHandler(request as never, response as never)
  }
  return app.fetch(request)
}

// 同时满足“默认函数”和“{ fetch } Web Handler”两种函数入口约定
export default Object.assign(handler, { fetch: handler })
