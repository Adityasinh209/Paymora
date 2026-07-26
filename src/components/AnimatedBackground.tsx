import { memo, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { useMotionProfile } from '../hooks/useMotionProfile'
import { useReducedMotion } from '../hooks/useReducedMotion'

type CardSkin = {
  brand: string
  gradient: string
}

const CARD_SKINS: CardSkin[] = [
  { brand: 'VISA', gradient: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 55%, #1565C0 100%)' },
  { brand: 'MC', gradient: 'linear-gradient(145deg, #1c1c1e 0%, #2d2d2d 50%, #111 100%)' },
  { brand: 'AMEX', gradient: 'linear-gradient(145deg, #006FCF 0%, #004A9A 70%, #003580 100%)' },
  { brand: 'RuPay', gradient: 'linear-gradient(140deg, #083D0E 0%, #1B5E20 55%, #0D3B10 100%)' },
  { brand: 'DISC', gradient: 'linear-gradient(140deg, #212121 0%, #2a1800 70%, #1c1100 100%)' },
  { brand: 'PAYMORA', gradient: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)' },
  { brand: 'MAESTRO', gradient: 'linear-gradient(145deg, #0D1B5E 0%, #1A237E 50%, #283593 100%)' },
]

type RandomCard = {
  id: number
  skin: CardSkin
  style: CSSProperties
  opacity: number
  scale: number
  baseRotate: number
  duration: number
  delay: number
  x: number[]
  y: number[]
  rotate: number[]
  last4: string
}

function seededRandom(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function buildRandomCards(count = 8): RandomCard[] {
  // Fresh layout each page load
  const rand = seededRandom(Math.floor(Math.random() * 1_000_000) + Date.now() % 10000)

  // Keep cards away from the center checkout area
  const zones: Array<{ top?: string; bottom?: string; left?: string; right?: string }> = [
    { top: `${4 + rand() * 10}%`, left: `${-4 + rand() * 10}%` },
    { top: `${3 + rand() * 12}%`, right: `${-3 + rand() * 10}%` },
    { top: `${35 + rand() * 18}%`, left: `${-6 + rand() * 8}%` },
    { top: `${32 + rand() * 20}%`, right: `${-6 + rand() * 8}%` },
    { bottom: `${4 + rand() * 14}%`, left: `${2 + rand() * 12}%` },
    { bottom: `${3 + rand() * 12}%`, right: `${1 + rand() * 12}%` },
    { top: `${18 + rand() * 10}%`, left: `${8 + rand() * 8}%` },
    { bottom: `${18 + rand() * 12}%`, right: `${8 + rand() * 10}%` },
  ]

  return Array.from({ length: count }, (_, i) => {
    const skin = CARD_SKINS[Math.floor(rand() * CARD_SKINS.length)]
    const baseRotate = -22 + rand() * 44
    const scale = 0.72 + rand() * 0.28
    const opacity = 0.1 // 10% visibility
    const duration = 16 + rand() * 14
    const delay = rand() * 3
    const ampX = 8 + rand() * 16
    const ampY = 6 + rand() * 14
    const ampR = 1.5 + rand() * 3.5
    const last4 = String(1000 + Math.floor(rand() * 9000))

    return {
      id: i,
      skin,
      style: zones[i % zones.length],
      opacity,
      scale,
      baseRotate,
      duration,
      delay,
      x: [0, ampX, -ampX * 0.7, ampX * 0.5, 0],
      y: [0, -ampY, ampY * 0.8, -ampY * 0.4, 0],
      rotate: [
        baseRotate,
        baseRotate + ampR,
        baseRotate - ampR,
        baseRotate + ampR * 0.5,
        baseRotate,
      ],
      last4,
    }
  })
}

function BgCard({
  card,
  prefersReduced,
  hideOnMobile = false,
}: {
  card: RandomCard
  prefersReduced: boolean
  hideOnMobile?: boolean
}) {
  return (
    <motion.div
      className={['absolute select-none gpu-layer', hideOnMobile ? 'hidden sm:block' : ''].join(' ')}
      style={{
        width: 'min(210px, 42vw)',
        aspectRatio: '1.586 / 1',
        borderRadius: 14,
        background: card.skin.gradient,
        opacity: card.opacity,
        scale: card.scale,
        rotate: card.baseRotate,
        boxShadow:
          '0 2px 0 rgba(255,255,255,0.16) inset, 0 -1px 0 rgba(0,0,0,0.12) inset, 0 18px 40px rgba(15,23,42,0.14)',
        transform: 'translateZ(0)',
        willChange: prefersReduced ? 'auto' : 'transform',
        ...card.style,
      }}
      initial={false}
      animate={
        prefersReduced
          ? {}
          : {
              x: card.x,
              y: card.y,
              rotate: card.rotate,
              transition: {
                duration: card.duration * 1.15,
                delay: card.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
      }
    >
      <div
        className="absolute inset-0 rounded-[14px] pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 42%, rgba(255,255,255,0.05) 100%)',
        }}
      />
      <div
        className="absolute"
        style={{
          top: 16,
          left: 16,
          width: 26,
          height: 18,
          borderRadius: 4,
          background: 'linear-gradient(145deg, #e8c96a 0%, #c9a227 40%, #f5e6a8 55%, #b8922a 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.25)',
        }}
      />
      <div
        className="absolute"
        style={{
          top: 14,
          right: 14,
          color: 'rgba(255,255,255,0.9)',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.08em',
        }}
      >
        {card.skin.brand}
      </div>
      <div
        className="absolute font-mono"
        style={{
          left: 16,
          top: '48%',
          color: 'rgba(255,255,255,0.85)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textShadow: '0 1px 2px rgba(0,0,0,0.35)',
        }}
      >
        ••••  ••••  ••••  {card.last4}
      </div>
      <div
        className="absolute flex items-end justify-between"
        style={{ left: 16, right: 14, bottom: 12 }}
      >
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 6.5, letterSpacing: '0.12em', fontWeight: 600 }}>
            CARD HOLDER
          </div>
          <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>
            PAYMORA
          </div>
        </div>
        <div className="text-right">
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 6.5, letterSpacing: '0.12em', fontWeight: 600 }}>
            EXP
          </div>
          <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}>
            12/30
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export const AnimatedBackground = memo(function AnimatedBackground() {
  const prefersReduced = useReducedMotion()
  const { enableBgMotion, lowPower } = useMotionProfile()
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  )
  const cards = useMemo(() => buildRandomCards(lowPower ? 4 : 8), [lowPower])
  const animateCards = enableBgMotion && pageVisible && !prefersReduced

  useEffect(() => {
    const onVis = () => setPageVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg, #e8eef8 0%, #f4f7fb 40%, #e9eef8 70%, #dde7f5 100%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(255,255,255,0.75) 0%, transparent 70%)',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {cards.map((card) => (
        <BgCard
          key={card.id}
          card={card}
          prefersReduced={!animateCards}
          hideOnMobile={card.id >= 3}
        />
      ))}

      {/* Keep the checkout center readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 70% at 50% 48%, rgba(244,247,251,0.62) 0%, rgba(244,247,251,0.22) 45%, transparent 72%)',
        }}
      />

      <div
        className="absolute inset-x-0 top-0 h-36"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, transparent 100%)',
        }}
      />
    </div>
  )
})
