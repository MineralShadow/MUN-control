import { useEffect, type ReactNode } from 'react'
import { routeLabel, type RoutePath } from '../router'
import { useConference } from '../state/ConferenceContext'
import { EventAlerts } from './EventAlerts'
import { HeaderBar } from './HeaderBar'

interface AppShellProps {
  route: RoutePath
  children: ReactNode
}

export function AppShell({ route, children }: AppShellProps) {
  const { state } = useConference()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [route])

  useEffect(() => {
    document.title = `${routeLabel(route)} · ${state.theme || '会场控制台'}`
  }, [route, state.theme])

  return (
    <div className="app">
      <HeaderBar route={route} />
      <EventAlerts />
      <main className="app-main">
        <div className="container">{children}</div>
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <span>{state.theme} · 会场控制台</span>
          <span>会议数据保存在会场服务器，请勿在公屏投放主席界面</span>
        </div>
      </footer>
    </div>
  )
}
