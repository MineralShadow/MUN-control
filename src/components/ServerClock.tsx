import { useEffect, useState } from 'react'
import { formatClock, formatRate } from '../lib/format'
import type { TimeState } from '../types'

/** 基于服务端时间状态本地平滑走时；每次轮询回来会校准一次 */
export function useMeetingClock(time: TimeState): number {
  const [now, setNow] = useState(time.currentMs)

  useEffect(() => {
    setNow(time.currentMs)
    if (!time.running) return

    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      setNow(time.currentMs + (Date.now() - startedAt) * time.rate)
    }, 250)

    return () => window.clearInterval(interval)
  }, [time.currentMs, time.running, time.rate])

  return now
}

export function ServerClock({ time }: { time: TimeState }) {
  const now = useMeetingClock(time)
  const text = formatClock(now)
  const [date, clock] = text.split(' ')

  const status = time.crisisPaused
    ? '危机暂停'
    : time.running
      ? `×${formatRate(time.rate)}`
      : '已暂停'

  return (
    <div
      className={`server-clock${time.crisisPaused ? ' is-crisis' : ''}${
        time.running ? ' is-running' : ''
      }`}
      title="会议时间"
    >
      <span className="clock-date">{date}</span>
      <span className="clock-time">{clock}</span>
      <span className="clock-status">{status}</span>
    </div>
  )
}
