import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import {
  ALL_CATEGORY_IDS,
  DATA_CATEGORIES,
  type DataCategoryId,
} from '../lib/dataCategories'

interface DataScopeDialogProps {
  open: boolean
  mode: 'archive' | 'clear'
  busy?: boolean
  onClose: () => void
  onConfirm: (categories: DataCategoryId[], name?: string) => void
}

export function DataScopeDialog({
  open,
  mode,
  busy = false,
  onClose,
  onConfirm,
}: DataScopeDialogProps) {
  const [selected, setSelected] = useState<DataCategoryId[]>([...ALL_CATEGORY_IDS])
  const [name, setName] = useState('')

  useEffect(() => {
    if (!open) return
    setSelected([...ALL_CATEGORY_IDS])
    setName('')
  }, [open])

  function toggle(id: DataCategoryId) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    )
  }

  const title = mode === 'archive' ? '存档当前会场' : '清除当前会场数据'
  const confirmText = mode === 'archive' ? '创建存档' : '确认清除'
  const isClear = mode === 'clear'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={
        isClear
          ? '只会清除当前会场，其他会场不受影响。线上存档不会被删除，可作为恢复备份。'
          : '只保存勾选的内容；未勾选的内容不会写入存档。'
      }
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            取消
          </button>
          <button
            type="button"
            className={`btn ${isClear ? 'btn-danger' : 'btn-primary'}`}
            disabled={busy || selected.length === 0}
            onClick={() => onConfirm(selected, name)}
          >
            {busy ? '处理中…' : confirmText}
          </button>
        </>
      }
    >
      {mode === 'archive' ? (
        <label className="field">
          <span>存档名称（可留空）</span>
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：开幕前 / 危机前 / 闭幕"
            maxLength={80}
          />
        </label>
      ) : (
        <div className="notice danger-notice">
          勾选的内容会被删除且不可撤销。当前主席账号与初始主席账号始终保留；其他会场不受影响。
        </div>
      )}

      <div className="scope-list">
        {DATA_CATEGORIES.map((category) => {
          const checked = selected.includes(category.id)
          return (
            <label key={category.id} className={`scope-row${checked ? ' checked' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(category.id)}
              />
              <span>
                <strong>{category.label}</strong>
                <small>{category.description}</small>
              </span>
            </label>
          )
        })}
      </div>

      <div className="scope-actions">
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => setSelected([...ALL_CATEGORY_IDS])}
        >
          全选
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => setSelected([])}
        >
          全不选
        </button>
        <span className="hint">已选 {selected.length} / {DATA_CATEGORIES.length} 类</span>
      </div>
    </Modal>
  )
}
