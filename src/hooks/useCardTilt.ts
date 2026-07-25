import { useRef, useEffect, useCallback } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'

interface TiltOptions {
  disabled?: boolean
}

export function useCardTilt({ disabled = false }: TiltOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const isMobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  const isTablet =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches

  const maxTilt = disabled || isMobile ? 0 : isTablet ? 8 : 15

  const rawRotateX = useMotionValue(0)
  const rawRotateY = useMotionValue(0)
  const shineX = useMotionValue(50)
  const shineY = useMotionValue(50)

  const springConfig = { stiffness: 300, damping: 30, mass: 0.5 }
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

      // Shine position as percentage
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

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [maxTilt, handleMouseMove, handleMouseLeave])

  return { containerRef, rotateX, rotateY, shineX, shineY }
}
