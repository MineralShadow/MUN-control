import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AccountInfo,
  Bootstrap,
  ConferenceSummary,
  MyMembership,
  ConferenceState,
  CouncilEvent,
  SessionUser,
  SubmittedFile,
  TimeState,
} from '../types'
import type { Action } from './reducer'
import { ApiError, apiFetch } from '../lib/api'
import { LoginPage } from '../pages/LoginPage'
import { useToast } from '../components/Toast'

interface ConferenceContextValue {
  me: SessionUser
  state: ConferenceState
  time: TimeState
  events: CouncilEvent[]
  files: SubmittedFile[]
  accounts: AccountInfo[]
  conferences: ConferenceSummary[]
  myMembership: MyMembership | null
  revision: number
  serverNow: number
  pollMs: number
  setPollMs: (ms: number) => void
  dispatch: (action: Action) => void
  refresh: () => Promise<void>
  switchToConference: (conferenceId: string) => Promise<void>
  logout: () => Promise<void>
}

const ConferenceContext = createContext<ConferenceContextValue | null>(null)

function mergeBootstrap(previous: Bootstrap | null, next: Bootstrap): Bootstrap {
  if (!previous) return next
  return {
    ...next,
    conference:
      next.revision >= previous.revision ? next.conference : previous.conference,
  }
}

const POLL_KEY = 'mun_poll_ms'
const POLL_OPTIONS = [2000, 5000, 10000]

export function ConferenceProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [data, setData] = useState<Bootstrap | null>(null)
  const [pollMs, setPollMsState] = useState(() => {
    if (typeof window === 'undefined') return 2000
    const saved = Number(window.localStorage.getItem(POLL_KEY))
    return POLL_OPTIONS.includes(saved) ? saved : 2000
  })
  const [loading, setLoading] = useState(true)
  const [fatal, setFatal] = useState<string | null>(null)

  const load = useCallback(
    async (silent: boolean) => {
      try {
        const next = await apiFetch<Bootstrap>('/bootstrap')
        setData((previous) => mergeBootstrap(previous, next))
        setFatal(null)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setData(null)
          return
        }
        if (!silent) {
          const message =
            error instanceof Error ? error.message : '无法连接会议服务器'
          setFatal(message)
        }
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void load(false)
  }, [load])

  useEffect(() => {
    if (!data?.me) return

    const interval = window.setInterval(() => {
      // 后台标签页也轮询，才能接收事件通知；浏览器可能会自动降频。
      void load(true)
    }, pollMs)

    const onVisible = () => {
      if (document.visibilityState === 'visible') void load(true)
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [data?.me, load, pollMs])

  const setPollMs = useCallback((ms: number) => {
    if (!POLL_OPTIONS.includes(ms)) return
    setPollMsState(ms)
    if (typeof window !== 'undefined') window.localStorage.setItem(POLL_KEY, String(ms))
  }, [])

  const refresh = useCallback(async () => {
    await load(false)
  }, [load])

  const switchToConference = useCallback(async (conferenceId: string) => {
    await apiFetch('/auth/switch', { method: 'POST', json: { conferenceId } })
    window.location.reload()
  }, [])

  const login = useCallback(
    async (username: string, password: string) => {
      await apiFetch('/auth/login', {
        method: 'POST',
        json: { username, password },
      })
      await load(false)
    },
    [load],
  )

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } finally {
      setData(null)
    }
  }, [])

  const dispatch = useCallback(
    async (action: Action) => {
      if (!data || data.me.role !== 'chair') {
        toast('只有主席可以修改会议数据', 'danger')
        return
      }
      try {
        const result = await apiFetch<{
          conference: ConferenceState
          revision: number
        }>('/conference/action', {
          method: 'POST',
          json: { action },
        })
        setData((previous) => {
          if (!previous) return previous
          if (result.revision < previous.revision) return previous
          return {
            ...previous,
            conference: result.conference,
            revision: result.revision,
          }
        })
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setData(null)
          return
        }
        toast(error instanceof Error ? error.message : '操作失败', 'danger')
      }
    },
    [data, toast],
  )

  const value = useMemo<ConferenceContextValue | null>(() => {
    if (!data) return null
    return {
      me: data.me,
      state: data.conference,
      time: data.time,
      events: data.events,
      files: data.files,
      accounts: data.accounts,
      conferences: data.conferences,
      myMembership: data.myMembership,
      revision: data.revision,
      serverNow: data.serverNow,
      pollMs,
      setPollMs,
      dispatch,
      refresh,
      switchToConference,
      logout,
    }
  }, [data, dispatch, refresh, switchToConference, logout, pollMs, setPollMs])

  if (loading && !data) {
    return (
      <div className="boot-screen">
        <div className="boot-card">
          <span className="seal" aria-hidden="true">
            <span>MUN</span>
          </span>
          <p>正在连接会场…</p>
        </div>
      </div>
    )
  }

  if (!data) {
    if (fatal) {
      return (
        <div className="boot-screen">
          <div className="boot-card boot-error">
            <span className="eyebrow">CONNECTION ERROR</span>
            <h1>无法连接会议数据库</h1>
            <p>{fatal}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setLoading(true)
                setFatal(null)
                void load(false)
              }}
            >
              重试
            </button>
            <p className="boot-hint">
              部署到 Vercel 时，请确认已配置 TURSO_DATABASE_URL 与 TURSO_AUTH_TOKEN，
              并且修改环境变量后重新部署。
            </p>
            <p className="boot-hint">
              服务端诊断地址：/api?route=/health（返回环境变量是否存在、数据库是否连通）。
            </p>
          </div>
        </div>
      )
    }
    return <LoginPage onLogin={login} />
  }

  return <ConferenceContext.Provider value={value}>{children}</ConferenceContext.Provider>
}

export function useConference(): ConferenceContextValue {
  const value = useContext(ConferenceContext)
  if (!value) throw new Error('useConference 必须在登录后的 ConferenceProvider 内使用')
  return value
}
