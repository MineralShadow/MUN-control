import { useEffect, useRef, useState } from 'react'

interface EditableTextProps {
  value: string
  onSave: (value: string) => void
  className?: string
  inputClassName?: string
  maxLength?: number
  ariaLabel: string
  editable?: boolean
  placeholder?: string
  title?: string
}

/**
 * 就地改名：点击文字进入编辑，Enter / 失焦保存，Esc 取消。
 * 空值不会覆盖原值。
 */
export function EditableText({
  value,
  onSave,
  className = '',
  inputClassName = '',
  maxLength = 60,
  ariaLabel,
  editable = true,
  placeholder,
  title,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function startEditing() {
    if (!editable) return
    setDraft(value)
    setEditing(true)
  }

  function commit() {
    if (!editing) return
    const next = draft.trim().slice(0, maxLength)
    setEditing(false)
    if (next && next !== value) onSave(next)
    else setDraft(value)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`editable-input ${className} ${inputClassName}`.trim()}
        value={draft}
        maxLength={maxLength}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            cancel()
          }
        }}
      />
    )
  }

  if (!editable) {
    return (
      <span className={`editable-static ${className}`.trim()} title={title}>
        {value}
      </span>
    )
  }

  return (
    <span
      className={`editable ${className}`.trim()}
      role="button"
      tabIndex={0}
      aria-label={`${ariaLabel}，点击修改`}
      title={title ?? '点击修改'}
      onClick={startEditing}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          startEditing()
        }
      }}
    >
      {value}
    </span>
  )
}
