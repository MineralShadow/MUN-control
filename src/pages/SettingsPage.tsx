import { useRef, useState, type ChangeEvent } from 'react'
import { PageHeader } from '../components/PageHeader'
import { Segmented } from '../components/Segmented'
import { Toggle } from '../components/Toggle'
import { useConfirm } from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { AccountsManager } from '../features/settings/AccountsManager'
import { ArchivesManager } from '../features/settings/ArchivesManager'
import { ConferenceManager } from '../features/settings/ConferenceManager'
import { DataScopeDialog } from '../components/DataScopeDialog'
import type { DataCategoryId } from '../lib/dataCategories'
import { formatDateTime } from '../lib/format'
import { apiFetch } from '../lib/api'
import {
  notificationPermission,
  type NotificationPermissionState,
} from '../lib/notifications'
import {
  disablePush,
  enablePush,
  pushEnabledLocally,
  pushSupported,
} from '../lib/push'
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
  const [pushOn, setPushOn] = useState(() => pushEnabledLocally())
  const [archiveKey, setArchiveKey] = useState(0)
  const [clearOpen, setClearOpen] = useState(false)
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

  async function performClear(categories: DataCategoryId[]) {
    if (!canEdit) return
    try {
      await apiFetch('/admin/clear', { method: 'POST', json: { include: categories } })
      await refresh()
      setArchiveKey((value) => value + 1)
      setClearOpen(false)
      toast('已清除所选会场数据', 'success')
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

      <ConferenceManager />

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
              <h3>清除当前会场数据</h3>
              <p>清除前可选择类别；只影响当前会场，线上存档保留。</p>
            </div>
            <button type="button" className="btn btn-danger" onClick={() => setClearOpen(true)}>
              选择清除
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
            <p>默认 1 秒；2 秒 / 5 秒更省流量，但事件提醒会更慢。</p>
          </div>
          <Segmented
            value={String(pollMs)}
            options={[
              { value: '1000', label: '1 秒' },
              { value: '2000', label: '2 秒' },
              { value: '5000', label: '5 秒' },
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
              通过 Web Push 订阅后，即使网页完全关闭，公开事件或发给你的秘密事件也会在电脑右下角弹出系统通知。
              需要 HTTPS；iOS 需先把网站添加到主屏幕。
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!pushSupported() && permission !== 'denied'}
            onClick={() => {
              if (pushOn) {
                void disablePush().then(() => {
                  setPushOn(false)
                  setPermission(notificationPermission())
                  toast('已关闭桌面推送', 'success')
                })
                return
              }
              void enablePush().then((result) => {
                setPermission(notificationPermission())
                if (result === 'granted') {
                  setPushOn(true)
                  toast('已启用桌面推送：关闭网页也能收到事件通知', 'success')
                } else if (result === 'denied') {
                  toast('通知权限被拒绝，可在浏览器设置中恢复', 'danger')
                } else if (result === 'unsupported') {
                  toast('当前浏览器不支持 Web Push；iOS 需先添加到主屏幕', 'danger')
                } else {
                  toast('推送订阅失败，请确认站点使用 HTTPS 并重试', 'danger')
                }
              })
            }}
          >
            {pushOn
              ? '关闭桌面推送'
              : permission === 'denied'
                ? '通知已被拒绝'
                : pushSupported()
                  ? '启用桌面推送'
                  : '浏览器不支持推送'}
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

      <DataScopeDialog
        open={clearOpen}
        mode="clear"
        onClose={() => setClearOpen(false)}
        onConfirm={(categories) => void performClear(categories)}
      />
    </div>
  )
}
