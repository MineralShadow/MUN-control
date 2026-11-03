import { useRef, useState, type ChangeEvent } from 'react'
import { PageHeader } from '../components/PageHeader'
import { Segmented } from '../components/Segmented'
import { Toggle } from '../components/Toggle'
import { useConfirm } from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { AccountsManager } from '../features/settings/AccountsManager'
import { ArchivesManager } from '../features/settings/ArchivesManager'
import { formatDateTime } from '../lib/format'
import { apiFetch } from '../lib/api'
import {
  notificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from '../lib/notifications'
import { MAJORITY_OPTIONS, majorityLabel } from '../lib/voting'
import { useConference } from '../state/ConferenceContext'
import { exportStateFile, importStateFile } from '../state/storage'

export function SettingsPage() {
  const { state, me, dispatch, refresh, pollMs, setPollMs } = useConference()
  const confirm = useConfirm()
  const toast = useToast()
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    notificationPermission(),
  )
  const [archiveKey, setArchiveKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canEdit = me.role === 'chair'

  const settings = state.settings

  function handleExport() {
    if (!canEdit) return
    exportStateFile(state)
    toast('会议存档已开始下载', 'success')
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    if (!canEdit) return
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const next = await importStateFile(file)
      const ok = await confirm({
        title: '导入存档并覆盖当前会议数据？',
        message: `将替换为：${next.delegations.length} 个代表团、${next.sessions.length} 个会期、${next.resolutions.length} 项决议。账号、事件与文件不会被覆盖。`,
        confirmText: '导入并覆盖',
        danger: true,
      })
      if (!ok) return
      dispatch({ type: 'state/replace', state: next })
      toast('存档已导入', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '导入失败', 'danger')
    }
  }

  async function handleReset() {
    if (!canEdit) return
    const ok = await confirm({
      title: '彻底清空会场数据？',
      message:
        '会场名称、席位、会期、议题、决议、设置、会议时间、事件、文件、线上存档与所有代表账号都会删除；主席账号会保留。此操作不可撤销。',
      confirmText: '彻底清空',
      danger: true,
    })
    if (!ok) return
    try {
      await apiFetch('/admin/clear', { method: 'POST' })
      await refresh()
      setArchiveKey((value) => value + 1)
      toast('会场数据已彻底清空', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '清空失败', 'danger')
    }
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="SETTINGS"
        title="设置"
        description={
          canEdit
            ? '主席可以调整默认表决行为、管理代表账号与导出会议存档。所有改动会保存到会场服务器。'
            : '这里展示会场默认设置。只有主席可以修改设置、账号与数据。'
        }
      />

      <section className="settings-card">
        <div className="settings-card-head">
          <h2>默认表决要求</h2>
          <p>新建表决时默认选中的多数规则，仍可在表决前更改。</p>
        </div>
        {canEdit ? (
          <Segmented
            value={settings.defaultMajority}
            options={MAJORITY_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            onChange={(value) =>
              dispatch({ type: 'settings/patch', patch: { defaultMajority: value } })
            }
            ariaLabel="默认表决通过要求"
          />
        ) : (
          <div className="readonly-pill">{majorityLabel(settings.defaultMajority)}</div>
        )}
        <p className="hint">三种规则的共同点：弃权票不计入有效票。</p>
      </section>

      <section className="settings-card">
        <div className="settings-card-head">
          <h2>流程简化</h2>
          <p>会场节奏快时，可以跳过表决前的确认步骤。</p>
        </div>

        <div className="setting-row">
          <div className="setting-copy">
            <h3>跳过“确认否决国”步骤</h3>
            <p>开启后不再询问，仅全局一票否决权生效。</p>
          </div>
          <Toggle
            checked={settings.skipVetoStep}
            onChange={(checked) =>
              dispatch({ type: 'settings/patch', patch: { skipVetoStep: checked } })
            }
            label="跳过确认否决国步骤"
            disabled={!canEdit}
          />
        </div>

        <div className="setting-row">
          <div className="setting-copy">
            <h3>跳过“选择多数规则”步骤</h3>
            <p>开启后直接使用上面的默认表决要求。</p>
          </div>
          <Toggle
            checked={settings.skipMajorityStep}
            onChange={(checked) =>
              dispatch({ type: 'settings/patch', patch: { skipMajorityStep: checked } })
            }
            label="跳过选择多数规则步骤"
            disabled={!canEdit}
          />
        </div>
      </section>

      {canEdit ? <AccountsManager /> : null}
      {canEdit ? <ArchivesManager key={archiveKey} /> : null}

      {canEdit ? (
        <section className="settings-card">
          <div className="settings-card-head">
            <h2>会议数据管理</h2>
            <p>
              只备份会议规则数据（主题、席位、会期、决议）；账号、事件与文件由服务器单独保存。
            </p>
          </div>

          <div className="setting-row">
            <div className="setting-copy">
              <h3>导出 JSON 存档</h3>
              <p>包含会议主题、席位、会期与全部表决快照。</p>
            </div>
            <button type="button" className="btn btn-ghost" onClick={handleExport}>
              导出存档
            </button>
          </div>

          <div className="setting-row">
            <div className="setting-copy">
              <h3>导入 JSON 存档</h3>
              <p>导入会覆盖当前会议数据，请确认文件来源。</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="visually-hidden"
              onChange={handleImport}
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              选择文件
            </button>
          </div>

          <div className="setting-row setting-row-danger">
            <div className="setting-copy">
              <h3>彻底清空会场数据</h3>
              <p>删除会场名称、时间、事件、文件、存档与代表账号；保留主席账号。</p>
            </div>
            <button type="button" className="btn btn-danger" onClick={handleReset}>
              清空
            </button>
          </div>

          <div className="settings-foot">
            数据版本 v{state.schemaVersion} · 最后保存 {formatDateTime(state.updatedAt)} ·
            数据存于会场服务器
          </div>
        </section>
      ) : (
        <div className="notice">账号管理、数据导入导出与清空仅主席可见。</div>
      )}

      <section className="settings-card">
        <div className="settings-card-head">
          <h2>刷新与通知</h2>
          <p>刷新频率只影响当前浏览器；事件仍在服务端按会议时间发布。</p>
        </div>

        <div className="setting-row">
          <div className="setting-copy">
            <h3>数据刷新频率</h3>
            <p>默认 2 秒；5 秒 / 10 秒更省流量，但事件提醒会更慢。</p>
          </div>
          <Segmented
            value={String(pollMs)}
            options={[
              { value: '2000', label: '2 秒' },
              { value: '5000', label: '5 秒' },
              { value: '10000', label: '10 秒' },
            ]}
            onChange={(value) => setPollMs(Number(value))}
            ariaLabel="数据刷新频率"
            size="sm"
          />
        </div>

        <div className="setting-row">
          <div className="setting-copy">
            <h3>浏览器通知</h3>
            <p>
              授权后，页面在后台标签页时收到公开或发给你的秘密事件，会弹出系统通知。
              浏览器完全关闭时不保证送达；要彻底离线推送需要 Web Push。
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={permission === 'granted' || permission === 'unsupported'}
            onClick={() => {
              void requestNotificationPermission().then((next) => {
                setPermission(next)
                if (next === 'granted') toast('已启用浏览器通知', 'success')
                else if (next === 'denied') toast('通知权限被拒绝，可在浏览器设置中恢复', 'danger')
                else if (next === 'unsupported') toast('当前浏览器不支持通知', 'danger')
              })
            }}
          >
            {permission === 'granted'
              ? '通知已启用'
              : permission === 'denied'
                ? '通知已被拒绝'
                : permission === 'unsupported'
                  ? '浏览器不支持'
                  : '启用通知'}
          </button>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card-head">
          <h2>当前登录</h2>
          <p>退出登录请使用右上角的「退出」按钮。</p>
        </div>
        <div className="current-user-card">
          <div>
            <strong>{me.name}</strong>
            <span>账号：{me.username}</span>
          </div>
          <span className={`role-badge role-${me.role}`}>
            {me.role === 'chair' ? '主席' : '代表'}
          </span>
        </div>
      </section>
    </div>
  )
}
