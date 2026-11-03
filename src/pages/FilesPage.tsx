import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { Toggle } from '../components/Toggle'
import { useToast } from '../components/Toast'
import { apiFetch } from '../lib/api'
import { FILE_TYPES } from '../lib/fileTypes'
import { formatBytes, formatDateTime } from '../lib/format'
import { useConference } from '../state/ConferenceContext'
import type { FileScope, SubmittedFile } from '../types'

const MAX_SIZE = 2 * 1024 * 1024

export function FilesPage() {
  const { files, me, state, myMembership, dispatch, refresh } = useConference()
  const toast = useToast()
  const canEdit = me.role === 'chair'
  const settings = state.settings
  const canDelegation = canEdit || Boolean(myMembership?.isHead)
  const canPersonal = canEdit || settings.allowPersonalFiles
  const canUpload = canDelegation || canPersonal

  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<string>('工作文件')
  const [scope, setScope] = useState<FileScope>(canDelegation ? 'DELEGATION' : 'PERSONAL')
  const [delegationId, setDelegationId] = useState(
    myMembership?.delegationId ?? state.delegations[0]?.id ?? '',
  )
  const [coSign, setCoSign] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!canUpload) return
    if (scope === 'DELEGATION' && !canDelegation) setScope('PERSONAL')
    if (scope === 'PERSONAL' && !canPersonal) setScope('DELEGATION')
  }, [canDelegation, canPersonal, canUpload, scope])

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    if (selected && selected.size > MAX_SIZE) {
      toast('文件不能超过 2 MB', 'danger')
      event.target.value = ''
      setFile(null)
      return
    }
    setFile(selected)
  }

  async function upload(event: FormEvent) {
    event.preventDefault()
    if (!file) {
      toast('请选择要提交的文件', 'danger')
      return
    }
    if (scope === 'DELEGATION' && !delegationId) {
      toast('请选择代表团', 'danger')
      return
    }
    const form = new FormData()
    form.set('title', title.trim() || file.name)
    form.set('type', fileType)
    form.set('scope', scope)
    if (scope === 'DELEGATION') {
      form.set('delegationId', delegationId)
      form.set('coSign', coSign ? 'true' : 'false')
    }
    form.set('file', file)
    setUploading(true)
    try {
      await apiFetch('/files', { method: 'POST', body: form })
      setTitle('')
      setFile(null)
      setCoSign(false)
      const input = document.getElementById('file-input') as HTMLInputElement | null
      if (input) input.value = ''
      await refresh()
      toast('文件已提交给主席团', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '提交失败', 'danger')
    } finally {
      setUploading(false)
    }
  }

  async function toggleRead(item: SubmittedFile) {
    setBusyId(item.id)
    try {
      await apiFetch(`/files/${item.id}/read`, {
        method: 'POST',
        json: { read: !item.read },
      })
      await refresh()
    } catch (error) {
      toast(error instanceof Error ? error.message : '操作失败', 'danger')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="FILES & SUBMISSIONS"
        title="文件"
        description={
          canEdit
            ? '主席团可以查看本会场所有文件，并切换个人文件权限、标记已读。'
            : '文件分为个人与代表团两类；代表团文件由阁首提交，可联署。'
        }
      />

      {canEdit ? (
        <div className="file-permission-bar">
          <div>
            <strong>个人文件权限</strong>
            <p>
              关闭时只有阁首可以以代表团身份提交；开启后所有代表都可以提交个人文件。
            </p>
          </div>
          <Toggle
            checked={settings.allowPersonalFiles}
            onChange={(checked) =>
              dispatch({ type: 'settings/patch', patch: { allowPersonalFiles: checked } })
            }
            label="允许所有代表提交个人文件"
          />
        </div>
      ) : null}

      {canUpload ? (
        <section className="file-upload-card">
          <div className="settings-card-head">
            <h2>提交文件给主席团</h2>
            <p>单个文件不超过 2 MB；提交后主席团会收到未读标记。</p>
          </div>
          <form className="file-upload-form" onSubmit={upload}>
            <label className="field file-title-field">
              <span>文件标题（可选）</span>
              <input
                className="input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={80}
                placeholder="例如：法国代表团立场文件"
              />
            </label>

            <label className="field">
              <span>文件类型</span>
              <select
                className="select"
                value={fileType}
                onChange={(event) => setFileType(event.target.value)}
              >
                {FILE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>权限</span>
              <select
                className="select"
                value={scope}
                onChange={(event) => setScope(event.target.value as FileScope)}
              >
                {canDelegation ? <option value="DELEGATION">代表团文件</option> : null}
                {canPersonal ? <option value="PERSONAL">个人文件</option> : null}
              </select>
            </label>

            {scope === 'DELEGATION' && canEdit ? (
              <label className="field">
                <span>代表团</span>
                <select
                  className="select"
                  value={delegationId}
                  onChange={(event) => setDelegationId(event.target.value)}
                >
                  {state.delegations.map((delegation) => (
                    <option key={delegation.id} value={delegation.id}>
                      {delegation.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {scope === 'DELEGATION' && !canEdit && myMembership ? (
              <div className="field">
                <span>代表团</span>
                <div className="readonly-pill">{myMembership.delegationName}</div>
              </div>
            ) : null}

            <label className="field file-picker-field">
              <span>选择文件</span>
              <input
                id="file-input"
                className="input file-input"
                type="file"
                onChange={chooseFile}
              />
              <small className="hint">
                {file ? `${file.name} · ${formatBytes(file.size)}` : '尚未选择文件'}
              </small>
            </label>

            {scope === 'DELEGATION' ? (
              <label className="file-cosign">
                <input
                  type="checkbox"
                  checked={coSign}
                  onChange={(event) => setCoSign(event.target.checked)}
                />
                <span>本文件为联署文件</span>
              </label>
            ) : null}

            <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
              {uploading ? '提交中…' : '提交给主席团'}
            </button>
          </form>
        </section>
      ) : (
        <div className="notice">
          个人文件权限尚未开启；当前账号也不是阁首。请等待主席团开放个人文件权限，或由阁首提交代表团文件。
        </div>
      )}

      {files.length === 0 ? (
        <EmptyState
          icon="▤"
          title={canEdit ? '还没有收到文件' : '暂时没有可查看的文件'}
          description={
            canEdit
              ? '代表提交文件后会出现在这里，可标记已读。'
              : '你和本代表团的文件会显示在这里。'
          }
        />
      ) : (
        <div className="file-list">
          {files.map((item) => (
            <article className={`file-card${item.read ? ' is-read' : ''}`} key={item.id}>
              <div className="file-icon" aria-hidden="true">
                {item.filename.split('.').pop()?.slice(0, 4).toUpperCase() || 'FILE'}
              </div>

              <div className="file-main">
                <div className="file-title-row">
                  <h3>{item.title}</h3>
                  <span className={`badge ${item.scope === 'DELEGATION' ? 'badge-public' : 'badge-secret'}`}>
                    {item.scope === 'DELEGATION' ? '代表团' : '个人'}
                  </span>
                  <span className="badge badge-muted">{item.fileType}</span>
                  {item.coSign ? <span className="badge badge-gold">联署</span> : null}
                  {canEdit ? (
                    <button
                      type="button"
                      className={`read-toggle${item.read ? ' is-read' : ''}`}
                      aria-pressed={item.read}
                      disabled={busyId === item.id}
                      onClick={() => void toggleRead(item)}
                    >
                      {item.read ? '已读' : '未读'}
                    </button>
                  ) : (
                    <span className={`badge ${item.read ? 'badge-read' : 'badge-unread'}`}>
                      {item.read ? '主席团已读' : '主席团未读'}
                    </span>
                  )}
                </div>
                <div className="file-meta">
                  <span>{item.filename}</span>
                  <span className="meta-sep">·</span>
                  <span>{formatBytes(item.size)}</span>
                  <span className="meta-sep">·</span>
                  <span>{item.submittedByName}</span>
                  {item.delegationName ? (
                    <>
                      <span className="meta-sep">·</span>
                      <span>{item.delegationName}</span>
                    </>
                  ) : null}
                  <span className="meta-sep">·</span>
                  <span>{formatDateTime(item.submittedAt)}</span>
                </div>
              </div>

              <a
                className="btn btn-ghost btn-sm file-download"
                href={`/api?route=${encodeURIComponent(`/files/${item.id}/download`)}`}
                download={item.filename}
              >
                下载
              </a>
            </article>
          ))}
        </div>
      )}

      <div className="notice">
        文件存放在会场数据库中，请勿提交超出会场需要的大文件；主席团可以随时下载留存。
      </div>
    </div>
  )
}
