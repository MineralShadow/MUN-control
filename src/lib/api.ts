export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiOptions extends Omit<RequestInit, 'body'> {
  json?: unknown
  body?: BodyInit | null
}

/** 统一请求 /api，携带 Cookie，并把服务端错误转成 ApiError */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { json, ...rest } = options
  const headers = new Headers(rest.headers)
  let body = rest.body

  if (json !== undefined) {
    body = JSON.stringify(json)
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`/api?route=${encodeURIComponent(path)}`, {
    credentials: 'include',
    ...rest,
    headers,
    body,
  })

  const contentType = response.headers.get('content-type') ?? ''
  let payload: unknown = null
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null)
  } else {
    payload = await response.text()
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `请求失败（${response.status}）`
    throw new ApiError(response.status, message)
  }

  return payload as T
}
