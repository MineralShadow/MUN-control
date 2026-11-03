import type { FileType } from '../types'

export const DEFAULT_FILE_TYPES: FileType[] = [
  {
    id: 'file-directive',
    name: '指令文件',
    allowPersonal: true,
    forceCoSign: false,
    allowPublic: false,
  },
  {
    id: 'file-draft-resolution',
    name: '决议草案',
    allowPersonal: false,
    forceCoSign: false,
    allowPublic: true,
  },
  {
    id: 'file-amendment',
    name: '修正案',
    allowPersonal: false,
    forceCoSign: false,
    allowPublic: true,
  },
  {
    id: 'file-agreement',
    name: '协定',
    allowPersonal: false,
    forceCoSign: true,
    allowPublic: true,
  },
  {
    id: 'file-statement',
    name: '声明',
    allowPersonal: false,
    forceCoSign: false,
    allowPublic: true,
  },
]

export function defaultFileTypes(): FileType[] {
  return DEFAULT_FILE_TYPES.map((item) => ({ ...item }))
}

export function normalizeFileTypes(value: unknown): FileType[] {
  if (!Array.isArray(value)) return defaultFileTypes()
  const types = value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, index) => ({
      id: typeof item.id === 'string' && item.id ? item.id : `file-type-${index + 1}`,
      name:
        typeof item.name === 'string' && item.name.trim()
          ? item.name.trim().slice(0, 40)
          : `文件类型 ${index + 1}`,
      allowPersonal: item.allowPersonal === true,
      forceCoSign: item.forceCoSign === true,
      allowPublic: item.allowPublic === true,
    }))
  return types.length > 0 ? types : defaultFileTypes()
}
