import { memo, useCallback, useRef } from 'react'
import { FormField } from './FormField'
import { formatCardNumber, stripCardNumber } from '../utils/cardFormatters'
import type { CardBrand } from '../utils/cardBrands'

interface CardNumberInputProps {
  value: string
  brand: CardBrand
  error?: string
  valid?: boolean
  onChange: (raw: string) => void
  onBlur: () => void
}

export const CardNumberInput = memo(function CardNumberInput({
  value,
  brand,
  error,
  valid,
  onChange,
  onBlur,
}: CardNumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = stripCardNumber(e.target.value)
      onChange(raw)
    },
    [onChange],
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
    ]
    if (allowed.includes(e.key)) return
    if (e.ctrlKey || e.metaKey) return
    if (!/^\d$/.test(e.key)) e.preventDefault()
  }, [])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text')
      const raw = stripCardNumber(pasted)
      onChange(raw)
    },
    [onChange],
  )

  const formatted = formatCardNumber(value, brand)
  const maxLen = Math.max(...brand.lengths) + brand.gaps.length

  return (
    <FormField label="Card Number" error={error} valid={valid}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="cc-number"
        value={formatted}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={onBlur}
        maxLength={maxLen}
        placeholder="0000 0000 0000 0000"
        aria-label="Card number"
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
