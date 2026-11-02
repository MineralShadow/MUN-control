import { useState, type ChangeEvent, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { apiFetch } from '../lib/api'
import { formatBytes, formatDateTime } from '../lib/format'
import { useConference } from '../state/ConferenceContext'
import type { SubmittedFile } from '../types'

const MAX_SIZE = 2 * 1024 * 1024

export function FilesPage() {
  const { files, me, refresh } = useConference()
  const toast = useToast()
  const canEdit = me.role === 'chair'

  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

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
    const form = new FormData()
    form.set('title', title.trim() || file.name)
    form.set('file', file)
    setUploading(true)
    try {
      await apiFetch('/files', { method: 'POST', body: form })
      setTitle('')
      setFile(null)
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
            ? '主席团可以查看本会场所有提交文件，并标记已读/未读。'
            : '把文件提交给主席团；你只能看到自己提交的文件。'
        }
      />

      <section className="file-upload-card">
        <div className="settings-card-head">
          <h2>提交文件给主席团</h2>
          <p>支持任意文件，单个不超过 2 MB。提交后主席团会收到未读标记。</p>
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

          <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
            {uploading ? '提交中…' : '提交给主席团'}
          </button>
        </form>
      </section>

      {files.length === 0 ? (
        <EmptyState
          icon="▤"
          title={canEdit ? '还没有收到文件' : '你还没有提交过文件'}
          description={
            canEdit
              ? '代表提交文件后会出现在这里，可标记已读。'
              : '提交后会在这里显示，并带上主席团的已读状态。'
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
