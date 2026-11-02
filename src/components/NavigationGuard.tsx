import { useEffect, type ReactNode } from 'react'
import { useConfirm } from './ConfirmDialog'
import { useConference } from '../state/ConferenceContext'
import { navigate, setNavigationGuard, useRoute } from '../router'

/**
 * 主席点击「事件 / 文件」时先确认没有投屏给代表。
 * 代表不受此限制。
 */
export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const { me } = useConference()
  const route = useRoute()
  const confirm = useConfirm()

  useEffect(() => {
    setNavigationGuard((to) => {
      if (to === route) return

      if (me.role === 'chair' && (to === '/events' || to === '/files')) {
        const label = to === '/events' ? '事件' : '文件'
        void confirm({
          title: `进入${label}界面？`,
          message: `是否确认进入${label}界面？请确保未公屏投放给代表。`,
          confirmText: '确认进入',
          cancelText: '取消',
        }).then((ok) => {
          if (ok) navigate(to)
        })
        return
      }

      navigate(to)
    })

    return () => setNavigationGuard(null)
  }, [confirm, me.role, route])

  return <>{children}</>
}
