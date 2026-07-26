import { useMemo, type CSSProperties } from 'react'
import { useMediaQuery } from './useMediaQuery'
import { useReducedMotion } from './useReducedMotion'

type Tween = {
  type: 'tween'
  duration: number
  ease: [number, number, number, number]
}

type Spring = {
  type: 'spring'
  stiffness: number
  damping: number
  mass: number
}

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
  /** Soft settle for panels / QR / wallets */
  spring: Spring | Tween
  /** Snappy UI feedback (buttons, logos) */
  springSnappy: Spring | Tween
  /** Opacity / short fades */
  fade: Tween
  /** Tab / panel slide */
  slide: Tween
  /**
   * Inline style to promote an element to its own compositor layer.
   * Empty on mobile — over-compositing exhausts GPU memory on phones.
   */
  gpuLayer: CSSProperties
}

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

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
    if (isNarrow) return true
  }
  if (isNarrow) return true
  return false
}

/** Promote an element to its own compositor layer (transform/opacity only). */
export const GPU_LAYER: CSSProperties = {
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
}

/**
 * Device-aware motion tuning so animations stay at ~60fps on phones
 * and feel premium on desktop without changing the visual language.
 *
 * Mobile uses short tweens (fixed frame budget) instead of springs
 * (open-ended physics) — same motion path, far less main-thread work.
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
      spring: lowPower
        ? { type: 'tween', duration: 0.28, ease: EASE_OUT }
        : { type: 'spring', stiffness: 260, damping: 28, mass: 0.75 },
      springSnappy: lowPower
        ? { type: 'tween', duration: 0.2, ease: EASE_OUT }
        : { type: 'spring', stiffness: 340, damping: 30, mass: 0.65 },
      fade: {
        type: 'tween',
        duration: lowPower ? 0.14 : 0.22,
        ease: EASE_OUT,
      },
      slide: {
        type: 'tween',
        duration: lowPower ? 0.2 : 0.28,
        ease: EASE_OUT,
      },
      gpuLayer: lowPower ? {} : GPU_LAYER,
    }
  }, [reduced, isNarrow])
}
