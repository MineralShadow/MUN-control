import { app } from './api/app.ts'

/**
 * Vercel Node.js Function 入口。
 * 这个文件会被 esbuild 预打包成 api/index.js，避免 Vercel 直接运行 API 目录里的
 * .ts 辅助文件（它不会正确解析这些 .ts 依赖）。
 */
const handler = (request: Request) => app.fetch(request)

export const GET = handler
export const HEAD = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
