import type { CardBrandId } from './cardBrands'

export type CardFunding = 'credit' | 'debit' | 'prepaid' | 'unknown'

export interface CardFundingResult {
  funding: CardFunding
  /** How the result was determined */
  source: 'brand' | 'bin' | 'lookup' | 'none'
  /** Optional scheme/bank hint from lookup */
  bank?: string
}

/** Where a bank prints its name on a physical card, plus a signature accent */
export type BankCorner = 'top-left' | 'top-right' | 'top-center'
export interface BankStyle {
  position: BankCorner
  /** Signature ink color for the bank wordmark */
  color: string
}

const DEFAULT_BANK_STYLE: BankStyle = { position: 'top-left', color: '#F2F5FA' }

/**
 * Per-issuer placement + ink color, mirroring where real cards print the
 * bank name. Matched by keyword against the issuer string.
 */
const BANK_STYLES: Array<{ match: RegExp; style: BankStyle }> = [
  { match: /hdfc/i, style: { position: 'top-left', color: '#EAF0FA' } },
  { match: /icici/i, style: { position: 'top-right', color: '#F7A34B' } },
  { match: /state bank|sbi/i, style: { position: 'top-left', color: '#EAF0FA' } },
  { match: /axis/i, style: { position: 'top-right', color: '#F0C0CE' } },
  { match: /kotak/i, style: { position: 'top-left', color: '#E7315B' } },
  { match: /yes bank/i, style: { position: 'top-left', color: '#EAF0FA' } },
  { match: /punjab national|pnb/i, style: { position: 'top-left', color: '#F5C542' } },
  { match: /bank of baroda|bob/i, style: { position: 'top-left', color: '#F58A2E' } },
  { match: /idfc/i, style: { position: 'top-right', color: '#F04B4B' } },
  { match: /citi/i, style: { position: 'top-left', color: '#EAF0FA' } },
  { match: /hsbc/i, style: { position: 'top-left', color: '#F04B4B' } },
  { match: /standard chartered/i, style: { position: 'top-left', color: '#EAF0FA' } },
  { match: /chase|jpmorgan/i, style: { position: 'top-left', color: '#EAF0FA' } },
  { match: /bank of america/i, style: { position: 'top-left', color: '#E86A6A' } },
  { match: /wells fargo/i, style: { position: 'top-right', color: '#F5C542' } },
  { match: /capital one/i, style: { position: 'top-left', color: '#EAF0FA' } },
  { match: /american express|amex/i, style: { position: 'top-center', color: '#EAF0FA' } },
]

export function getBankStyle(bank: string | undefined): BankStyle {
  if (!bank) return DEFAULT_BANK_STYLE
  const hit = BANK_STYLES.find((b) => b.match.test(bank))
  return hit ? hit.style : DEFAULT_BANK_STYLE
}

const FUNDING_LABELS: Record<CardFunding, string> = {
  credit: 'Credit',
  debit: 'Debit',
  prepaid: 'Prepaid',
  unknown: 'Card',
}

export function fundingLabel(funding: CardFunding): string {
  return FUNDING_LABELS[funding]
}

/**
 * Brand-level defaults when BIN data is not yet available.
 * Maestro is debit-only; Amex is almost always credit.
 */
export function fundingFromBrand(brandId: CardBrandId): CardFundingResult {
  switch (brandId) {
    case 'maestro':
      return { funding: 'debit', source: 'brand' }
    case 'amex':
      return { funding: 'credit', source: 'brand' }
    default:
      return { funding: 'unknown', source: 'none' }
  }
}

/**
 * Well-known BIN prefixes (first 6 digits) for instant offline detection.
 * Includes demo Indian cards + common test ranges. Longer prefixes win.
 */
const BIN_FUNDING: Array<{ prefix: string; funding: CardFunding; bank?: string }> = [
  // ── Credit (demo / simulated Indian cards) ─────────────────────
  { prefix: '453242', funding: 'credit', bank: 'SBI Card' },           // SBI Card ELITE
  { prefix: '524304', funding: 'credit', bank: 'HDFC Bank' },          // HDFC Regalia Gold
  { prefix: '491161', funding: 'credit', bank: 'ICICI Bank' },         // ICICI Amazon Pay
  { prefix: '432187', funding: 'credit', bank: 'Axis Bank' },          // Axis ACE
  { prefix: '374237', funding: 'credit', bank: 'American Express' },   // Amex Platinum Travel

  // ── Debit (demo / simulated Indian cards) ──────────────────────
  { prefix: '510554', funding: 'debit', bank: 'HDFC Bank' },           // HDFC Millennia
  { prefix: '400013', funding: 'debit', bank: 'ICICI Bank' },          // ICICI Coral
  { prefix: '607930', funding: 'debit', bank: 'State Bank of India' }, // SBI Global RuPay
  { prefix: '552319', funding: 'debit', bank: 'Axis Bank' },           // Axis Liberty
  { prefix: '411174', funding: 'credit', bank: 'IDFC FIRST Bank' },   // IDFC FIRST Visa Signature (Signature = credit)

  // ── Generic test cards ─────────────────────────────────────────
  { prefix: '411111', funding: 'credit', bank: 'Test Bank' },
  { prefix: '401288', funding: 'credit', bank: 'Test Bank' },
  { prefix: '400000', funding: 'credit', bank: 'Test Bank' },
  { prefix: '400005', funding: 'debit', bank: 'Test Bank' },
  { prefix: '424242', funding: 'credit', bank: 'Stripe Test Bank' },
  { prefix: '555555', funding: 'credit', bank: 'Test Bank' },
  { prefix: '510510', funding: 'credit', bank: 'Test Bank' },
  { prefix: '520082', funding: 'debit', bank: 'Test Bank' },
  { prefix: '222300', funding: 'credit', bank: 'Test Bank' },
  { prefix: '378282', funding: 'credit', bank: 'American Express' },
  { prefix: '371449', funding: 'credit', bank: 'American Express' },
  { prefix: '340000', funding: 'credit', bank: 'American Express' },
  { prefix: '601111', funding: 'credit', bank: 'Discover Bank' },
  { prefix: '501800', funding: 'debit' },
  { prefix: '675964', funding: 'debit' },
  { prefix: '630400', funding: 'debit', bank: 'Bank of Baroda' },
  { prefix: '607482', funding: 'debit', bank: 'State Bank of India' },
  { prefix: '607200', funding: 'debit', bank: 'HDFC Bank' },
  { prefix: '652150', funding: 'credit', bank: 'ICICI Bank' },
  { prefix: '508500', funding: 'debit', bank: 'Axis Bank' },
]

export function fundingFromBin(rawDigits: string): CardFundingResult | null {
  if (rawDigits.length < 6) return null
  const digits = rawDigits.replace(/\D/g, '')
  // Longest prefix match (supports 6–8 digit BINs)
  let best: (typeof BIN_FUNDING)[number] | null = null
  for (const entry of BIN_FUNDING) {
    if (digits.startsWith(entry.prefix)) {
      if (!best || entry.prefix.length > best.prefix.length) best = entry
    }
  }
  if (!best) return null
  return { funding: best.funding, source: 'bin', bank: best.bank }
}

interface HandyApiResponse {
  Status?: string
  Scheme?: string | null
  Type?: string | null
  Issuer?: string | null
  CardTier?: string | null
}

/**
 * Live BIN lookup via HandyAPI (free, CORS-enabled, no key required).
 * Call only with ≥6 digits; debounced in the hook to respect rate limits.
 * https://www.handyapi.com/bin
 */
export async function lookupCardFunding(rawDigits: string): Promise<CardFundingResult | null> {
  const bin = rawDigits.replace(/\D/g, '').slice(0, 8)
  if (bin.length < 6) return null

  try {
    const res = await fetch(`https://data.handyapi.com/bin/${bin}`)
    if (!res.ok) return null
    const data = (await res.json()) as HandyApiResponse
    if (data.Status !== 'SUCCESS') return null

    let funding: CardFunding = 'unknown'
    const type = (data.Type ?? '').toLowerCase()
    if (type.includes('prepaid')) funding = 'prepaid'
    else if (type.includes('debit')) funding = 'debit'
    else if (type.includes('credit')) funding = 'credit'

    const bank = (data.Issuer ?? '').trim()
    // Keep issuer even when type is missing — still useful on the card face
    if (funding === 'unknown' && !bank) return null

    return {
      funding,
      source: 'lookup',
      bank: bank ? formatBankName(bank) : undefined,
    }
  } catch {
    return null
  }
}

/** Acronyms that must stay fully uppercase in bank names */
const BANK_ACRONYMS = new Set([
  'hdfc', 'icici', 'sbi', 'axis', 'pnb', 'bob', 'idfc', 'hsbc', 'yes',
  'rbl', 'au', 'upi', 'amex', 'citi', 'db', 'sc', 'kotak', 'indusind',
  'canara', 'union', 'federal', 'bandhan',
])

/** Normalize noisy issuer strings into clean card-facing names */
const BANK_ALIASES: Array<{ match: RegExp; name: string }> = [
  { match: /hdfc/i, name: 'HDFC Bank' },
  { match: /icici/i, name: 'ICICI Bank' },
  { match: /state bank of india|\bsbi\b/i, name: 'State Bank of India' },
  { match: /sbi card/i, name: 'SBI Card' },
  { match: /axis/i, name: 'Axis Bank' },
  { match: /idfc/i, name: 'IDFC FIRST Bank' },
  { match: /kotak/i, name: 'Kotak Mahindra Bank' },
  { match: /yes\s*bank/i, name: 'YES Bank' },
  { match: /punjab national|\bpnb\b/i, name: 'PNB' },
  { match: /bank of baroda|\bbob\b/i, name: 'Bank of Baroda' },
  { match: /american express|\bamex\b/i, name: 'American Express' },
  { match: /standard chartered/i, name: 'Standard Chartered' },
  { match: /citibank|\bciti\b/i, name: 'Citi' },
  { match: /hsbc/i, name: 'HSBC' },
  { match: /indusind/i, name: 'IndusInd Bank' },
  { match: /rbl/i, name: 'RBL Bank' },
  { match: /au small finance|^\s*au\b/i, name: 'AU Bank' },
]

/**
 * Formats a raw issuer string for UI:
 * - Maps known banks to short clean names (e.g. "Hdfc Bank Limited" → "HDFC Bank")
 * - Preserves acronyms (HDFC, ICICI, SBI…)
 * - Drops trailing Limited / Ltd noise
 */
export function formatBankName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ')
  if (!trimmed) return trimmed

  // Prefer curated short names for well-known issuers
  // Check SBI Card before generic SBI
  if (/sbi\s*card/i.test(trimmed)) return 'SBI Card'
  const alias = BANK_ALIASES.find((a) => a.match.test(trimmed))
  if (alias) return alias.name

  // Generic cleanup: strip corporate suffixes, fix acronym casing
  const cleaned = trimmed
    .replace(/\b(limited|ltd\.?|llp|inc\.?|corp\.?|corporation|private|pvt\.?)\b/gi, '')
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase()
      if (BANK_ACRONYMS.has(lower)) return lower.toUpperCase()
      if (word === word.toUpperCase() && word.length <= 4) return word
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

/** Instant sync resolution: BIN table → brand default */
export function resolveFundingSync(
  rawDigits: string,
  brandId: CardBrandId,
): CardFundingResult {
  const fromBin = fundingFromBin(rawDigits)
  if (fromBin) return fromBin
  return fundingFromBrand(brandId)
}
