import { useEffect, useState, type ReactNode } from 'react'

export type RoutePath =
  | '/'
  | '/seats'
  | '/sessions'
  | '/voting'
  | '/time'
  | '/events'
  | '/files'
  | '/settings'

export interface NavItem {
  path: RoutePath
  label: string
  en: string
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: '主页', en: 'HOME' },
  { path: '/seats', label: '席位', en: 'SEATS' },
  { path: '/sessions', label: '会期', en: 'SESSIONS' },
  { path: '/voting', label: '投票', en: 'VOTING' },
  { path: '/time', label: '时间', en: 'TIME' },
  { path: '/events', label: '事件', en: 'EVENTS' },
  { path: '/files', label: '文件', en: 'FILES' },
  { path: '/settings', label: '设置', en: 'SETTINGS' },
]

type NavigationGuard = (to: RoutePath) => void

let navigationGuard: NavigationGuard | null = null

export function setNavigationGuard(guard: NavigationGuard | null): void {
  navigationGuard = guard
}

export function normalizePath(hash: string): RoutePath {
  const raw = hash.replace(/^#/, '').split('?')[0].replace(/\/+$/, '') || '/'
  return (NAV_ITEMS.some((item) => item.path === raw) ? raw : '/') as RoutePath
}

export function useRoute(): RoutePath {
  const [route, setRoute] = useState<RoutePath>(() =>
    typeof window === 'undefined' ? '/' : normalizePath(window.location.hash),
  )

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/')
    }
    const handleHashChange = () => setRoute(normalizePath(window.location.hash))
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return route
}

export function navigate(path: RoutePath): void {
  if (window.location.hash !== `#${path}`) {
    window.location.hash = path
  }
}

interface LinkProps {
  to: RoutePath
  className?: string
  activeClassName?: string
  children: ReactNode
  onClick?: () => void
  title?: string
}

/** 站内链接：统一走 hash 路由，并经过全局导航守卫 */
export function Link({
  to,
  className = '',
  activeClassName,
  children,
  onClick,
  title,
}: LinkProps) {
  const route = useRoute()
  const active = route === to

  return (
    <a
      href={`#${to}`}
      className={`${className}${active && activeClassName ? ` ${activeClassName}` : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={(event) => {
        if (navigationGuard) {
          event.preventDefault()
          navigationGuard(to)
        }
        onClick?.()
      }}
      title={title}
    >
      {children}
    </a>
  )
}

export function routeLabel(route: RoutePath): string {
  return NAV_ITEMS.find((item) => item.path === route)?.label ?? '主页'
}
