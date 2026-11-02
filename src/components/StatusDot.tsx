export type DotTone = 'present' | 'absent' | 'pending' | 'passed' | 'failed'

const DEFAULT_LABEL: Record<DotTone, string> = {
  present: '出席',
  absent: '缺席',
  pending: '未表决',
  passed: '通过',
  failed: '未通过',
}

interface StatusDotProps {
  tone: DotTone
  title?: string
  size?: 'sm' | 'md' | 'lg'
  clickable?: boolean
  pressed?: boolean
  onClick?: () => void
}

export function StatusDot({
  tone,
  title,
  size = 'md',
  clickable = false,
  pressed,
  onClick,
}: StatusDotProps) {
  const label = title ?? DEFAULT_LABEL[tone]
  const className = `dot dot-${tone} dot-${size}${clickable ? ' dot-clickable' : ''}`

  if (clickable) {
    return (
      <button
        type="button"
        className={className}
        aria-label={label}
        aria-pressed={pressed}
        title={label}
        onClick={onClick}
      />
    )
  }

  return <span className={className} role="img" aria-label={label} title={label} />
}
