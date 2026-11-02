import { app } from './app.ts'

/**
 * Vercel Node.js Function：新运行时用命名 HTTP 方法导出，并传入 Web Request。
 * 不要用 default function / default { fetch }，否则会被当成 Edge 或 Node (req,res)，
 * 导致 Node 内置模块（crypto、Buffer 等）不可用或请求挂起。
 */
const handler = (request: Request) => app.fetch(request)

export const GET = handler
export const HEAD = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
