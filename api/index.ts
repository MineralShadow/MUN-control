const handler = async (request: Request) => {
  try {
    // 动态导入：如果模块加载阶段抛错，可以把真实错误返回给诊断请求，
    // 而不是让 Vercel 只显示 FUNCTION_INVOCATION_FAILED。
    const { app } = await import('./app.ts')
    return await app.fetch(request)
  } catch (error) {
    console.error('[api]', error)
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export const GET = handler
export const HEAD = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
