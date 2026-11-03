import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { EditableText } from '../components/EditableText'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { Toggle } from '../components/Toggle'
import { useConfirm } from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { apiFetch } from '../lib/api'
import { createId } from '../lib/id'
import { formatBytes, formatDateTime } from '../lib/format'
import { useConference } from '../state/ConferenceContext'
import type { FileScope, FileType, SubmittedFile } from '../types'

const MAX_SIZE = 2 * 1024 * 1024

export function FilesPage() {
  const { files, me, state, myMembership, dispatch, refresh } = useConference()
  const confirm = useConfirm()
  const toast = useToast()
  const canEdit = me.role === 'chair'
  const settings = state.settings
  const canDelegation = canEdit || Boolean(myMembership?.isHead)
  const canPersonal = canEdit || settings.allowPersonalFiles

  const fileTypes = state.fileTypes
  const [typeId, setTypeId] = useState(fileTypes[0]?.id ?? '')
  const selectedType = fileTypes.find((item) => item.id === typeId) ?? fileTypes[0]
  const canUpload =
    canDelegation || Boolean(canPersonal && selectedType?.allowPersonal)
  const [title, setTitle] = useState('')
  const [textContent, setTextContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [scope, setScope] = useState<FileScope>(canDelegation ? 'DELEGATION' : 'PERSONAL')
  const [delegationId, setDelegationId] = useState(
    myMembership?.delegationId ?? state.delegations[0]?.id ?? '',
  )
  const [coSign, setCoSign] = useState(Boolean(selectedType?.forceCoSign))
  const [cosignerIds, setCosignerIds] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [newTypeName, setNewTypeName] = useState('')

  useEffect(() => {
    setCoSign(Boolean(selectedType?.forceCoSign))
  }, [selectedType?.id, selectedType?.forceCoSign])

  useEffect(() => {
    if (!canDelegation) setScope('PERSONAL')
    else if (scope === 'PERSONAL' && selectedType && !selectedType.allowPersonal) {
      setScope('DELEGATION')
    }
  }, [canDelegation, scope, selectedType])

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

  function toggleCosigner(id: string) {
    if (id === delegationId) return
    setCosignerIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    )
  }

  async function upload(event: FormEvent) {
    event.preventDefault()
    if (!selectedType) return
    if (!file && !textContent.trim()) {
      toast('请选择文件或填写文字内容', 'danger')
      return
    }
    if (scope === 'DELEGATION' && !delegationId) {
      toast('请选择代表团', 'danger')
      return
    }
    if (scope === 'DELEGATION' && (coSign || selectedType.forceCoSign) && cosignerIds.length === 0) {
      toast('请选择联署国家', 'danger')
      return
    }
    const form = new FormData()
    form.set('title', title.trim() || file?.name || '文字文件')
    form.set('typeId', selectedType.id)
    form.set('scope', scope)
    form.set('text', textContent)
    form.set('coSign', coSign || selectedType.forceCoSign ? 'true' : 'false')
    form.set('cosigners', JSON.stringify(cosignerIds))
    if (scope === 'DELEGATION') form.set('delegationId', delegationId)
    if (file) form.set('file', file)
    setUploading(true)
    try {
      await apiFetch('/files', { method: 'POST', body: form })
      setTitle('')
      setTextContent('')
      setFile(null)
      setCosignerIds([])
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

  async function confirmCosign(item: SubmittedFile) {
    setBusyId(item.id)
    try {
      await apiFetch(`/files/${item.id}/confirm`, { method: 'POST' })
      await refresh()
      toast('已确认联署', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '确认失败', 'danger')
    } finally {
      setBusyId(null)
    }
  }

  async function forward(item: SubmittedFile) {
    const ok = await confirm({
      title: `转发「${item.title}」到事件？`,
      message: '会以实时公开事件发送给本会场所有账号，并附带文件内容。请确认不会误触。',
      confirmText: '确认转发',
      danger: true,
    })
    if (!ok) return
    setBusyId(item.id)
    try {
      await apiFetch(`/files/${item.id}/forward`, { method: 'POST' })
      await refresh()
      toast('文件已转发到事件', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '转发失败', 'danger')
    } finally {
      setBusyId(null)
    }
  }

  function updateType(next: FileType) {
    dispatch({ type: 'fileType/update', fileType: next })
  }

  function addType() {
    const name = newTypeName.trim().slice(0, 40)
    if (!name) {
      toast('请填写文件类型名称', 'danger')
      return
    }
    const next: FileType = {
      id: createId('ftype'),
      name,
      allowPersonal: false,
      forceCoSign: false,
      allowPublic: true,
    }
    dispatch({ type: 'fileType/add', fileType: next })
    setTypeId(next.id)
    setNewTypeName('')
  }

  async function removeType(item: FileType) {
    if (fileTypes.length <= 1) {
      toast('至少保留一个文件类型', 'danger')
      return
    }
    const ok = await confirm({
      title: `删除文件类型「${item.name}」？`,
      message: '历史文件会保留原类型快照，但之后不能再用该类型上传。',
      confirmText: '删除',
      danger: true,
    })
    if (!ok) return
    dispatch({ type: 'fileType/delete', id: item.id })
    if (typeId === item.id) setTypeId(fileTypes.find((x) => x.id !== item.id)?.id ?? '')
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="FILES & SUBMISSIONS"
        title="文件"
        description={
          canEdit
            ? '管理文件类型、个人文件权限，查看联署确认，并可把允许公开的文件转发为实时事件。'
            : '文件分个人/代表团；代表团文件由阁首提交，联署文件需各联署团阁首确认。'
        }
      />

      {canEdit ? (
        <div className="file-permission-bar">
          <div>
            <strong>个人文件权限</strong>
            <p>关闭时只有阁首可提交代表团文件；开启后代表可按允许个人的文件类型提交个人文件。</p>
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
          <h2>提交文件 / 文字</h2>
          <p>文件 ≤2MB；也可以只提交文字，方便主席直接转发为事件。</p>
        </div>
        <form className="file-upload-form" onSubmit={upload}>
          <label className="field file-title-field">
            <span>标题</span>
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
              placeholder="例如：关于巴尔干问题的决议草案"
            />
          </label>

          <label className="field">
            <span>文件类型</span>
            <select
              className="select"
              value={selectedType?.id ?? ''}
              onChange={(event) => setTypeId(event.target.value)}
            >
              {fileTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
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
              {canPersonal && selectedType?.allowPersonal ? (
                <option value="PERSONAL">个人文件</option>
              ) : null}
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
          ) : scope === 'DELEGATION' && myMembership ? (
            <div className="field">
              <span>代表团</span>
              <div className="readonly-pill">{myMembership.delegationName}</div>
            </div>
          ) : null}

          <label className="field file-text-field">
            <span>文字内容（可选）</span>
            <textarea
              className="input textarea"
              rows={4}
              value={textContent}
              onChange={(event) => setTextContent(event.target.value)}
              maxLength={20000}
              placeholder="填写文件正文或说明；若只提交文字，可以不选文件。"
            />
          </label>

          <label className="field file-picker-field">
            <span>文件（可选，≤2MB）</span>
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
            <div className="file-cosign-block">
              <label className="file-cosign">
                <input
                  type="checkbox"
                  checked={coSign || Boolean(selectedType?.forceCoSign)}
                  disabled={Boolean(selectedType?.forceCoSign)}
                  onChange={(event) => setCoSign(event.target.checked)}
                />
                <span>
                  联署{selectedType?.forceCoSign ? '（该类型强制联署）' : ''}
                </span>
              </label>

              {coSign || selectedType?.forceCoSign ? (
                <div className="recipient-field">
                  <div className="recipient-head">
                    <span>选择联署国家/代表团</span>
                    <span className="hint">已选 {cosignerIds.length} 个</span>
                  </div>
                  <div className="recipient-grid">
                    {state.delegations
                      .filter((delegation) => delegation.id !== delegationId)
                      .map((delegation) => {
                        const checked = cosignerIds.includes(delegation.id)
                        return (
                          <label
                            key={delegation.id}
                            className={`recipient-chip${checked ? ' checked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCosigner(delegation.id)}
                            />
                            <span>{delegation.name}</span>
                          </label>
                        )
                      })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading || (!file && !textContent.trim())}
          >
            {uploading ? '提交中…' : '提交给主席团'}
          </button>
        </form>
      </section>
      ) : (
        <div className="notice">
          当前文件类型不允许个人发送，或主席团尚未开放个人文件权限；请选择其他文件类型，或由阁首提交代表团文件。
        </div>
      )}

      {files.length === 0 ? (
        <EmptyState
          icon="▤"
          title={canEdit ? '还没有收到文件' : '暂时没有可查看的文件'}
          description="提交后会出现在这里；联署文件会显示各团确认状态。"
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

                {item.textContent ? (
                  <div className="file-text">{item.textContent}</div>
                ) : null}

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

                {item.cosigners.length > 0 ? (
                  <div className="file-cosigner-status">
                    {item.cosigners.map((cosigner) => (
                      <span
                        key={cosigner.delegationId}
                        className={`cosigner-chip${cosigner.confirmedAt ? ' confirmed' : ''}`}
                      >
                        {cosigner.delegationName}
                        {cosigner.confirmedAt ? ' ✓ 已确认' : ' 待确认'}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="file-actions">
                  {item.canConfirm ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      disabled={busyId === item.id}
                      onClick={() => void confirmCosign(item)}
                    >
                      阅读并确认联署
                    </button>
                  ) : item.myConfirmation === 'CONFIRMED' ? (
                    <span className="badge badge-read">已确认联署</span>
                  ) : null}
                  {canEdit && (() => {
                    const type =
                      state.fileTypes.find((t) => t.id === item.fileTypeId) ??
                      state.fileTypes.find((t) => t.name === item.fileType)
                    return Boolean(type?.allowPublic)
                  })() ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      disabled={busyId === item.id}
                      onClick={() => void forward(item)}
                    >
                      转发到事件
                    </button>
                  ) : null}
                </div>
              </div>

              {item.size > 0 ? (
                <a
                  className="btn btn-ghost btn-sm file-download"
                  href={`/api?route=${encodeURIComponent(`/files/${item.id}/download`)}`}
                  download={item.filename}
                >
                  下载
                </a>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {canEdit ? (
        <section className="settings-card">
          <div className="settings-card-head">
            <h2>文件类型设置</h2>
            <p>是否允许个人、是否强制联署、是否允许公开转发；只影响之后提交的文件。</p>
          </div>
          <div className="file-type-list">
            {fileTypes.map((type) => (
              <div className="file-type-row" key={type.id}>
                <EditableText
                  className="file-type-name"
                  value={type.name}
                  onSave={(name) => updateType({ ...type, name })}
                  maxLength={40}
                  ariaLabel="文件类型名称"
                  editable
                />
                <label><span>个人</span><Toggle checked={type.allowPersonal} onChange={(v) => updateType({ ...type, allowPersonal: v })} label={`${type.name}允许个人`} /></label>
                <label><span>强制联署</span><Toggle checked={type.forceCoSign} onChange={(v) => updateType({ ...type, forceCoSign: v })} label={`${type.name}强制联署`} /></label>
                <label><span>允许公开</span><Toggle checked={type.allowPublic} onChange={(v) => updateType({ ...type, allowPublic: v })} label={`${type.name}允许公开`} /></label>
                <button type="button" className="btn-icon" onClick={() => void removeType(type)} aria-label={`删除文件类型 ${type.name}`}>×</button>
              </div>
            ))}
          </div>
          <div className="motion-type-add">
            <input className="input" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="新文件类型名称" maxLength={40} />
            <button type="button" className="btn btn-ghost" onClick={addType}>＋ 添加类型</button>
          </div>
        </section>
      ) : null}

      <div className="notice">
        文件存放在会场数据库中；联署文件会推送给其他联署团阁首确认；允许公开的文件可由主席确认后转发为实时事件。
      </div>
    </div>
  )
}
