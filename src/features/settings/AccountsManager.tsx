import { useState, type FormEvent } from 'react'
import { useConfirm } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { apiFetch } from '../../lib/api'
import { useConference } from '../../state/ConferenceContext'
import type { AccountInfo } from '../../types'

export function AccountsManager() {
  const { accounts, me, state, refresh } = useConference()
  const confirm = useConfirm()
  const toast = useToast()

  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'delegate' | 'chair'>('delegate')
  const [creating, setCreating] = useState(false)

  const [resetId, setResetId] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState('')

  const seatOptions = state.delegations.flatMap((delegation) =>
    delegation.seats.map((seat) => ({
      id: seat.id,
      label: `${delegation.name} · ${seat.name}`,
    })),
  )

  async function bindSeat(account: AccountInfo, seatId: string) {
    try {
      await apiFetch(`/accounts/${account.id}`, {
        method: 'PATCH',
        json: { seatId: seatId || null },
      })
      await refresh()
      toast(seatId ? '席位已绑定' : '已解除席位绑定', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '绑定失败', 'danger')
    }
  }

  async function createAccount(event: FormEvent) {
    event.preventDefault()
    if (!username.trim() || password.length < 4) {
      toast('账号至少 2 个字符，密码至少 4 个字符', 'danger')
      return
    }
    setCreating(true)
    try {
      await apiFetch('/accounts', {
        method: 'POST',
        json: {
          username: username.trim(),
          name: name.trim(),
          password,
          role,
        },
      })
      setUsername('')
      setName('')
      setPassword('')
      setRole('delegate')
      await refresh()
      toast('代表账号已创建', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '创建失败', 'danger')
    } finally {
      setCreating(false)
    }
  }

  async function saveReset(account: AccountInfo) {
    if (resetPassword.length < 4) {
      toast('新密码至少 4 个字符', 'danger')
      return
    }
    try {
      await apiFetch(`/accounts/${account.id}`, {
        method: 'PATCH',
        json: { password: resetPassword },
      })
      setResetId(null)
      setResetPassword('')
      if (account.id === me.id) {
        toast('密码已修改，请重新登录', 'info')
      } else {
        toast('密码已重置', 'success')
      }
      await refresh()
    } catch (error) {
      toast(error instanceof Error ? error.message : '重置失败', 'danger')
    }
  }

  async function removeAccount(account: AccountInfo) {
    const ok = await confirm({
      title: `删除账号「${account.name}」？`,
      message: '该账号将无法登录；已提交文件仍保留，席位不会被删除。',
      confirmText: '删除账号',
      danger: true,
    })
    if (!ok) return
    try {
      await apiFetch(`/accounts/${account.id}`, { method: 'DELETE' })
      await refresh()
      toast('账号已删除', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '删除失败', 'danger')
    }
  }

  return (
    <section className="settings-card">
      <div className="settings-card-head">
        <h2>账号管理</h2>
        <p>创建本会场的主席或代表账号。事件收件人从这里选择；初始主席账号为 123456 / abcd。</p>
      </div>

      <form className="account-create-form" onSubmit={createAccount}>
        <input
          className="input"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="登录账号"
          maxLength={32}
          aria-label="新账号用户名"
        />
        <input
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="显示名称，如：法国代表"
          maxLength={40}
          aria-label="新账号显示名称"
        />
        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="初始密码（至少 4 位）"
          maxLength={80}
          aria-label="新账号初始密码"
        />
        <select
          className="select"
          value={role}
          onChange={(event) => setRole(event.target.value as 'delegate' | 'chair')}
          aria-label="新账号角色"
        >
          <option value="delegate">代表</option>
          <option value="chair">主席</option>
        </select>
        <button type="submit" className="btn btn-primary" disabled={creating}>
          {creating ? '创建中…' : role === 'chair' ? '＋ 添加主席' : '＋ 添加代表'}
        </button>
      </form>

      <div className="account-list">
        {accounts.map((account) => (
          <div className="account-row" key={account.id}>
            <div className="account-id">
              <strong>{account.name}</strong>
              <span>{account.username}</span>
            </div>
            <span className={`role-badge role-${account.role}`}>
              {account.role === 'chair' ? '主席' : '代表'}
            </span>

            {account.role === 'delegate' ? (
              <label className="account-seat">
                <span>绑定席位</span>
                <select
                  className="select select-sm"
                  value={account.seatId ?? ''}
                  onChange={(event) => void bindSeat(account, event.target.value)}
                  aria-label={`${account.name}绑定的席位`}
                >
                  <option value="">未绑定</option>
                  {seatOptions.map((seat) => (
                    <option key={seat.id} value={seat.id}>
                      {seat.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="account-actions">
              {resetId === account.id ? (
                <div className="account-reset">
                  <input
                    className="input input-sm"
                    type="password"
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    placeholder="新密码"
                    aria-label={`${account.name}的新密码`}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => void saveReset(account)}
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => {
                      setResetId(null)
                      setResetPassword('')
                    }}
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => {
                    setResetId(account.id)
                    setResetPassword('')
                  }}
                >
                  重置密码
                </button>
              )}

              {account.username !== '123456' && account.id !== me.id ? (
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => void removeAccount(account)}
                  aria-label={`删除账号 ${account.name}`}
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
