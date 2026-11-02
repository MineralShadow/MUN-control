import { useState, type FormEvent } from 'react'
import { ApiError } from '../lib/api'

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onLogin(username.trim(), password)
    } catch (caught) {
      setError(
        caught instanceof ApiError || caught instanceof Error
          ? caught.message
          : '登录失败，请稍后重试',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <span className="seal login-seal" aria-hidden="true">
            <span>MUN</span>
          </span>
          <div>
            <div className="eyebrow">MODEL UNITED NATIONS · HISTORICAL COUNCIL</div>
            <h1>会场控制台</h1>
            <p>使用主席团分配的账号登录。主席与代表进入同一个会场，权限不同。</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>账号</span>
            <input
              className="input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoFocus
              placeholder="例如：123456"
            />
          </label>
          <label className="field">
            <span>密码</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="请输入密码"
            />
          </label>

          {error ? <p className="login-error">{error}</p> : null}

          <button type="submit" className="btn btn-primary login-submit" disabled={submitting}>
            {submitting ? '正在登录…' : '登录会场'}
          </button>
        </form>

        <p className="login-foot">
          代表账号由主席团在「设置 → 账号管理」中创建。
        </p>
      </div>
    </div>
  )
}
