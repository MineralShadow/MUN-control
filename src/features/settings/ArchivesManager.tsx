import { useEffect, useState } from 'react'
import { DataScopeDialog } from '../../components/DataScopeDialog'
import { useConfirm } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { apiFetch } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import type { ArchiveInfo } from '../../types'
import { DATA_CATEGORIES, type DataCategoryId } from '../../lib/dataCategories'

export function ArchivesManager() {
  const confirm = useConfirm()
  const toast = useToast()
  const [archives, setArchives] = useState<ArchiveInfo[]>([])
  const [scopeOpen, setScopeOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    try {
      const data = await apiFetch<{ archives: ArchiveInfo[] }>('/archives')
      setArchives(data.archives)
    } catch (error) {
      toast(error instanceof Error ? error.message : '读取存档失败', 'danger')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function create(categories: DataCategoryId[], name?: string) {
    setLoading(true)
    try {
      const data = await apiFetch<{ archive: ArchiveInfo }>('/archives', {
        method: 'POST',
        json: { name: name?.trim() ?? '', include: categories },
      })
      setScopeOpen(false)
      await load()
      toast(`已创建存档：${data.archive.name}`, 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '创建存档失败', 'danger')
    } finally {
      setLoading(false)
    }
  }

  function categoryLabels(archive: ArchiveInfo): string {
    const labels = new Map(DATA_CATEGORIES.map((item) => [item.id, item.label]))
    return archive.included.map((id) => labels.get(id) ?? id).join('、')
  }

  async function restore(archive: ArchiveInfo) {
    const ok = await confirm({
      title: `读取存档「${archive.name}」？`,
      message:
        `只恢复存档中包含的类别：${categoryLabels(archive)}。未包含的类别保留当前内容；当前登录会失效，请用存档里的账号重新登录。`,
      confirmText: '读取并覆盖',
      danger: true,
    })
    if (!ok) return
    setBusyId(archive.id)
    try {
      await apiFetch(`/archives/${archive.id}/restore`, { method: 'POST' })
      toast('存档已读取，请重新登录', 'success')
      window.location.reload()
    } catch (error) {
      toast(error instanceof Error ? error.message : '读取存档失败', 'danger')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(archive: ArchiveInfo) {
    const ok = await confirm({
      title: `删除存档「${archive.name}」？`,
      message: '只删除这份线上存档，不影响当前会场数据。',
      confirmText: '删除存档',
      danger: true,
    })
    if (!ok) return
    setBusyId(archive.id)
    try {
      await apiFetch(`/archives/${archive.id}`, { method: 'DELETE' })
      await load()
      toast('存档已删除', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : '删除存档失败', 'danger')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="settings-card">
      <div className="settings-card-head">
        <h2>线上会场存档</h2>
        <p>
          存档包含会场名称、席位、会期、决议、设置、时间、账号与席位绑定、全部事件及已读、全部文件。
          存在 Turso 线上数据库中，换设备也能读取。
        </p>
      </div>

      <div className="archive-create">
        <button type="button" className="btn btn-primary" disabled={loading} onClick={() => setScopeOpen(true)}>
          ＋ 存档当前会场
        </button>
        <span className="hint">存档前会选择要保存的内容类别。</span>
      </div>

      {archives.length === 0 ? (
        <p className="hint">还没有线上存档。建议在重要节点（开幕、危机前、闭幕）各存一次。</p>
      ) : (
        <div className="archive-list">
          {archives.map((archive) => (
            <div className="archive-row" key={archive.id}>
              <div className="archive-info">
                <strong>{archive.name}</strong>
                <span>{formatDateTime(archive.createdAt)} · {categoryLabels(archive)}</span>
              </div>
              <div className="archive-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  disabled={busyId === archive.id}
                  onClick={() => void restore(archive)}
                >
                  读取
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  disabled={busyId === archive.id}
                  onClick={() => void remove(archive)}
                  aria-label={`删除存档 ${archive.name}`}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="hint">读取存档会让当前登录失效；只恢复存档中实际包含的类别。</p>
      <DataScopeDialog
        open={scopeOpen}
        mode="archive"
        busy={loading}
        onClose={() => setScopeOpen(false)}
        onConfirm={(categories, name) => void create(categories, name)}
      />
    </section>
  )
}
