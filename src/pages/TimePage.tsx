import { useEffect, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { useMeetingClock } from '../components/ServerClock'
import { useToast } from '../components/Toast'
import { apiFetch } from '../lib/api'
import {
  formatClock,
  formatRate,
  fromDatetimeLocal,
  toDatetimeLocal,
} from '../lib/format'
import { useConference } from '../state/ConferenceContext'

type TimeAction = 'set' | 'start' | 'pause' | 'rate' | 'clearCrisis'

export function TimePage() {
  const { time, me, refresh } = useConference()
  const toast = useToast()
  const canEdit = me.role === 'chair'
  const now = useMeetingClock(time)

  const [draft, setDraft] = useState(() => toDatetimeLocal(time.currentMs))
  const [rateDraft, setRateDraft] = useState(String(time.rate))
  const [busy, setBusy] = useState<TimeAction | null>(null)

  useEffect(() => {
    if (document.activeElement?.id !== 'time-input') {
      setDraft(toDatetimeLocal(time.currentMs))
    }
  }, [time.currentMs])

  useEffect(() => {
    if (document.activeElement?.id !== 'rate-input') {
      setRateDraft(String(time.rate))
    }
  }, [time.rate])

  async function run(action: TimeAction, value?: number) {
    setBusy(action)
    try {
      await apiFetch('/time', { method: 'POST', json: { action, value } })
      await refresh()
      toast('时间设置已更新', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '时间设置失败', 'danger')
    } finally {
      setBusy(null)
    }
  }

  function applyDateTime() {
    const timestamp = fromDatetimeLocal(draft)
    if (timestamp === null) {
      toast('请选择有效的日期时间', 'danger')
      return
    }
    void run('set', timestamp)
  }

  function applyRate(value?: number) {
    const rate = value ?? Number(rateDraft)
    if (!Number.isFinite(rate) || rate <= 0 || rate > 1000) {
      toast('流速请输入 0 到 1000 之间的数字', 'danger')
      return
    }
    void run('rate', rate)
  }

  const statusText = time.crisisPaused
    ? '危机暂停'
    : time.running
      ? '时间流动中'
      : '已暂停'

  return (
    <div className="stack">
      <PageHeader
        eyebrow="MEETING CLOCK"
        title="时间"
        description="会场时间独立于现实时间，由主席团控制。事件可以按会议时间定时发布；危机事件发布时会立刻暂停时间流动。"
      />

      <section className="time-hero">
        <div>
          <div className="eyebrow">CURRENT MEETING TIME</div>
          <div className="time-clock">{formatClock(now)}</div>
          <div className={`time-status time-status-${time.crisisPaused ? 'crisis' : time.running ? 'running' : 'paused'}`}>
            {statusText}
            {time.running ? <span> · 流速 ×{formatRate(time.rate)}</span> : null}
            {time.crisisPaused ? <span> · 请先解除危机暂停</span> : null}
          </div>
        </div>
        <div className="time-summary">
          <div>
            <span>当前流速</span>
            <strong>×{formatRate(time.rate)}</strong>
          </div>
          <div>
            <span>时间状态</span>
            <strong>{time.running ? '流动' : '暂停'}</strong>
          </div>
          <div>
            <span>危机状态</span>
            <strong>{time.crisisPaused ? '危机暂停' : '正常'}</strong>
          </div>
        </div>
      </section>

      {time.crisisPaused ? (
        <div className="crisis-banner">
          <div>
            <strong>危机事件已暂停时间流动</strong>
            <p>
              处理完危机后，先解除危机暂停；时间不会自动恢复流动，需由主席重新开始。
            </p>
          </div>
          {canEdit ? (
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy !== null}
              onClick={() => void run('clearCrisis')}
            >
              解除危机暂停
            </button>
          ) : null}
        </div>
      ) : null}

      {canEdit ? (
        <section className="settings-card time-controls">
          <div className="settings-card-head">
            <h2>主席时间控制台</h2>
            <p>仅主席可修改；代表只能查看当前会议时间。</p>
          </div>

          <div className="time-grid">
            <div className="time-control-block">
              <h3>设定当前时间</h3>
              <p>把会议时间直接拨到指定时刻，不影响流速与流动状态。</p>
              <div className="time-input-row">
                <input
                  id="time-input"
                  className="input"
                  type="datetime-local"
                  step="1"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy !== null}
                  onClick={applyDateTime}
                >
                  设定
                </button>
              </div>
            </div>

            <div className="time-control-block">
              <h3>时间流动</h3>
              <p>开始或暂停时间。暂停后会议时间不再前进。</p>
              <div className="time-button-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy !== null || time.running || time.crisisPaused}
                  onClick={() => void run('start')}
                >
                  {time.crisisPaused ? '危机暂停中' : '开始流动'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busy !== null || !time.running}
                  onClick={() => void run('pause')}
                >
                  暂停
                </button>
              </div>
            </div>

            <div className="time-control-block">
              <h3>时间流速</h3>
              <p>输入阿拉伯数字。1 = 现实速度，2 = 两倍速，0.5 = 半速。</p>
              <div className="time-input-row">
                <input
                  id="rate-input"
                  className="input"
                  inputMode="decimal"
                  value={rateDraft}
                  onChange={(event) => setRateDraft(event.target.value)}
                  aria-label="时间流速"
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy !== null}
                  onClick={() => applyRate()}
                >
                  应用
                </button>
              </div>
              <div className="rate-presets">
                {[1, 2, 5, 10].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`rate-chip${Number(rateDraft) === value ? ' active' : ''}`}
                    onClick={() => {
                      setRateDraft(String(value))
                      applyRate(value)
                    }}
                    disabled={busy !== null}
                  >
                    ×{value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="notice">
          时间由主席团控制。代表可以查看会议时间，但不能修改。
        </div>
      )}

      <div className="notice">
        提醒：定时事件只有在「会议时间」到达事件时间时才会发布。若会场没有打开任何页面，事件会等到下一次有人访问时补发。
      </div>
    </div>
  )
}
