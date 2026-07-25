import { useMemo } from 'react'
import { detectCardBrand, UNKNOWN_BRAND } from '../utils/cardBrands'
import type { CardBrand } from '../utils/cardBrands'

export function useCardBrand(rawDigits: string): CardBrand {
  return useMemo(() => {
    if (!rawDigits) return UNKNOWN_BRAND
    return detectCardBrand(rawDigits)
  }, [rawDigits])
}
