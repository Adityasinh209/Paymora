import { memo, useCallback } from 'react'
import { FormField } from './FormField'
import { formatCardHolder } from '../utils/cardFormatters'

interface CardHolderInputProps {
  value: string
  error?: string
  valid?: boolean
  onChange: (value: string) => void
  onBlur: () => void
}

export const CardHolderInput = memo(function CardHolderInput({
  value,
  error,
  valid,
  onChange,
  onBlur,
}: CardHolderInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCardHolder(e.target.value)
      onChange(formatted)
    },
    [onChange],
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey) return
    const allowed = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Space',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
    ]
    if (allowed.includes(e.key)) return
    // Allow letters, spaces, hyphens, apostrophes, periods
    if (!/^[a-zA-Z\s\-'.]$/.test(e.key)) e.preventDefault()
  }, [])

  return (
    <FormField label="Cardholder Name" error={error} valid={valid}>
      <input
        type="text"
        autoComplete="cc-name"
        autoCapitalize="words"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        maxLength={64}
        placeholder="Full name on card"
        aria-label="Cardholder name"
        aria-invalid={!!error}
        className={[
          'input-base',
          valid ? 'input-valid' : '',
          error ? 'input-error' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />
    </FormField>
  )
})
