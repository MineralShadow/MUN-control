import { useState, type FormEvent } from 'react'
import { EditableText } from '../components/EditableText'
import { useToast } from '../components/Toast'
import { Link } from '../router'
import { useConference } from '../state/ConferenceContext'
import { getCurrentSession, getCurrentTopic, getVoteStats } from '../state/selectors'
import type { Author } from '../types'

const FEATURES = [
  {
    to: '/seats' as const,
    no: '01',
    en: 'SEATS',
    title: '席位',
    desc: '管理代表团、下属席位与票权，一键切换出席。',
  },
  {
    to: '/sessions' as const,
    no: '02',
    en: 'SESSIONS',
    title: '会期',
    desc: '编排会期与议题，指定当前议程。',
  },
  {
    to: '/voting' as const,
    no: '03',
    en: 'VOTING',
    title: '投票',
    desc: '发起表决、确认否决国、实时计票并生成半圆图。',
  },
  {
    to: '/time' as const,
    no: '04',
    en: 'TIME',
    title: '时间',
    desc: '设定会议时钟、流速与危机暂停。',
  },
  {
    to: '/events' as const,
    no: '05',
    en: 'EVENTS',
    title: '事件',
    desc: '发布定时事件、选择收件账号与危机标记。',
  },
  {
    to: '/files' as const,
    no: '06',
    en: 'FILES',
    title: '文件',
    desc: '代表提交文件，主席团查看并标记已读。',
  },
  {
    to: '/settings' as const,
    no: '07',
    en: 'SETTINGS',
    title: '设置',
    desc: '默认多数规则、账号管理与会议备份。',
  },
]

export function HomePage() {
  const { state, dispatch, me } = useConference()
  const toast = useToast()
  const canEdit = me.role === 'chair'

  const [editingAuthor, setEditingAuthor] = useState(false)
  const [draft, setDraft] = useState<Author>(state.author)

  const session = getCurrentSession(state)
  const topic = getCurrentTopic(state)
  const stats = getVoteStats(state)

  const passedCount = state.resolutions.filter((item) => item.status === 'PASSED').length
  const failedCount = state.resolutions.filter((item) => item.status === 'FAILED').length
  const pendingCount = state.resolutions.filter((item) => item.status === 'PENDING').length

  const totalTopics = state.sessions.reduce((sum, item) => sum + item.topics.length, 0)

  async function copyXiaohongshuId() {
    if (!state.author.xiaohongshuId) {
      toast('还没有填写小红书号', 'danger')
      return
    }
    try {
      await navigator.clipboard.writeText(state.author.xiaohongshuId)
      toast('小红书号已复制', 'success')
    } catch {
      toast('复制失败，请手动选择号码', 'danger')
    }
  }

  function startEditingAuthor() {
    if (!canEdit) return
    setDraft(state.author)
    setEditingAuthor((value) => !value)
  }

  function saveAuthor(event: FormEvent) {
    event.preventDefault()
    if (!draft.name.trim()) {
      toast('作者昵称不能为空', 'danger')
      return
    }
    dispatch({
      type: 'author/set',
      patch: {
        name: draft.name.trim(),
        xiaohongshuId: draft.xiaohongshuId.trim(),
        xiaohongshuUrl: draft.xiaohongshuUrl.trim(),
      },
    })
    setEditingAuthor(false)
    toast('作者信息已保存', 'success')
  }

  return (
    <div className="stack">
      <section className="home-hero">
        <div className="hero-copy">
          <div className="eyebrow">MODEL UNITED NATIONS · HISTORICAL COUNCIL</div>
          <h1 className="hero-title">
            <EditableText
              value={state.theme}
              onSave={(theme) => dispatch({ type: 'theme/set', theme })}
              ariaLabel="会议主题"
              maxLength={80}
              editable={canEdit}
            />
          </h1>
          <p className="hero-lead">
            从点名到表决，把会场秩序放在一张桌子上。席位、出席、会期、议题与决议，
            都在这里留下清晰的记录。
          </p>
          <div className="hero-actions">
            <Link to="/seats" className="btn btn-primary">
              进入席位
            </Link>
            {topic ? (
              <Link to="/voting" className="btn btn-ghost">
                开始表决
              </Link>
            ) : (
              <Link to="/sessions" className="btn btn-ghost">
                设置会期议题
              </Link>
            )}
          </div>
          <p className="hero-hint">
            {canEdit
              ? '点击会议主题即可就地修改，所有页面左上角会同步更新。'
              : '会议主题由主席团维护，所有页面左上角同步显示。'}
          </p>
        </div>

        <aside className="hero-card">
          <div className="eyebrow">CURRENT AGENDA</div>
          {session && topic ? (
            <>
              <div className="hero-session">{session.name}</div>
              <div className="hero-topic">{topic.name}</div>
              <div className="hero-meta">
                {stats.presentDelegations} 个代表团出席 · 共 {state.resolutions.length} 项决议
              </div>
              <Link to="/voting" className="btn btn-primary btn-sm">
                进入投票
              </Link>
            </>
          ) : (
            <>
              <p className="hero-empty">尚未选择当前会期与议题。</p>
              <Link to="/sessions" className="btn btn-ghost btn-sm">
                去设置
              </Link>
            </>
          )}
        </aside>
      </section>

      <section className="overview-grid" aria-label="会议概览">
        <div className="overview-card">
          <span className="overview-label">代表团</span>
          <span className="overview-value">{stats.totalDelegations}</span>
          <span className="overview-note">其中 {stats.presentDelegations} 个出席</span>
        </div>
        <div className="overview-card">
          <span className="overview-label">席位</span>
          <span className="overview-value">{stats.totalSeats}</span>
          <span className="overview-note">{stats.presentSeats} 个席位已出席</span>
        </div>
        <div className="overview-card">
          <span className="overview-label">会期 / 议题</span>
          <span className="overview-value">
            {state.sessions.length}
            <span className="overview-divider">/</span>
            {totalTopics}
          </span>
          <span className="overview-note">{stats.presentVotes} 张出席票</span>
        </div>
        <div className="overview-card">
          <span className="overview-label">决议</span>
          <span className="overview-value">{state.resolutions.length}</span>
          <span className="overview-note">
            通过 {passedCount} · 未通过 {failedCount} · 待表决 {pendingCount}
          </span>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">WORKSPACE</div>
            <h2>会场工作区</h2>
          </div>
          <p className="section-desc">八个页面覆盖一场会议从准备、计时到危机与文件归档的全过程。</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <Link key={feature.to} to={feature.to} className="feature-card">
              <div className="feature-top">
                <span className="feature-no">{feature.no}</span>
                <span className="feature-en">{feature.en}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
              <span className="feature-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section guide-section">
        <div className="section-head">
          <div>
            <div className="eyebrow">GET STARTED</div>
            <h2>三步开始</h2>
          </div>
        </div>
        <ol className="guide">
          <li>
            <span className="guide-no">01</span>
            <div>
              <h3>建立席位</h3>
              <p>添加代表团，按实际人数添加席位，设定票权与全球否决权。</p>
              <Link to="/seats" className="text-link">
                前往席位 →
              </Link>
            </div>
          </li>
          <li>
            <span className="guide-no">02</span>
            <div>
              <h3>编排会期</h3>
              <p>建立会期与议题，指定当前议题，顶栏会显示会议进度。</p>
              <Link to="/sessions" className="text-link">
                前往会期 →
              </Link>
            </div>
          </li>
          <li>
            <span className="guide-no">03</span>
            <div>
              <h3>发起表决</h3>
              <p>添加决议，确认多数规则与否决国，点名投票后生成半圆图结果。</p>
              <Link to="/voting" className="text-link">
                前往投票 →
              </Link>
            </div>
          </li>
        </ol>
      </section>

      <section className="author-card">
        <div className="author-info">
          <div className="eyebrow">ABOUT THE AUTHOR</div>
          <h2 className="author-name">{state.author.name}</h2>
          <div className="author-id">
            小红书号 · <span>{state.author.xiaohongshuId || '未填写'}</span>
          </div>
          <p className="author-desc">会场之外，也欢迎来小红书找我。</p>
          <div className="author-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={copyXiaohongshuId}>
              复制小红书号
            </button>
            {state.author.xiaohongshuUrl ? (
              <a
                className="btn btn-primary btn-sm"
                href={state.author.xiaohongshuUrl}
                target="_blank"
                rel="noreferrer"
              >
                打开小红书主页
              </a>
            ) : null}
            {canEdit ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={startEditingAuthor}>
                {editingAuthor ? '收起编辑' : '编辑资料'}
              </button>
            ) : null}
          </div>

          {editingAuthor ? (
            <form className="author-form" onSubmit={saveAuthor}>
              <label className="field">
                <span>昵称</span>
                <input
                  className="input"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  maxLength={40}
                />
              </label>
              <label className="field">
                <span>小红书号</span>
                <input
                  className="input"
                  value={draft.xiaohongshuId}
                  onChange={(event) =>
                    setDraft({ ...draft, xiaohongshuId: event.target.value })
                  }
                  maxLength={40}
                />
              </label>
              <label className="field">
                <span>主页链接（可选）</span>
                <input
                  className="input"
                  value={draft.xiaohongshuUrl}
                  onChange={(event) =>
                    setDraft({ ...draft, xiaohongshuUrl: event.target.value })
                  }
                  placeholder="https://www.xiaohongshu.com/..."
                  maxLength={200}
                />
              </label>
              <div className="author-form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingAuthor(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
              </div>
            </form>
          ) : null}
        </div>

        <div className="author-qr">
          <img
            src={`${import.meta.env.BASE_URL}xiaohongshu-qr.png`}
            alt="作者的小红书主页二维码"
            width={180}
            height={180}
          />
          <span>扫码在小红书找到作者</span>
        </div>
      </section>
    </div>
  )
}
