import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CardBrandId } from '../utils/cardBrands'

/* ── SVG Logo Components ─────────────────────────────────────────── */

const VisaLogo = () => (
  <svg viewBox="0 0 60 20" fill="none" aria-label="Visa" role="img" className="h-5 w-auto">
    <text
      x="0"
      y="17"
      fontFamily="Arial, sans-serif"
      fontWeight="bold"
      fontSize="19"
      fill="white"
      letterSpacing="-1"
    >
      VISA
    </text>
  </svg>
)

const MastercardLogo = () => (
  <svg viewBox="0 0 40 26" fill="none" aria-label="Mastercard" role="img" className="h-6 w-auto">
    <circle cx="14" cy="13" r="12" fill="#EB001B" />
    <circle cx="26" cy="13" r="12" fill="#F79E1B" />
    <path
      d="M20 5.5a12 12 0 010 15A12 12 0 0120 5.5z"
      fill="#FF5F00"
    />
  </svg>
)

const AmexLogo = () => (
  <svg viewBox="0 0 54 18" fill="none" aria-label="American Express" role="img" className="h-4 w-auto">
    <text
      x="0"
      y="15"
      fontFamily="Arial, sans-serif"
      fontWeight="800"
      fontSize="13"
      fill="white"
      letterSpacing="1"
    >
      AMEX
    </text>
  </svg>
)

const DiscoverLogo = () => (
  <svg viewBox="0 0 80 24" fill="none" aria-label="Discover" role="img" className="h-5 w-auto">
    <text
      x="0"
      y="18"
      fontFamily="Arial, sans-serif"
      fontWeight="700"
      fontSize="14"
      fill="white"
      letterSpacing="0.5"
    >
      DISCOVER
    </text>
    <circle cx="73" cy="12" r="7" fill="#F79E1B" opacity="0.85" />
  </svg>
)

const RuPayLogo = () => (
  <svg viewBox="0 0 56 22" fill="none" aria-label="RuPay" role="img" className="h-5 w-auto">
    <text
      x="0"
      y="17"
      fontFamily="Arial, sans-serif"
      fontWeight="800"
      fontSize="15"
      fill="white"
      letterSpacing="0.5"
    >
      RuPay
    </text>
  </svg>
)

const MaestroLogo = () => (
  <svg viewBox="0 0 42 26" fill="none" aria-label="Maestro" role="img" className="h-6 w-auto">
    <circle cx="14" cy="13" r="12" fill="#00A2E5" />
    <circle cx="28" cy="13" r="12" fill="#CC0000" />
    <path
      d="M21 4.8a12 12 0 010 16.4A12 12 0 0121 4.8z"
      fill="#7B0099"
    />
  </svg>
)

const UnknownLogo = () => (
  <svg viewBox="0 0 36 26" fill="none" aria-label="Card" role="img" className="h-6 w-auto">
    <rect x="0" y="1" width="36" height="24" rx="4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
    <rect x="0" y="8" width="36" height="5" fill="rgba(255,255,255,0.15)" />
  </svg>
)

const logos: Record<CardBrandId, React.ComponentType> = {
  visa: VisaLogo,
  mastercard: MastercardLogo,
  amex: AmexLogo,
  discover: DiscoverLogo,
  rupay: RuPayLogo,
  maestro: MaestroLogo,
  unknown: UnknownLogo,
}

interface CardBrandLogoProps {
  brandId: CardBrandId
  className?: string
}

export const CardBrandLogo = memo(function CardBrandLogo({
  brandId,
  className = '',
}: CardBrandLogoProps) {
  const Logo = logos[brandId]

  return (
    <div className={`relative flex items-center justify-end ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={brandId}
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Logo />
        </motion.div>
      </AnimatePresence>
    </div>
  )
})

/* ── Small input-area logo for card number field ─────────────────── */
interface SmallBrandBadgeProps {
  brandId: CardBrandId
}

const smallLogos: Record<CardBrandId, React.ComponentType> = {
  visa: () => (
    <svg viewBox="0 0 48 16" fill="none" className="h-4 w-auto">
      <text x="0" y="13" fontFamily="Arial" fontWeight="bold" fontSize="15" fill="#1A1F71">VISA</text>
    </svg>
  ),
  mastercard: () => (
    <svg viewBox="0 0 32 22" fill="none" className="h-5 w-auto">
      <circle cx="11" cy="11" r="10" fill="#EB001B" />
      <circle cx="21" cy="11" r="10" fill="#F79E1B" />
      <path d="M16 3.5a10 10 0 010 15A10 10 0 0116 3.5z" fill="#FF5F00" />
    </svg>
  ),
  amex: () => (
    <svg viewBox="0 0 46 16" fill="none" className="h-4 w-auto">
      <text x="0" y="13" fontFamily="Arial" fontWeight="800" fontSize="12" fill="#2E77BC" letterSpacing="1">AMEX</text>
    </svg>
  ),
  discover: () => (
    <svg viewBox="0 0 68 20" fill="none" className="h-4 w-auto">
      <text x="0" y="14" fontFamily="Arial" fontWeight="700" fontSize="11" fill="#F76F20" letterSpacing="0.3">DISCOVER</text>
    </svg>
  ),
  rupay: () => (
    <svg viewBox="0 0 48 18" fill="none" className="h-4 w-auto">
      <text x="0" y="14" fontFamily="Arial" fontWeight="800" fontSize="13" fill="#1A7A1A">RuPay</text>
    </svg>
  ),
  maestro: () => (
    <svg viewBox="0 0 34 22" fill="none" className="h-5 w-auto">
      <circle cx="11" cy="11" r="10" fill="#00A2E5" />
      <circle cx="23" cy="11" r="10" fill="#CC0000" />
      <path d="M17 3a10 10 0 010 16A10 10 0 0117 3z" fill="#7B0099" />
    </svg>
  ),
  unknown: () => null,
}

export const SmallBrandBadge = memo(function SmallBrandBadge({ brandId }: SmallBrandBadgeProps) {
  const Logo = smallLogos[brandId]
  if (brandId === 'unknown') return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={brandId}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.7 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      >
        <Logo />
      </motion.div>
    </AnimatePresence>
  )
})
