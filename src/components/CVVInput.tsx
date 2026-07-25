import { memo, useCallback } from 'react'
import { FormField } from './FormField'
import { formatCVV } from '../utils/cardFormatters'

interface CVVInputProps {
  value: string
  cvvLength: number
  error?: string
  valid?: boolean
  onChange: (value: string) => void
  onBlur: () => void
  onFocus: () => void
}

export const CVVInput = memo(function CVVInput({
  value,
  cvvLength,
  error,
  valid,
  onChange,
  onBlur,
  onFocus,
}: CVVInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCVV(e.target.value, cvvLength)
      onChange(formatted)
    },
    [onChange, cvvLength],
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
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, cvvLength)
      onChange(pasted)
    },
    [onChange, cvvLength],
  )

  return (
    <FormField label={`CVV / CVC`} error={error} valid={valid}>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="cc-csc"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={onBlur}
          onFocus={onFocus}
          maxLength={cvvLength}
          placeholder={'•'.repeat(cvvLength)}
          aria-label="Card security code"
          aria-invalid={!!error}
          className={[
            'input-base input-card-number pr-10',
            valid ? 'input-valid' : '',
            error ? 'input-error' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {/* CVV hint icon */}
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="7.5" width="18" height="3" fill="currentColor" opacity="0.3" />
            <rect x="12" y="10.5" width="5" height="2" rx="0.5" fill="currentColor" />
          </svg>
        </div>
      </div>
    </FormField>
  )
})
