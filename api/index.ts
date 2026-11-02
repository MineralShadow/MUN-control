import { app } from './app.ts'

/**
 * Vercel 的 Web Handler 入口必须导出一个带 fetch 方法的对象。
 * 不能导出函数，也不能用 Object.assign；实测函数形式会被当成 Node (req,res)
 * 处理，导致请求挂起或 FUNCTION_INVOCATION_FAILED。
 */
export default {
  fetch(request: Request) {
    return app.fetch(request)
  },
}
