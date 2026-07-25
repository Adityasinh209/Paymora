import { memo, useCallback, useRef } from 'react'
import { FormField } from './FormField'
import { formatExpiry, stripExpiry } from '../utils/cardFormatters'

interface ExpiryInputProps {
  value: string
  error?: string
  valid?: boolean
  onChange: (raw: string) => void
  onBlur: () => void
}

export const ExpiryInput = memo(function ExpiryInput({
  value,
  error,
  valid,
  onChange,
  onBlur,
}: ExpiryInputProps) {
  const prevRawRef = useRef('')

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value
      let raw = inputVal.replace(/\D/g, '')
      const prevRaw = prevRawRef.current

      // If user is deleting and we had a month + separator, keep the month
      if (raw.length < prevRaw.length) {
        prevRawRef.current = raw
        onChange(raw)
        return
      }

      // Clamp month as digits are entered
      if (raw.length >= 2) {
        const mm = parseInt(raw.slice(0, 2), 10)
        if (mm > 12) raw = '1' + raw[0] + raw.slice(1)
        if (mm === 0) raw = '0' + raw.slice(1)
      }

      // Cap at 4 digits
      raw = raw.slice(0, 4)
      prevRawRef.current = raw
      onChange(raw)
    },
    [onChange],
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'Home', 'End',
    ]
    if (allowed.includes(e.key)) return
    if (e.ctrlKey || e.metaKey) return
    if (!/^\d$/.test(e.key)) e.preventDefault()
  }, [])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text')
      const raw = stripExpiry(pasted).slice(0, 4)
      prevRawRef.current = raw
      onChange(raw)
    },
    [onChange],
  )

  const formatted = formatExpiry(value)

  return (
    <FormField label="Expiry" error={error} valid={valid}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="cc-exp"
        value={formatted}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={onBlur}
        maxLength={7}
        placeholder="MM / YY"
        aria-label="Card expiry date"
        aria-invalid={!!error}
        className={[
          'input-base input-card-number',
          valid ? 'input-valid' : '',
          error ? 'input-error' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />
    </FormField>
  )
})
