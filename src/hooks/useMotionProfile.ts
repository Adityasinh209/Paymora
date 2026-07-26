import { useMemo, type CSSProperties } from 'react'
import { useMediaQuery } from './useMediaQuery'
import { useReducedMotion } from './useReducedMotion'

export type MotionProfile = {
  /** OS “reduce motion” preference */
  reduced: boolean
  /** Phone / constrained GPU / battery-saver class device */
  lowPower: boolean
  /** Prefer FLIP/layout morphs (desktop-class only) */
  enableLayout: boolean
  /** Animating CSS filters (blur) is expensive — keep off on low power */
  enableBlur: boolean
  /** Floating background card drift */
  enableBgMotion: boolean
  /** Soft, critically-damped springs — feel smooth on 60 & 120Hz */
  spring: { type: 'spring'; stiffness: number; damping: number; mass: number }
  springSnappy: { type: 'spring'; stiffness: number; damping: number; mass: number }
  /** Opacity / short fades */
  fade: { duration: number; ease: [number, number, number, number] }
  /** Tab / panel slide */
  slide: { duration: number; ease: [number, number, number, number] }
}

function detectLowPower(isNarrow: boolean): boolean {
  if (typeof window === 'undefined') return isNarrow

  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean; effectiveType?: string }
  }

  if (nav.connection?.saveData) return true
  if (nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g') return true
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) return true
  if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4) {
    // Many phones report 4–8; pair with narrow viewport
    if (isNarrow) return true
  }
  if (isNarrow) return true
  return false
}

/**
 * Device-aware motion tuning so animations stay at ~60fps on phones
 * and feel premium on desktop without changing the visual language.
 */
export function useMotionProfile(): MotionProfile {
  const reduced = useReducedMotion()
  const isNarrow = useMediaQuery('(max-width: 639px)')

  return useMemo(() => {
    const lowPower = reduced || detectLowPower(isNarrow)

    return {
      reduced,
      lowPower,
      enableLayout: !lowPower && !reduced,
      enableBlur: !lowPower && !reduced,
      enableBgMotion: !lowPower && !reduced,
      // Critically-damped: settles cleanly, minimal bounce (smoother on every refresh rate)
      spring: lowPower
        ? { type: 'spring', stiffness: 320, damping: 34, mass: 0.7 }
        : { type: 'spring', stiffness: 260, damping: 28, mass: 0.75 },
      springSnappy: lowPower
        ? { type: 'spring', stiffness: 380, damping: 36, mass: 0.6 }
        : { type: 'spring', stiffness: 340, damping: 30, mass: 0.65 },
      fade: {
        duration: lowPower ? 0.16 : 0.22,
        ease: [0.22, 1, 0.36, 1],
      },
      slide: {
        duration: lowPower ? 0.22 : 0.28,
        ease: [0.22, 1, 0.36, 1],
      },
    }
  }, [reduced, isNarrow])
}

/** Promote an element to its own compositor layer (transform/opacity only). */
export const GPU_LAYER: CSSProperties = {
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
}
