import { memo, useMemo, useEffect, type CSSProperties } from 'react'
import { motion, AnimatePresence, useTransform, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { CardBrandLogo } from './CardBrandLogo'
import { useCardTilt } from '../hooks/useCardTilt'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { getCardDisplayGroups } from '../utils/cardFormatters'
import type { CardBrand } from '../utils/cardBrands'
import type { CardFunding } from '../utils/cardFunding'
import { fundingLabel, getBankStyle } from '../utils/cardFunding'

interface CardPreviewProps {
  cardNumber: string
  cardHolder: string
  expiry: string
  cvv: string
  isFlipped: boolean
  brand: CardBrand
  funding?: CardFunding
  /** Issuing bank name (from BIN lookup) */
  bank?: string
  /** True when the full valid card number length has been entered */
  isNumberComplete?: boolean
}

/** Bank wordmark printed in its issuer-specific corner */
function BankName({ bank, color }: { bank: string; color: string }) {
  return (
    <motion.div
      key={bank}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col leading-none"
      aria-label={`Issuing bank: ${bank}`}
    >
      <span
        className="text-[12px] sm:text-[14px] font-extrabold uppercase tracking-[0.06em] truncate max-w-[200px]"
        style={{
          color,
          textShadow: '0 1px 2px rgba(0,0,0,0.45), 0 0 1px rgba(0,0,0,0.3)',
        }}
        title={bank}
      >
        {bank}
      </span>
    </motion.div>
  )
}

/** Brand-specific design overlays that reveal when the full card number is entered */
function BrandSkin({ brandId }: { brandId: string }) {
  switch (brandId) {
    case 'visa':
      return (
        <div className="absolute inset-0 overflow-hidden rounded-[18px]" aria-hidden="true">
          {/* Deep navy base with diagonal wave pattern */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, #0A1744 0%, #1a237e 40%, #0D47A1 70%, #1565C0 100%)',
            }}
          />
          {/* Subtle horizontal stripe texture */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,1) 3px, rgba(255,255,255,1) 4px)',
            }}
          />
          {/* Diagonal light sweep */}
          <div
            className="absolute"
            style={{
              top: '-30%',
              left: '10%',
              width: '65%',
              height: '200%',
              background:
                'linear-gradient(90deg, transparent 0%, rgba(100,160,255,0.12) 50%, transparent 100%)',
              transform: 'rotate(-20deg)',
            }}
          />
          {/* Large ghost VISA behind content */}
          <div
            className="absolute bottom-4 right-5 select-none pointer-events-none"
            style={{
              fontSize: 52,
              fontStyle: 'italic',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: 'rgba(255,255,255,0.07)',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            VISA
          </div>
          {/* Subtle dove / wave motif at bottom */}
          <svg
            className="absolute bottom-0 left-0 w-full opacity-[0.07]"
            viewBox="0 0 420 80"
            preserveAspectRatio="none"
          >
            <path
              d="M0 60 Q60 20 120 50 Q180 80 240 45 Q300 10 360 40 Q390 55 420 35 L420 80 L0 80 Z"
              fill="rgba(255,255,255,0.7)"
            />
          </svg>
        </div>
      )

    case 'mastercard':
      return (
        <div className="absolute inset-0 overflow-hidden rounded-[18px]" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(145deg, #1c1c1e 0%, #2d2d2d 50%, #111 100%)',
            }}
          />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          {/* Iconic overlapping circles — bottom-right */}
          <div className="absolute bottom-5 right-5">
            <svg width="82" height="52" viewBox="0 0 82 52">
              <circle cx="28" cy="26" r="26" fill="#EB001B" opacity="0.92" />
              <circle cx="54" cy="26" r="26" fill="#F79E1B" opacity="0.92" />
              {/* Overlap blend */}
              <ellipse cx="41" cy="26" rx="9" ry="20" fill="url(#mcBlend)" opacity="0.85" />
              <defs>
                <linearGradient id="mcBlend" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#EB001B" />
                  <stop offset="50%" stopColor="#FF5F00" />
                  <stop offset="100%" stopColor="#F79E1B" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Light diagonal sweep */}
          <div
            className="absolute"
            style={{
              top: '-40%',
              left: '30%',
              width: '45%',
              height: '220%',
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
              transform: 'rotate(-18deg)',
            }}
          />
        </div>
      )

    case 'amex':
      return (
        <div className="absolute inset-0 overflow-hidden rounded-[18px]" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(145deg, #006FCF 0%, #0070CC 35%, #004A9A 70%, #003580 100%)',
            }}
          />
          {/* Fine horizontal texture */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(255,255,255,1) 5px, rgba(255,255,255,1) 6px)',
            }}
          />
          {/* Centurion ghost silhouette */}
          <svg
            className="absolute"
            style={{ right: -4, bottom: -4, opacity: 0.07 }}
            width="130"
            height="130"
            viewBox="0 0 130 130"
            fill="white"
          >
            <ellipse cx="65" cy="42" rx="22" ry="28" />
            <path d="M32 130 Q38 90 65 75 Q92 90 98 130 Z" />
            <path d="M38 70 Q20 62 14 45 Q28 50 38 60 Z" />
            <path d="M92 70 Q110 62 116 45 Q102 50 92 60 Z" />
            <path d="M50 44 Q52 34 65 30 Q78 34 80 44 Q72 52 58 52 Z" />
          </svg>
          {/* Top-right gloss */}
          <div
            className="absolute"
            style={{
              top: 0,
              right: 0,
              width: '55%',
              height: '50%',
              background:
                'radial-gradient(ellipse at 80% 10%, rgba(255,255,255,0.15) 0%, transparent 60%)',
            }}
          />
        </div>
      )

    case 'rupay':
      return (
        <div className="absolute inset-0 overflow-hidden rounded-[18px]" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(140deg, #083D0E 0%, #0A5C14 35%, #1B5E20 65%, #0D3B10 100%)',
            }}
          />
          {/* Ashoka Chakra ghost watermark */}
          <svg
            className="absolute"
            style={{ right: -12, bottom: -12, opacity: 0.09 }}
            width="160"
            height="160"
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle cx="50" cy="50" r="44" stroke="white" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="34" stroke="white" strokeWidth="1.2" />
            <circle cx="50" cy="50" r="6" fill="white" />
            {Array.from({ length: 24 }, (_, i) => {
              const angle = (i * 360) / 24
              const rad = (angle * Math.PI) / 180
              const x1 = 50 + 7 * Math.cos(rad)
              const y1 = 50 + 7 * Math.sin(rad)
              const x2 = 50 + 32 * Math.cos(rad)
              const y2 = 50 + 32 * Math.sin(rad)
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="white"
                  strokeWidth="1.2"
                />
              )
            })}
          </svg>
          {/* Saffron accent bar at top */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: 5,
              background:
                'linear-gradient(90deg, #FF9933 0%, #FF7700 50%, #FF9933 100%)',
              opacity: 0.7,
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: 5,
              background:
                'linear-gradient(90deg, #138808 0%, #0B6600 50%, #138808 100%)',
              opacity: 0.7,
            }}
          />
        </div>
      )

    case 'discover':
      return (
        <div className="absolute inset-0 overflow-hidden rounded-[18px]" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(140deg, #212121 0%, #1a1a1a 40%, #2a1800 80%, #1c1100 100%)',
            }}
          />
          {/* Discover orange spot burst — bottom-right */}
          <div
            className="absolute"
            style={{
              bottom: -30,
              right: -30,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, #F76F20 0%, #E65100 35%, transparent 70%)',
              opacity: 0.55,
            }}
          />
          {/* Inner glow from the spot */}
          <div
            className="absolute"
            style={{
              bottom: -8,
              right: -8,
              width: 90,
              height: 90,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, #FF8C42 0%, #F57C00 40%, transparent 70%)',
              opacity: 0.45,
            }}
          />
          {/* Fine diagonal lines */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,1) 8px, rgba(255,255,255,1) 9px)',
            }}
          />
        </div>
      )

    case 'maestro':
      return (
        <div className="absolute inset-0 overflow-hidden rounded-[18px]" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(145deg, #0D1B5E 0%, #1A237E 40%, #283593 70%, #1A237E 100%)',
            }}
          />
          {/* Two overlapping circles (Maestro brand) */}
          <div className="absolute bottom-5 right-5">
            <svg width="70" height="46" viewBox="0 0 70 46">
              <circle cx="24" cy="23" r="22" fill="#EB001B" opacity="0.88" />
              <circle cx="46" cy="23" r="22" fill="#0099DF" opacity="0.88" />
              <ellipse cx="35" cy="23" rx="8" ry="17" fill="url(#maestroBlend)" opacity="0.8" />
              <defs>
                <linearGradient id="maestroBlend" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#EB001B" />
                  <stop offset="50%" stopColor="#7C30C4" />
                  <stop offset="100%" stopColor="#0099DF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div
            className="absolute"
            style={{
              top: '-40%',
              left: '20%',
              width: '60%',
              height: '220%',
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
              transform: 'rotate(-15deg)',
            }}
          />
        </div>
      )

    default:
      return null
  }
}

/** Realistic EMV chip with contact pads */
function EmvChip() {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: 48,
        height: 36,
        borderRadius: 6,
        background: 'linear-gradient(145deg, #e8c96a 0%, #c9a227 35%, #f5e6a8 55%, #b8922a 100%)',
        boxShadow:
          'inset 0 1px 1px rgba(255,255,255,0.65), inset 0 -1px 2px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.25)',
      }}
      aria-hidden="true"
    >
      {/* Contact pad grid */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 36" fill="none">
        {/* Outer rim */}
        <rect x="1" y="1" width="46" height="34" rx="5" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
        {/* Horizontal rails */}
        <line x1="0" y1="10" x2="48" y2="10" stroke="rgba(0,0,0,0.22)" strokeWidth="0.7" />
        <line x1="0" y1="18" x2="48" y2="18" stroke="rgba(0,0,0,0.22)" strokeWidth="0.7" />
        <line x1="0" y1="26" x2="48" y2="26" stroke="rgba(0,0,0,0.22)" strokeWidth="0.7" />
        {/* Vertical rails */}
        <line x1="14" y1="0" x2="14" y2="36" stroke="rgba(0,0,0,0.22)" strokeWidth="0.7" />
        <line x1="24" y1="0" x2="24" y2="36" stroke="rgba(0,0,0,0.22)" strokeWidth="0.7" />
        <line x1="34" y1="0" x2="34" y2="36" stroke="rgba(0,0,0,0.22)" strokeWidth="0.7" />
        {/* Center contact island */}
        <rect
          x="16"
          y="12"
          width="16"
          height="12"
          rx="1.5"
          fill="rgba(0,0,0,0.08)"
          stroke="rgba(0,0,0,0.28)"
          strokeWidth="0.8"
        />
        {/* Highlight sheen */}
        <rect x="2" y="2" width="18" height="8" rx="2" fill="rgba(255,255,255,0.28)" />
      </svg>
    </div>
  )
}

/** Contactless / NFC wave icon */
function ContactlessIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className="opacity-80"
    >
      <path
        d="M8 10.5c2.2-2.2 5.8-2.2 8 0"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 7c3.5-3.5 9.5-3.5 13 0"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 14c1.1-1.1 2.9-1.1 4 0"
        stroke="rgba(255,255,255,0.95)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.5" r="1.2" fill="rgba(255,255,255,0.9)" />
    </svg>
  )
}

export const CardPreview = memo(function CardPreview({
  cardNumber,
  cardHolder,
  expiry,
  cvv,
  isFlipped,
  brand,
  funding = 'unknown',
  bank,
  isNumberComplete = false,
}: CardPreviewProps) {
  const bankStyle = getBankStyle(bank)
  const showBank = Boolean(bank)
  const prefersReduced = useReducedMotion()
  const { containerRef, rotateX, rotateY, shineX, shineY } = useCardTilt({
    disabled: prefersReduced,
  })

  const flipTarget = useMotionValue(0)
  const flipSpring = useSpring(flipTarget, {
    stiffness: 240,
    damping: 30,
    mass: 0.75,
  })

  useEffect(() => {
    flipTarget.set(isFlipped ? 180 : 0)
  }, [isFlipped, flipTarget])

  const combinedRotateY = useTransform(
    [rotateY, flipSpring] as const,
    ([tilt, flip]: number[]) => tilt + flip,
  )

  const shineGradient = useMotionTemplate`radial-gradient(
    circle at ${shineX}% ${shineY}%,
    rgba(255,255,255,0.28) 0%,
    rgba(255,255,255,0.08) 35%,
    transparent 65%
  )`

  const displayGroups = useMemo(
    () => getCardDisplayGroups(cardNumber, brand),
    [cardNumber, brand],
  )

  const [colorFrom, colorTo] = brand.cardGradient

  const displayExpiry = useMemo(() => {
    const digits = expiry.replace(/\D/g, '')
    if (!digits) return '••/••'
    const mm = digits.slice(0, 2).padEnd(2, '•')
    const yy = digits.slice(2, 4).padEnd(2, '•')
    return `${mm}/${yy}`
  }, [expiry])

  const displayHolder = cardHolder.trim() || 'FULL NAME'

  const faceStyle: CSSProperties = {
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    aspectRatio: '1.586 / 1',
    borderRadius: 18,
    boxShadow:
      '0 2px 0 rgba(255,255,255,0.12) inset, 0 -1px 0 rgba(0,0,0,0.2) inset, 0 40px 80px rgba(0,0,0,0.28), 0 12px 28px rgba(0,0,0,0.18)',
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[420px] mx-auto select-none"
      style={{ perspective: '1200px' }}
      aria-label="Card preview"
    >
      <motion.div
        className="relative w-full"
        style={{
          transformStyle: 'preserve-3d',
          rotateX: prefersReduced ? 0 : rotateX,
          rotateY: prefersReduced ? (isFlipped ? 180 : 0) : combinedRotateY,
          willChange: 'transform',
        }}
        animate={prefersReduced ? { rotateY: isFlipped ? 180 : 0 } : {}}
        transition={{ duration: 0 }}
      >
        {/* ── Front Face ─────────────────────────────────────── */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            ...faceStyle,
            background: `
              linear-gradient(160deg, rgba(255,255,255,0.18) 0%, transparent 42%),
              linear-gradient(135deg, ${colorFrom} 0%, ${colorTo} 55%, ${colorFrom} 100%)
            `,
          }}
        >
          {/* Brand-specific realistic skin — fades in when card number is complete */}
          <AnimatePresence>
            {isNumberComplete && brand.id !== 'unknown' && (
              <motion.div
                key={brand.id}
                className="absolute inset-0 z-[1]"
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <BrandSkin brandId={brand.id} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Plastic grain / micro texture — z-[2] keeps overlays above brand skin */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.07] z-[2]"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            }}
          />

          {/* Holographic foil strip (subtle rainbow) */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '18%',
              right: '-5%',
              width: '55%',
              height: '48%',
              background:
                'linear-gradient(115deg, transparent 20%, rgba(255,120,180,0.12) 35%, rgba(120,200,255,0.14) 50%, rgba(180,255,160,0.10) 65%, transparent 80%)',
              transform: 'skewX(-12deg)',
              mixBlendMode: 'soft-light',
            }}
          />

          {/* Soft specular highlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 18% 12%, rgba(255,255,255,0.22) 0%, transparent 55%)',
            }}
          />

          {/* Thin metallic rim */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[18px]"
            style={{
              boxShadow:
                'inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 0 0 2px rgba(0,0,0,0.08)',
            }}
          />

          {/* Cursor shine */}
          {!prefersReduced && (
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-[18px]"
              style={{ background: shineGradient }}
            />
          )}

          {/* Card content — above skin overlays */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-7 z-[2]">
            {/* Top group: bank wordmark (issuer-specific corner) + network logo */}
            <div>
              <div className="flex items-start justify-between gap-2 min-h-[22px]">
                {/* Left slot */}
                <div className="flex-1 min-w-0">
                  <AnimatePresence>
                    {showBank && bankStyle.position === 'top-left' && (
                      <BankName key="bl" bank={bank!} color={bankStyle.color} />
                    )}
                  </AnimatePresence>
                </div>
                {/* Center slot */}
                <div className="flex-1 flex justify-center min-w-0">
                  <AnimatePresence>
                    {showBank && bankStyle.position === 'top-center' && (
                      <BankName key="bc" bank={bank!} color={bankStyle.color} />
                    )}
                  </AnimatePresence>
                </div>
                {/* Right slot: bank (if top-right) otherwise the network logo */}
                <div className="flex-1 flex justify-end min-w-0">
                  {showBank && bankStyle.position === 'top-right' ? (
                    <AnimatePresence>
                      <BankName key="br" bank={bank!} color={bankStyle.color} />
                    </AnimatePresence>
                  ) : (
                    <CardBrandLogo brandId={brand.id} className="h-8 drop-shadow-sm" />
                  )}
                </div>
              </div>

              {/* Chip + contactless — network logo shifts here if bank took the top-right */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <EmvChip />
                  <ContactlessIcon />
                </div>
                {showBank && bankStyle.position === 'top-right' && (
                  <CardBrandLogo brandId={brand.id} className="h-7 drop-shadow-sm" />
                )}
              </div>
            </div>

            {/* Embossed card number */}
            <div
              className="flex items-center gap-3 sm:gap-4 font-mono mt-2"
              aria-label={`Card number: ${displayGroups.join(' ')}`}
            >
              {displayGroups.map((group, i) => (
                <span
                  key={i}
                  className="text-white text-[17px] sm:text-[20px] font-semibold tracking-widest"
                  style={{
                    letterSpacing: '0.14em',
                    textShadow:
                      '0 1px 0 rgba(255,255,255,0.25), 0 2px 3px rgba(0,0,0,0.45), 0 -1px 0 rgba(0,0,0,0.2)',
                  }}
                >
                  {group}
                </span>
              ))}
            </div>

            {/* Bottom: holder + funding + expiry */}
            <div className="flex items-end justify-between gap-4">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-white/55 text-[9px] font-semibold uppercase tracking-[0.18em]">
                  Card Holder
                </span>
                <span
                  className="text-white text-[13px] sm:text-sm font-semibold tracking-wider truncate max-w-[200px] uppercase"
                  style={{
                    textShadow:
                      '0 1px 0 rgba(255,255,255,0.2), 0 2px 3px rgba(0,0,0,0.4)',
                  }}
                >
                  {displayHolder}
                </span>
              </div>

              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                {funding !== 'unknown' && (
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.14em] text-white/95"
                    style={{
                      background: 'rgba(255,255,255,0.25)',
                      border: '1px solid rgba(255,255,255,0.35)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                    }}
                  >
                    {fundingLabel(funding)}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="text-white/55 text-[9px] font-semibold uppercase tracking-[0.18em]">
                  Expires
                </span>
                <span
                  className="text-white text-[13px] sm:text-sm font-semibold tracking-wider font-mono"
                  style={{
                    textShadow:
                      '0 1px 0 rgba(255,255,255,0.2), 0 2px 3px rgba(0,0,0,0.4)',
                  }}
                >
                  {displayExpiry}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Back Face ──────────────────────────────────────── */}
        <div
          className="absolute inset-0 w-full overflow-hidden"
          style={{
            ...faceStyle,
            transform: 'rotateY(180deg)',
            background: `
              linear-gradient(160deg, rgba(255,255,255,0.12) 0%, transparent 40%),
              linear-gradient(135deg, ${colorTo} 0%, ${colorFrom} 100%)
            `,
          }}
        >
          {/* Grain */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            }}
          />

          {/* Magnetic stripe */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: '18%',
              height: '20%',
              background:
                'linear-gradient(180deg, #0a0a0a 0%, #2a2a2a 30%, #1a1a1a 50%, #333 70%, #0d0d0d 100%)',
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.5)',
            }}
            aria-hidden="true"
          />

          {/* Signature panel + CVV */}
          <div
            className="absolute left-5 right-5"
            style={{ top: '46%' }}
            aria-label={`Security code: ${cvv || '•••'}`}
          >
            <div
              className="h-11 rounded-sm flex items-center justify-end px-2.5 gap-3"
              style={{
                background:
                  'repeating-linear-gradient(0deg, #efe8d4, #efe8d4 1.5px, #e2d8bc 1.5px, #e2d8bc 3px)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
              }}
            >
              <span className="mr-auto text-slate-500/70 text-[9px] font-semibold tracking-widest italic pl-1">
                AUTHORIZED SIGNATURE
              </span>
              <span
                className="bg-white px-3 py-1.5 rounded-sm font-mono text-sm font-bold text-slate-800 min-w-[52px] text-center shadow-sm"
                style={{ letterSpacing: '0.22em' }}
              >
                {cvv || '•••'}
              </span>
            </div>

            <p className="mt-3 text-white/40 text-[9px] leading-relaxed max-w-[90%]">
              This card is property of the issuing bank. Use is subject to the cardholder agreement.
            </p>
          </div>

          <div className="absolute bottom-5 right-6">
            <CardBrandLogo brandId={brand.id} />
          </div>
        </div>
      </motion.div>
    </div>
  )
})
