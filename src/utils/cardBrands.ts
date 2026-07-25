export type CardBrandId =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'rupay'
  | 'maestro'
  | 'unknown'

export interface CardBrand {
  id: CardBrandId
  name: string
  pattern: RegExp
  /** Valid card number lengths (stripped of spaces) */
  lengths: number[]
  cvvLength: number
  /** Positions (in raw digit string) where spaces are inserted */
  gaps: number[]
  /** Tailwind / CSS hue value for accent theming */
  accentHue: number
  /** Gradient colors for the preview card */
  cardGradient: [string, string]
}

// Ordered by specificity — more specific patterns before broader ones
export const CARD_BRANDS: CardBrand[] = [
  {
    id: 'amex',
    name: 'American Express',
    pattern: /^3[47]/,
    lengths: [15],
    cvvLength: 4,
    gaps: [4, 10],
    accentHue: 45,
    cardGradient: ['#2D7DD2', '#1A4B8C'],
  },
  {
    id: 'maestro',
    name: 'Maestro',
    pattern: /^(?:5018|5020|5038|6304|6759|676[1-3])/,
    lengths: [12, 13, 14, 15, 16, 17, 18, 19],
    cvvLength: 3,
    gaps: [4, 8, 12],
    accentHue: 225,
    cardGradient: ['#1A237E', '#283593'],
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    pattern: /^(5[1-5]|2(?:2[2-9]|[3-6]\d|7[01]|720))/,
    lengths: [16],
    cvvLength: 3,
    gaps: [4, 8, 12],
    accentHue: 20,
    cardGradient: ['#EB5757', '#B83232'],
  },
  {
    id: 'rupay',
    name: 'RuPay',
    pattern: /^(60|652[1-9]|6530|6560|817[0-9]|8212|8517)/,
    lengths: [16],
    cvvLength: 3,
    gaps: [4, 8, 12],
    accentHue: 340,
    cardGradient: ['#0A3D0A', '#1B5E20'],
  },
  {
    id: 'discover',
    name: 'Discover',
    pattern: /^6(?:011|5)/,
    lengths: [16, 19],
    cvvLength: 3,
    gaps: [4, 8, 12],
    accentHue: 28,
    cardGradient: ['#F57C00', '#E65100'],
  },
  {
    id: 'visa',
    name: 'Visa',
    pattern: /^4/,
    lengths: [13, 16, 19],
    cvvLength: 3,
    gaps: [4, 8, 12],
    accentHue: 220,
    cardGradient: ['#1A237E', '#0D47A1'],
  },
]

export const UNKNOWN_BRAND: CardBrand = {
  id: 'unknown',
  name: 'Card',
  pattern: /^$/,
  lengths: [16],
  cvvLength: 3,
  gaps: [4, 8, 12],
  accentHue: 213,
  cardGradient: ['#334155', '#1e293b'],
}

export function detectCardBrand(rawDigits: string): CardBrand {
  if (!rawDigits) return UNKNOWN_BRAND
  return CARD_BRANDS.find((b) => b.pattern.test(rawDigits)) ?? UNKNOWN_BRAND
}
