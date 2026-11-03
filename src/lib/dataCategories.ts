import type { DataCategory } from '../types'

export type DataCategoryId = DataCategory['id']

export const ALL_CATEGORY_IDS: DataCategoryId[] = [
  'info',
  'seats',
  'sessions',
  'motions',
  'time',
  'events',
  'files',
  'accounts',
]

export const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'info',
    label: '会场信息',
    description: '会场名称/主题、作者信息、出席规则、计票方式与默认表决设置',
  },
  {
    id: 'seats',
    label: '席位与代表团',
    description: '代表团、席位、票权、全局否决与出席状态',
  },
  {
    id: 'sessions',
    label: '会期与决议',
    description: '会期、议题、当前议题、全部决议与表决快照',
  },
  {
    id: 'motions',
    label: '会议主持/动议',
    description: '动议类型、当前动议、发言名单、总时长/单位时长',
  },
  {
    id: 'time',
    label: '会议时间',
    description: '当前会议时间、流速、流动/暂停与危机暂停状态',
  },
  {
    id: 'events',
    label: '事件',
    description: '公开/秘密/危机事件、收件账号、发布状态与已读状态',
  },
  {
    id: 'files',
    label: '文件',
    description: '代表提交的全部文件与主席团已读状态',
  },
  {
    id: 'accounts',
    label: '账号与席位绑定',
    description: '本会场的主席/代表账号、席位绑定与登录关系',
  },
]

export function normalizeCategories(value: unknown): DataCategoryId[] {
  if (!Array.isArray(value)) return [...ALL_CATEGORY_IDS]
  const allowed = new Set<string>(ALL_CATEGORY_IDS)
  const selected = [...new Set(value.filter((item): item is string => typeof item === 'string'))]
    .filter((item) => allowed.has(item)) as DataCategoryId[]
  return selected.length > 0 ? selected : []
}
