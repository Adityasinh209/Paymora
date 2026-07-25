import { useEffect, useRef, useState } from 'react'
import type { CardBrandId } from '../utils/cardBrands'
import {
  lookupCardFunding,
  resolveFundingSync,
  type CardFundingResult,
} from '../utils/cardFunding'

const EMPTY: CardFundingResult = { funding: 'unknown', source: 'none' }

/**
 * Resolves credit / debit / prepaid from the card number.
 * 1. Instant local BIN + brand heuristics
 * 2. Debounced live BIN lookup once ≥6 digits
 *
 * Lookup results are cached by BIN so typing the remaining digits
 * after a successful lookup does not wipe the credit/debit badge.
 */
export function useCardFunding(
  rawDigits: string,
  brandId: CardBrandId,
): CardFundingResult {
  const [result, setResult] = useState<CardFundingResult>(EMPTY)
  const requestId = useRef(0)
  // Cache the last successful live lookup keyed by BIN
  const lookupCache = useRef<{ bin: string; result: CardFundingResult } | null>(null)

  const bin = rawDigits.slice(0, 8)

  // Resolve on every keystroke — prefer local match, then cached lookup for this BIN
  useEffect(() => {
    if (rawDigits.length < 4) {
      setResult(EMPTY)
      return
    }

    const sync = resolveFundingSync(rawDigits, brandId)

    // Curated local BIN hit (demo + known ranges) is authoritative
    if (sync.source === 'bin') {
      setResult(sync)
      return
    }

    // Keep a previous live lookup if it still matches the current BIN
    if (
      lookupCache.current &&
      bin.length >= 6 &&
      bin.startsWith(lookupCache.current.bin.slice(0, 6))
    ) {
      // Merge brand default funding if lookup only had a bank
      const cached = lookupCache.current.result
      if (cached.funding !== 'unknown') {
        setResult(cached)
      } else if (sync.funding !== 'unknown') {
        setResult({ ...cached, funding: sync.funding })
      } else {
        setResult(cached)
      }
      return
    }

    // Brand-level fallback (e.g. Amex → credit) while waiting for lookup
    if (sync.funding !== 'unknown') {
      setResult(sync)
      return
    }

    setResult(EMPTY)
  }, [rawDigits, brandId, bin])

  // Debounced network lookup for BINs not in the local table
  useEffect(() => {
    if (bin.length < 6) {
      lookupCache.current = null
      return
    }

    // Curated local BIN with bank — never overwrite with noisy live data
    const sync = resolveFundingSync(rawDigits, brandId)
    if (sync.source === 'bin' && sync.bank) return

    if (lookupCache.current?.bin === bin) return

    const id = ++requestId.current
    const timer = window.setTimeout(async () => {
      const lookedUp = await lookupCardFunding(bin)
      if (id !== requestId.current) return
      if (lookedUp) {
        lookupCache.current = { bin, result: lookedUp }
        setResult((prev) => {
          if (prev.source === 'bin' && prev.bank) return prev
          // If live has bank but unknown funding, keep prior funding (e.g. Amex brand default)
          if (lookedUp.funding === 'unknown' && prev.funding !== 'unknown') {
            return { ...lookedUp, funding: prev.funding }
          }
          return lookedUp
        })
      }
    }, 400)

    return () => window.clearTimeout(timer)
  }, [bin, rawDigits, brandId])

  return result
}
