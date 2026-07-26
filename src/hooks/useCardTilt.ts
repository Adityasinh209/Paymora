import { useRef, useEffect, useCallback } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'
import { useMediaQuery } from './useMediaQuery'
import { useReducedMotion } from './useReducedMotion'

interface TiltOptions {
  disabled?: boolean
}

export function useCardTilt({ disabled = false }: TiltOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')

  const maxTilt = disabled || reduced || isMobile ? 0 : isTablet ? 6 : 12

  const rawRotateX = useMotionValue(0)
  const rawRotateY = useMotionValue(0)
  const shineX = useMotionValue(50)
  const shineY = useMotionValue(50)

  // Soft spring — avoids overshoot on high-refresh displays
  const springConfig = { stiffness: 220, damping: 28, mass: 0.6 }
  const rotateX = useSpring(rawRotateX, springConfig)
  const rotateY = useSpring(rawRotateY, springConfig)

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (maxTilt === 0 || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)

      rawRotateY.set(dx * maxTilt)
      rawRotateX.set(-dy * maxTilt)

      shineX.set(((e.clientX - rect.left) / rect.width) * 100)
      shineY.set(((e.clientY - rect.top) / rect.height) * 100)
    },
    [maxTilt, rawRotateX, rawRotateY, shineX, shineY],
  )

  const handleMouseLeave = useCallback(() => {
    rawRotateX.set(0)
    rawRotateY.set(0)
    shineX.set(50)
    shineY.set(50)
  }, [rawRotateX, rawRotateY, shineX, shineY])

  useEffect(() => {
    const el = containerRef.current
    if (!el || maxTilt === 0) return

    el.addEventListener('mousemove', handleMouseMove, { passive: true })
    el.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [maxTilt, handleMouseMove, handleMouseLeave])

  return { containerRef, rotateX, rotateY, shineX, shineY }
}
