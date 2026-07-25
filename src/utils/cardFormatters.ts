import type { CardBrand } from './cardBrands'
import { UNKNOWN_BRAND } from './cardBrands'

/**
 * Format raw digits into display string using the brand's gap positions.
 * e.g. Amex: "378282246310005" → "3782 822463 10005"
 */
export function formatCardNumber(raw: string, brand: CardBrand = UNKNOWN_BRAND): string {
  const digits = raw.replace(/\D/g, '')
  const maxLen = Math.max(...brand.lengths)
  const capped = digits.slice(0, maxLen)
  const gaps = brand.gaps

  let result = ''
  for (let i = 0; i < capped.length; i++) {
    if (gaps.includes(i) && i !== 0) result += ' '
    result += capped[i]
  }
  return result
}

/**
 * Strip all non-digits from a card number string.
 */
export function stripCardNumber(formatted: string): string {
  return formatted.replace(/\D/g, '')
}

/**
 * Format raw 4-digit expiry into "MM / YY".
 * Handles partial input gracefully.
 */
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return digits

  const mm = digits.slice(0, 2)
  const yy = digits.slice(2)
  return `${mm} / ${yy}`
}

/**
 * Extract raw digits from formatted expiry "MM / YY".
 */
export function stripExpiry(formatted: string): string {
  return formatted.replace(/\D/g, '')
}

/**
 * Parse expiry into { month, year } (1-indexed month, 4-digit year).
 * Returns null if the string is incomplete.
 */
export function parseExpiry(formatted: string): { month: number; year: number } | null {
  const digits = stripExpiry(formatted)
  if (digits.length < 4) return null
  const month = parseInt(digits.slice(0, 2), 10)
  const year = 2000 + parseInt(digits.slice(2, 4), 10)
  return { month, year }
}

/**
 * Title-case a cardholder name, allowing only alphabetic chars,
 * spaces, hyphens, apostrophes, and periods.
 */
export function formatCardHolder(raw: string): string {
  // Allow letters, spaces, hyphens, apostrophes, periods
  const cleaned = raw.replace(/[^a-zA-Z\s\-'.]/g, '')
  return cleaned
    .split(' ')
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ')
}

/**
 * Clamp CVV to digits only, max length based on brand.
 */
export function formatCVV(raw: string, cvvLength: number): string {
  return raw.replace(/\D/g, '').slice(0, cvvLength)
}

/**
 * Get a masked display version of the card number for the card preview.
 * Shows last 4 digits, bullets otherwise.
 */
export function maskCardNumber(formatted: string, brand: CardBrand = UNKNOWN_BRAND): string {
  const digits = stripCardNumber(formatted)
  const maxLen = Math.max(...brand.lengths)

  // Pad with placeholders
  const padded = digits.padEnd(maxLen, '•')
  return formatCardNumber(padded, brand)
}

/**
 * Returns a display-ready card number for the card face.
 * Groups are either filled digits or bullet groups.
 * Pads to the nearest valid length (or min length) — never beyond a valid length.
 */
export function getCardDisplayGroups(rawDigits: string, brand: CardBrand): string[] {
  const len = rawDigits.length
  // Find target display length: smallest valid length >= typed digits
  const sortedLengths = [...brand.lengths].sort((a, b) => a - b)
  const targetLen = sortedLengths.find((l) => l >= len) ?? sortedLengths[sortedLengths.length - 1]

  const padded = rawDigits.padEnd(targetLen, '•')
  const gaps = brand.gaps

  const groups: string[] = []
  let current = ''

  for (let i = 0; i < padded.length; i++) {
    if (gaps.includes(i) && i !== 0) {
      groups.push(current)
      current = ''
    }
    current += padded[i]
  }
  if (current) groups.push(current)

  return groups
}
