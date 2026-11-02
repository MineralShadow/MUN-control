import { useEffect, useState } from 'react'
import { clampInt } from '../lib/format'

interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  ariaLabel: string
  suffix?: string
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  ariaLabel,
  suffix,
}: NumberStepperProps) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  function commit(raw: string) {
    const parsed = Number.parseInt(raw, 10)
    const next = Number.isFinite(parsed) ? clampInt(parsed, min, max) : value
    setDraft(String(next))
    if (next !== value) onChange(next)
  }

  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(clampInt(value - 1, min, max))}
        disabled={value <= min}
        aria-label={`${ariaLabel}减一`}
      >
        −
      </button>
      <input
        className="stepper-input"
        value={draft}
        inputMode="numeric"
        aria-label={ariaLabel}
        onChange={(event) => setDraft(event.target.value.replace(/[^\d]/g, ''))}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          }
        }}
      />
      {suffix ? <span className="stepper-suffix">{suffix}</span> : null}
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(clampInt(value + 1, min, max))}
        disabled={value >= max}
        aria-label={`${ariaLabel}加一`}
      >
        +
      </button>
    </div>
  )
}
