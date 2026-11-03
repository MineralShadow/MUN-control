export const FILE_TYPES = [
  '工作文件',
  '决议草案',
  '修正案',
  '指令草案',
  '立场文件',
  '其他',
] as const

export function normalizeFileType(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : ''
  return (FILE_TYPES as readonly string[]).includes(text) ? text : '其他'
}
