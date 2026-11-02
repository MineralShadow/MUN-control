/** 生成短 ID；优先使用 crypto.randomUUID，旧环境退化为时间戳 + 随机串 */
export function createId(prefix = 'id'): string {
  const raw =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
  return `${prefix}_${raw.replace(/-/g, '').slice(0, 12)}`
}
