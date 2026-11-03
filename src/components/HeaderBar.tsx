import { useEffect, useState } from 'react'
import { Link, NAV_ITEMS, type RoutePath } from '../router'
import { useConference } from '../state/ConferenceContext'
import { getCurrentSession, getCurrentTopic } from '../state/selectors'
import { useConfirm } from './ConfirmDialog'
import { ServerClock } from './ServerClock'

export function HeaderBar({ route }: { route: RoutePath }) {
  const { state, me, time, conferences, switchToConference, logout } = useConference()
  const confirm = useConfirm()
  const [menuOpen, setMenuOpen] = useState(false)

  const session = getCurrentSession(state)
  const topic = getCurrentTopic(state)
  const agendaText = session
    ? `${session.name} · ${topic ? topic.name : '尚未选择议题'}`
    : '尚未选择当前议题'

  useEffect(() => {
    setMenuOpen(false)
  }, [route])

  async function handleLogout() {
    const ok = await confirm({
      title: '退出登录？',
      message: '退出后需要重新输入账号密码才能进入会场。',
      confirmText: '退出登录',
    })
    if (ok) void logout()
  }

  return (
    <header className="header">
      <div className="header-top container">
        <div className="brand">
          <Link to="/" className="brand-main" title="返回主页">
            <span className="seal" aria-hidden="true">
              <span>MUN</span>
            </span>
            <span className="brand-text">
              <span className="conference-title">{state.theme || '历史委员会'}</span>
              <span className="conference-kicker">会场控制台 · CONFERENCE CONSOLE</span>
              <span className="conference-subtitle mobile-only">{agendaText}</span>
            </span>
          </Link>

          {session ? (
            <div className="agenda-chip" title={agendaText}>
              <span className="agenda-chip-session">{session.name}</span>
              <span className="agenda-chip-topic">
                {topic ? topic.name : '尚未选择议题'}
              </span>
            </div>
          ) : null}
        </div>

        <div className="header-tools">
          {conferences.length > 1 ? (
            <label className="conference-switcher">
              <span>会场</span>
              <select
                value={me.conferenceId}
                onChange={(event) => void switchToConference(event.target.value)}
                aria-label="切换会场"
              >
                {conferences.map((conference) => (
                  <option key={conference.id} value={conference.id}>
                    {conference.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <ServerClock time={time} />
          <div className="user-chip">
            <span className="user-name">{me.name}</span>
            <span className={`role-badge role-${me.role}`}>
              {me.role === 'chair' ? '主席' : '代表'}
            </span>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              退出
            </button>
          </div>

          <button
            type="button"
            className={`menu-btn${menuOpen ? ' open' : ''}`}
            aria-label={menuOpen ? '收起菜单' : '展开菜单'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`nav-bar${menuOpen ? ' open' : ''}`}>
        <nav className="nav container" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="nav-link"
              activeClassName="active"
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-label">{item.label}</span>
              <span className="nav-en" aria-hidden="true">
                {item.en}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
