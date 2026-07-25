import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CardPreview } from './CardPreview'
import { CardNumberInput } from './CardNumberInput'
import { ExpiryInput } from './ExpiryInput'
import { CardHolderInput } from './CardHolderInput'
import { CVVInput } from './CVVInput'
import { SmallBrandBadge } from './CardBrandLogo'
import { UPI_LOGOS, WALLET_LOGOS } from './PaymentLogos'
import { useCardBrand } from '../hooks/useCardBrand'
import { useCardValidation } from '../hooks/useCardValidation'
import { useCardFunding } from '../hooks/useCardFunding'
import { fundingLabel } from '../utils/cardFunding'
import { playPayChime, unlockPayAudio } from '../utils/playPayChime'

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="3" y="6" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

type CheckoutPhase = 'form' | 'processing' | 'finalizing' | 'success'
type PaymentMethod = 'card' | 'upi' | 'wallet'

const METHOD_ORDER: Record<PaymentMethod, number> = { card: 0, upi: 1, wallet: 2 }

const UPI_APPS = [
  { id: 'gpay', name: 'GPay', handle: '@okicici' },
  { id: 'phonepe', name: 'PhonePe', handle: '@ybl' },
  { id: 'paytm', name: 'Paytm', handle: '@paytm' },
  { id: 'bhim', name: 'BHIM', handle: '@upi' },
  { id: 'amazon', name: 'Amazon', handle: '@apl' },
  { id: 'cred', name: 'CRED', handle: '@cred' },
]

const WALLETS = [
  { id: 'paytm', name: 'Paytm', color: '#00B9F1' },
  { id: 'phonepe', name: 'PhonePe', color: '#5F259F' },
  { id: 'amazon', name: 'Amazon Pay', color: '#E47911' },
  { id: 'mobikwik', name: 'MobiKwik', color: '#1A3CFF' },
  { id: 'freecharge', name: 'Freecharge', color: '#FF3B3B' },
  { id: 'jio', name: 'JioMoney', color: '#0A2885' },
]

/** Decorative QR-code-like SVG used in the UPI left panel and QR reveal card */
function UpiQrSvg({ dark = false, size = 80 }: { dark?: boolean; size?: number }) {
  const cells = [
    [1,1,0,1,0,1,1,0],
    [1,0,1,1,0,0,0,1],
    [0,1,1,0,1,1,0,1],
    [1,1,0,0,1,0,1,0],
    [0,0,1,1,0,1,1,1],
    [1,0,0,1,1,0,0,1],
    [1,1,0,0,1,1,0,1],
    [0,1,1,1,0,0,1,1],
  ]
  const S = 8, G = 1.5
  const stroke = dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.8)'
  const fillStrong = dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.8)'
  const fillSoft = dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const badgeFill = dark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.25)'
  const badgeStroke = dark ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.25)'
  const badgeText = dark ? 'rgba(67,56,202,0.9)' : 'rgba(255,255,255,0.9)'
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      {/* Top-left finder */}
      <rect x="2" y="2" width="22" height="22" rx="3" fill="none" stroke={stroke} strokeWidth="2.2"/>
      <rect x="7" y="7" width="12" height="12" rx="1.5" fill={fillStrong}/>
      {/* Top-right finder */}
      <rect x="56" y="2" width="22" height="22" rx="3" fill="none" stroke={stroke} strokeWidth="2.2"/>
      <rect x="61" y="7" width="12" height="12" rx="1.5" fill={fillStrong}/>
      {/* Bottom-left finder */}
      <rect x="2" y="56" width="22" height="22" rx="3" fill="none" stroke={stroke} strokeWidth="2.2"/>
      <rect x="7" y="61" width="12" height="12" rx="1.5" fill={fillStrong}/>
      {/* Data cells */}
      {cells.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={28 + c * (S + G)}
              y={28 + r * (S + G)}
              width={S} height={S} rx="1.2"
              fill={fillSoft}
            />
          ) : null
        )
      )}
      {/* Centre "UPI" badge */}
      <rect x="28" y="28" width="24" height="24" rx="4" fill={badgeFill} stroke={badgeStroke} strokeWidth="1"/>
      <text x="40" y="44" textAnchor="middle" fontSize="8" fontWeight="800" fill={badgeText} letterSpacing="0.5">UPI</text>
    </svg>
  )
}

/** Brand accent colors used purely for the launch-animation glow/motion — not real app assets */
const APP_ACCENTS: Record<string, string> = {
  gpay: '#4285F4',
  phonepe: '#5F259F',
  paytm: '#00BAF2',
  bhim: '#16A34A',
  amazon: '#FF9900',
  cred: '#C9A227',
}

/** Small QR card that "emerges" from behind the main UPI illustration once revealed */
function UpiAppQrCard({ appId }: { appId: string }) {
  const app = UPI_APPS.find(a => a.id === appId)
  const Logo = UPI_LOGOS[appId]
  const accent = APP_ACCENTS[appId] ?? '#6366F1'
  return (
    <div
      className="relative overflow-hidden select-none flex flex-col items-center gap-2.5 p-3.5"
      style={{
        width: '100%',
        aspectRatio: '0.86 / 1',
        borderRadius: 16,
        background: 'linear-gradient(165deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: [
          `0 0 0 1.5px ${accent}55`,
          '0 30px 55px -12px rgba(2,6,23,0.55)',
          '0 10px 22px -6px rgba(2,6,23,0.35)',
          '0 1px 0 rgba(255,255,255,0.8) inset',
        ].join(', '),
        border: '1px solid rgba(226,232,240,0.9)',
      }}
      aria-label={`${app?.name ?? 'UPI'} QR code`}
    >
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-200 flex-shrink-0">
          {Logo ? <Logo size={20} /> : null}
        </div>
        <span className="text-[10.5px] font-bold text-slate-700 tracking-tight">{app?.name}</span>
      </div>
      <div className="p-2 rounded-lg bg-white border border-slate-100" style={{ boxShadow: `0 0 0 1px ${accent}22` }}>
        <UpiQrSvg dark size={64} />
      </div>
      <span className="text-[8.5px] font-bold text-slate-400 tracking-[0.14em] uppercase">Scan to Pay</span>
      <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    </div>
  )
}

/**
 * Native-app launch animation, inspired by (not copied from) each app's real
 * startup motion: colour, ring style and micro-gesture differ per app while
 * sharing the same premium bloom-and-settle choreography. The logo sits
 * centre-top; the remaining app icons line up in a strip just beneath it.
 */
function AppLaunchOverlay({ appId }: { appId: string }) {
  const app = UPI_APPS.find(a => a.id === appId)
  const Logo = UPI_LOGOS[appId]
  const accent = APP_ACCENTS[appId] ?? '#6366F1'

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30"
      style={{ paddingBottom: 30 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 38%, ${accent}1a 0%, transparent 65%)` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Opening label — takes the place of the faded "Pay via app" heading */}
      <motion.span
        className="absolute top-0 left-0 text-[11px] font-bold uppercase tracking-[0.14em]"
        style={{ color: accent }}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.12, duration: 0.25 }}
      >
        Opening {app?.name}…
      </motion.span>

      {/* Logo + rings block */}
      <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
        {/* Default ripple rings (PhonePe / Paytm-style soft pulse) */}
        {(appId === 'phonepe' || appId === 'paytm') &&
          [0, 1].map(i => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2"
              style={{ borderColor: accent, width: 58, height: 58, left: 11, top: 11 }}
              initial={{ opacity: 0.55, scale: 0.6 }}
              animate={{ opacity: 0, scale: 2.2 }}
              transition={{ duration: 1, delay: i * 0.22, ease: 'easeOut' }}
            />
          ))}

        {/* GPay: rotating four-colour ring, like dots resolving into the mark */}
        {appId === 'gpay' && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 76,
              height: 76,
              left: 2,
              top: 2,
              background: 'conic-gradient(from 0deg, #4285F4, #EA4335, #FBBC05, #34A853, #4285F4)',
              maskImage: 'radial-gradient(circle, transparent 58%, black 60%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 58%, black 60%)',
            }}
            initial={{ rotate: 0, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 300, opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        )}

        {/* BHIM: tricolor sweep settling into place */}
        {appId === 'bhim' && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 76,
              height: 76,
              left: 2,
              top: 2,
              background: 'conic-gradient(from -90deg, #FF9933 0%, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%, #138808 100%)',
              maskImage: 'radial-gradient(circle, transparent 58%, black 60%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 58%, black 60%)',
            }}
            initial={{ rotate: -70, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        )}

        {/* Logo pop: shared bounce-settle used by every app */}
        <motion.div
          className="relative rounded-2xl overflow-hidden flex items-center justify-center bg-white"
          style={{ width: 56, height: 56, boxShadow: `0 10px 28px ${accent}55` }}
          initial={{ scale: 0.3, opacity: 0, rotate: -6 }}
          animate={{ scale: [0.3, 1.18, 1], opacity: 1, rotate: 0 }}
          exit={{ scale: 0.7, opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.55, times: [0, 0.6, 1], ease: [0.34, 1.56, 0.64, 1] }}
        >
          {Logo ? <Logo size={56} /> : null}

          {/* CRED: gold shimmer sweep across the mark */}
          {appId === 'cred' && (
            <motion.div
              className="absolute inset-0"
              style={{ background: `linear-gradient(115deg, transparent 30%, ${accent}88 50%, transparent 70%)` }}
              initial={{ x: '-130%' }}
              animate={{ x: '130%' }}
              transition={{ duration: 0.7, delay: 0.18, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      </div>

      {/* Amazon: signature smile arc drawing in beneath the mark */}
      {appId === 'amazon' && (
        <svg width="40" height="16" viewBox="0 0 46 20" className="-mt-1" style={{ overflow: 'visible' }} aria-hidden="true">
          <motion.path
            d="M3 4 C 14 18, 32 18, 43 4"
            fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.26, ease: 'easeOut' }}
          />
          <motion.path
            d="M38 2 L44 4 L40 9" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.68, duration: 0.2 }}
          />
        </svg>
      )}
    </motion.div>
  )
}

/** Left-panel illustration shown when UPI tab is active */
function UpiIllustration() {
  return (
    <div
      className="relative w-full max-w-[420px] mx-auto overflow-hidden select-none"
      style={{
        aspectRatio: '1.586 / 1',
        borderRadius: 18,
        background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)',
        boxShadow: '0 2px 0 rgba(255,255,255,0.1) inset, 0 -1px 0 rgba(0,0,0,0.2) inset, 0 40px 80px rgba(0,0,0,0.3)',
      }}
      aria-label="UPI payment illustration"
    >
      <div className="absolute" style={{ top: '-30%', right: '-5%', width: '70%', height: '130%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }}/>
      <div className="absolute" style={{ bottom: '-20%', left: '-10%', width: '50%', height: '80%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)' }}/>
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}/>

      <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="overflow-hidden border border-white/20 shadow-sm" style={{ width: 32, height: 32 }}>
              {(() => { const Logo = UPI_LOGOS.bhim; return <Logo size={32} /> })()}
            </div>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em' }}>BHIM UPI</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', padding: '3px 10px' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 800, letterSpacing: '0.15em' }}>🇮🇳 INDIA</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
            <UpiQrSvg />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <div>
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>Scan &amp; Pay</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 3 }}>Any UPI app · Instant transfer</p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {UPI_APPS.map(app => {
                const Logo = UPI_LOGOS[app.id]
                return (
                  <div key={app.id} className="overflow-hidden border border-white/15 shadow-sm" style={{ width: 26, height: 26 }} title={app.name}>
                    {Logo ? <Logo size={26} /> : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Instant · Zero Fee · Secure</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', padding: '2px 8px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}/>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 600 }}>Live</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Left-panel illustration shown when Wallet tab is active */
function WalletIllustration({ selectedId }: { selectedId?: string | null }) {
  const stack = ['phonepe', 'paytm', 'amazon'] as const
  return (
    <div
      className="relative w-full max-w-[420px] mx-auto overflow-hidden select-none"
      style={{
        aspectRatio: '1.586 / 1',
        borderRadius: 18,
        background: 'linear-gradient(145deg, #0a0a14 0%, #141420 55%, #1c1c30 100%)',
        boxShadow: '0 2px 0 rgba(255,255,255,0.1) inset, 0 40px 80px rgba(0,0,0,0.3)',
      }}
      aria-label="Wallet payment illustration"
    >
      <div className="absolute" style={{ top: '20%', right: '-15%', width: '65%', height: '80%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,153,0,0.1) 0%, transparent 70%)' }}/>
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}/>

      <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em' }}>Digital Wallets</span>
          <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', padding: '3px 10px' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>6 WALLETS</span>
          </div>
        </div>

        <div className="relative flex items-center justify-center" style={{ height: 90 }}>
          {stack.map((id, i) => {
            const w = WALLETS.find(x => x.id === id)!
            const Logo = WALLET_LOGOS[id]
            const active = selectedId === id
            return (
              <motion.div
                key={id}
                className="absolute overflow-hidden flex items-center gap-2 px-3.5"
                initial={false}
                animate={{
                  y: active ? -18 : (i - 1) * 10,
                  scale: active ? 1.06 : 1,
                  rotate: active ? 0 : (i - 1) * 4,
                  zIndex: active ? 10 : i + 1,
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                style={{
                  width: '62%',
                  aspectRatio: '3 / 1.7',
                  background: `linear-gradient(135deg, ${w.color} 0%, ${w.color}CC 100%)`,
                  boxShadow: `0 6px 20px ${w.color}44`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-31%',
                  marginTop: '-28px',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <div className="overflow-hidden flex-shrink-0" style={{ width: 24, height: 24, border: '1px solid rgba(255,255,255,0.25)' }}>
                  {Logo ? <Logo size={24} /> : null}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 11, fontWeight: 700 }}>{w.name}</span>
              </motion.div>
            )
          })}
        </div>

        <div className="flex items-center justify-between">
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Instant Balance · Cashback</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', padding: '2px 8px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}/>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 600 }}>Linked</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CheckoutForm() {
  const [cvvFocused, setCvvFocused] = useState(false)
  const [phase, setPhase] = useState<CheckoutPhase>('form')
  const [rawCardDigits, setRawCardDigits] = useState('')
  const [cardCentered, setCardCentered] = useState(false)
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const finalizingTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const centerTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Unlock Web Audio on first interaction (required after deploy / HTTPS)
  useEffect(() => {
    const unlock = () => unlockPayAudio()
    window.addEventListener('pointerdown', unlock, { once: true, passive: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // ── Payment method state ───────────────────────────────────────
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('card')
  const tabDirectionRef = useRef<number>(1)

  // UPI state
  const [upiId, setUpiId] = useState('')
  const [upiIdTouched, setUpiIdTouched] = useState(false)
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null)
  const [qrRevealed, setQrRevealed] = useState(false)
  const [launchingApp, setLaunchingApp] = useState<string | null>(null)
  const launchTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Select (or deselect) a UPI app; plays a brief native-style launch animation on select
  const selectUpiApp = useCallback((appId: string) => {
    setQrRevealed(false)
    setSelectedUpiApp((prev) => {
      const isDeselect = prev === appId
      if (isDeselect) return null

      setUpiId((prevId) => (prevId.includes('@') ? prevId : `name${UPI_APPS.find(a => a.id === appId)?.handle ?? ''}`))
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current)
      setLaunchingApp(appId)
      launchTimeoutRef.current = setTimeout(() => setLaunchingApp(null), 1000)
      return appId
    })
  }, [])

  useEffect(() => {
    return () => {
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current)
    }
  }, [])

  // Wallet state
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [walletMobile, setWalletMobile] = useState('')
  const [walletMobileTouched, setWalletMobileTouched] = useState(false)

  const switchMethod = useCallback((next: PaymentMethod) => {
    setActiveMethod((prev) => {
      tabDirectionRef.current = METHOD_ORDER[next] >= METHOD_ORDER[prev] ? 1 : -1
      return next
    })
    if (next !== 'upi') {
      setQrRevealed(false)
      setLaunchingApp(null)
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current)
    }
  }, [])

  // Derived UPI validation
  const upiIdError = upiIdTouched
    ? !upiId.trim()
      ? 'UPI ID is required'
      : !upiId.includes('@') || upiId.split('@').length !== 2
      ? 'Enter a valid UPI ID (e.g. name@upi)'
      : upiId.split('@')[0].length < 3
      ? 'Username must be at least 3 characters'
      : ''
    : ''

  // Derived wallet validation
  const walletMobileDigits = walletMobile.replace(/\D/g, '')
  const walletMobileError = walletMobileTouched
    ? !walletMobileDigits
      ? 'Mobile number is required'
      : walletMobileDigits.length !== 10
      ? 'Enter a valid 10-digit number'
      : ''
    : ''

  // Brand detection from raw digits — triggers on every keystroke
  const brand = useCardBrand(rawCardDigits)

  // Credit / debit / prepaid detection (local BIN + live lookup)
  const fundingInfo = useCardFunding(rawCardDigits, brand.id)

  // Validation hook keyed to the current brand
  const { fields, updateField, touchField, isFormValid, resetFields } = useCardValidation(brand)

  // Sync accent CSS variable on brand change
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-hue', String(brand.accentHue))
  }, [brand.accentHue])

  // Truncate CVV when brand changes cvvLength (e.g. Amex→Visa: 4→3 digits)
  useEffect(() => {
    const currentCvv = fields.cvv.value
    if (currentCvv.length > brand.cvvLength) {
      updateField('cvv', currentCvv.slice(0, brand.cvvLength))
    }
  }, [brand.cvvLength, fields.cvv.value, updateField])

  // ── Field handlers ────────────────────────────────────────────
  const handleCardNumberChange = useCallback(
    (raw: string) => {
      setRawCardDigits(raw)
      updateField('cardNumber', raw)
    },
    [updateField],
  )

  const handleExpiryChange = useCallback(
    (raw: string) => updateField('expiry', raw),
    [updateField],
  )

  const handleCardHolderChange = useCallback(
    (value: string) => updateField('cardHolder', value),
    [updateField],
  )

  const handleCVVChange = useCallback(
    (value: string) => updateField('cvv', value),
    [updateField],
  )

  const handleCVVFocus = useCallback(() => setCvvFocused(true), [])

  const handleCVVBlur = useCallback(() => {
    setCvvFocused(false)
    touchField('cvv')
  }, [touchField])

  // ── Submission ────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (activeMethod === 'card') {
        ;(['cardNumber', 'expiry', 'cardHolder', 'cvv'] as const).forEach(touchField)
        if (!isFormValid()) return
      } else if (activeMethod === 'upi') {
        setUpiIdTouched(true)
        const err = !upiId.trim()
          ? 'required'
          : !upiId.includes('@') || upiId.split('@').length !== 2
          ? 'invalid'
          : upiId.split('@')[0].length < 3
          ? 'too short'
          : ''
        if (err) return
      } else {
        if (!selectedWallet) return
        setWalletMobileTouched(true)
        const d = walletMobile.replace(/\D/g, '')
        if (!d || d.length !== 10) return
      }

      unlockPayAudio()
      void playPayChime()
      setPhase('processing')
      centerTimeoutRef.current = setTimeout(() => setCardCentered(true), 90)
      finalizingTimeoutRef.current = setTimeout(() => setPhase('finalizing'), 2200)
      submitTimeoutRef.current = setTimeout(() => setPhase('success'), 3600)
    },
    [activeMethod, touchField, isFormValid, upiId, selectedWallet, walletMobile],
  )

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current)
      if (finalizingTimeoutRef.current) clearTimeout(finalizingTimeoutRef.current)
      if (centerTimeoutRef.current) clearTimeout(centerTimeoutRef.current)
    }
  }, [])

  // Reset checkout and return to the home/form view
  const handleGoHome = useCallback(() => {
    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current)
    if (finalizingTimeoutRef.current) clearTimeout(finalizingTimeoutRef.current)
    if (centerTimeoutRef.current) clearTimeout(centerTimeoutRef.current)
    setPhase('form')
    setCardCentered(false)
    setCvvFocused(false)
    setRawCardDigits('')
    setActiveMethod('card')
    setUpiId('')
    setUpiIdTouched(false)
    setSelectedUpiApp(null)
    setSelectedWallet(null)
    setWalletMobile('')
    setWalletMobileTouched(false)
    resetFields()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [resetFields])

  const formIsValid = isFormValid()
  const isCentered = cardCentered
  const isProcessing = phase === 'processing' || phase === 'finalizing'
  const isCardNumberComplete = brand.id !== 'unknown' && brand.lengths.includes(rawCardDigits.length)

  const canSubmit =
    activeMethod === 'card' ? formIsValid :
    activeMethod === 'upi'  ? upiId.includes('@') && upiId.split('@')[0].length >= 3 :
    Boolean(selectedWallet) && walletMobileDigits.length === 10

  const submitLabel =
    activeMethod === 'card'   ? 'Pay Securely' :
    activeMethod === 'upi'    ? 'Send UPI Request' :
    selectedWallet ? `Pay via ${WALLETS.find(w => w.id === selectedWallet)?.name ?? 'Wallet'}` : 'Select a Wallet'

  return (
    <div className="w-full max-w-[960px] mx-auto px-4 sm:px-0">
      <div
        className={[
          'relative flex gap-8 lg:gap-12',
          isCentered
            ? 'flex-col items-center justify-center min-h-[280px]'
            : 'flex-col lg:flex-row lg:items-center',
        ].join(' ')}
      >
        {/* ── Left Panel (Card / UPI / Wallet illustration) ─── */}
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 180, damping: 24, mass: 0.9 }}
          className={
            isCentered
              ? 'w-full max-w-[420px]'
              : 'w-full lg:w-[420px] lg:flex-shrink-0 lg:sticky lg:top-8'
          }
        >
          <div className="relative">
            {/* Same tricolor → green glow for Card, UPI, and Wallet */}
            <AnimatePresence>
              {isProcessing && (
                <TricolorGlow key="glow" finalizing={phase === 'finalizing'} />
              )}
            </AnimatePresence>

            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {activeMethod === 'card' ? (
                  <motion.div
                    key="left-card"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <CardPreview
                      cardNumber={fields.cardNumber.value}
                      cardHolder={fields.cardHolder.value}
                      expiry={fields.expiry.value}
                      cvv={fields.cvv.value}
                      isFlipped={cvvFocused}
                      brand={brand}
                      funding={fundingInfo.funding}
                      bank={fundingInfo.bank}
                      isNumberComplete={isCardNumberComplete}
                    />
                  </motion.div>
                ) : activeMethod === 'upi' ? (
                  <motion.div
                    key="left-upi"
                    initial={{ opacity: 0, x: 30, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -30, scale: 0.97 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-[420px] mx-auto overflow-visible"
                    style={{ paddingBottom: selectedUpiApp ? 28 : 0 }}
                  >
                    {/* Main UPI card — slides left to clear the top-right for the QR */}
                    <motion.div
                      className="relative z-10"
                      initial={false}
                      animate={{
                        x: qrRevealed ? -40 : 0,
                        scale: qrRevealed ? 0.9 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.8 }}
                      style={{ transformOrigin: 'left center', willChange: 'transform' }}
                    >
                      <UpiIllustration />
                    </motion.div>

                    {/* QR card — peels out from behind the main card's top-right corner,
                        stays inside the left panel so it never hits the form */}
                    <AnimatePresence initial={false}>
                      {selectedUpiApp && qrRevealed && (
                        <motion.div
                          key="qr-card"
                          className="absolute z-[15] pointer-events-none"
                          style={{
                            top: '-10%',
                            right: '2%',
                            width: '40%',
                            maxWidth: 168,
                          }}
                          initial={{
                            opacity: 0,
                            scale: 0.45,
                            x: -56,
                            y: 42,
                            rotate: 12,
                            filter: 'blur(14px)',
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            y: 0,
                            rotate: 4,
                            filter: 'blur(0px)',
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.45,
                            x: -48,
                            y: 36,
                            rotate: 12,
                            filter: 'blur(12px)',
                            transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] },
                          }}
                          transition={{ type: 'spring', stiffness: 280, damping: 24, mass: 0.7 }}
                        >
                          <div className="pointer-events-auto">
                            <UpiAppQrCard appId={selectedUpiApp} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Show / hide QR — appears once an app is chosen */}
                    <AnimatePresence>
                      {selectedUpiApp && (
                        <motion.button
                          key="qr-toggle"
                          type="button"
                          onClick={() => setQrRevealed(v => !v)}
                          className="absolute z-20 flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full text-[11px] font-bold text-slate-800"
                          style={{
                            bottom: 0,
                            left: 8,
                            background: '#fff',
                            boxShadow: '0 8px 20px rgba(15,23,42,0.18), 0 0 0 1px rgba(226,232,240,0.9)',
                          }}
                          initial={{ opacity: 0, y: 8, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.9 }}
                          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                          whileTap={{ scale: 0.94 }}
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                            <UpiQrSvg size={13} />
                          </span>
                          {qrRevealed ? 'Hide QR' : 'Show QR'}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key="left-wallet"
                    initial={{ opacity: 0, x: 30, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -30, scale: 0.97 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <WalletIllustration selectedId={selectedWallet} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── Form Panel ─────────────────────────────────────
            popLayout pulls the exiting form out of flow so the
            card can center without the form jumping underneath. */}
      <AnimatePresence mode="popLayout">
        {phase === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{
              opacity: 0,
              x: 56,
              y: 8,
              scale: 0.96,
              filter: 'blur(8px)',
              transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] },
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full lg:flex-1 min-w-0"
            style={{ willChange: 'opacity, transform, filter' }}
          >
            <form
              onSubmit={handleSubmit}
              noValidate
              className="glass-strong rounded-2xl p-6 sm:p-8 flex flex-col gap-5"
            >
              {/* Title */}
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">
                    Payment Details
                  </h2>
                  <p className="text-[13px] text-slate-400 mt-0.5 font-medium">
                    All transactions are encrypted and secure
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[12px] font-semibold bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <LockIcon />
                  SSL Secured
                </div>
              </div>

              {/* ── Payment Method Tabs ────────────────────────────── */}
              <div className="flex bg-slate-50 rounded-xl p-1 gap-0.5 border border-slate-100">
                {(['card', 'upi', 'wallet'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMethod(m)}
                    className={[
                      'flex-1 py-2.5 rounded-lg text-[12.5px] font-semibold tracking-[0.12em] uppercase transition-all duration-200',
                      activeMethod === m
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                        : 'text-slate-400 hover:text-slate-600',
                    ].join(' ')}
                    aria-pressed={activeMethod === m}
                  >
                    {m === 'card' ? 'CARD' : m === 'upi' ? 'UPI' : 'WALLET'}
                  </button>
                ))}
              </div>

              {/* ── Tab Content ──────────────────────────────────────
                  Extra inset so focus glow rings aren't clipped by overflow. */}
              <div className="relative overflow-x-clip overflow-y-visible -mx-1 px-1 py-0.5">
                <AnimatePresence mode="wait" custom={tabDirectionRef.current}>
                  {activeMethod === 'card' && (
                    <motion.div
                      key="tab-card"
                      custom={tabDirectionRef.current}
                      variants={{ enter: (d: number) => ({ x: d * 40, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: d * -40, opacity: 0 }) }}
                      initial="enter" animate="center" exit="exit"
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="flex flex-col gap-4"
                    >
                      {/* Card Number */}
                      <div className="relative">
                        <CardNumberInput
                          value={fields.cardNumber.value}
                          brand={brand}
                          error={fields.cardNumber.error}
                          valid={fields.cardNumber.valid}
                          onChange={handleCardNumberChange}
                          onBlur={() => touchField('cardNumber')}
                        />
                        <SmallBrandBadge brandId={brand.id} />
                      </div>
                      {/* Credit/Debit badge */}
                      <AnimatePresence>
                        {fundingInfo.funding !== 'unknown' && rawCardDigits.length >= 6 && (
                          <motion.div key={fundingInfo.funding} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="-mt-2 flex items-center gap-2">
                            <span className={['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide', fundingInfo.funding === 'credit' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : fundingInfo.funding === 'debit' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'].join(' ')}>
                              <span className={['w-1.5 h-1.5 rounded-full', fundingInfo.funding === 'credit' ? 'bg-indigo-500' : fundingInfo.funding === 'debit' ? 'bg-emerald-500' : 'bg-amber-500'].join(' ')} />
                              {fundingLabel(fundingInfo.funding)} Card{fundingInfo.bank ? ` · ${fundingInfo.bank}` : ''}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* Expiry + CVV */}
                      <div className="grid grid-cols-2 gap-4">
                        <ExpiryInput value={fields.expiry.value} error={fields.expiry.error} valid={fields.expiry.valid} onChange={handleExpiryChange} onBlur={() => touchField('expiry')} />
                        <CVVInput value={fields.cvv.value} cvvLength={brand.cvvLength} error={fields.cvv.error} valid={fields.cvv.valid} onChange={handleCVVChange} onBlur={handleCVVBlur} onFocus={handleCVVFocus} />
                      </div>
                      {/* Cardholder */}
                      <CardHolderInput value={fields.cardHolder.value} error={fields.cardHolder.error} valid={fields.cardHolder.valid} onChange={handleCardHolderChange} onBlur={() => touchField('cardHolder')} />
                    </motion.div>
                  )}

                  {activeMethod === 'upi' && (
                    <motion.div
                      key="tab-upi"
                      custom={tabDirectionRef.current}
                      variants={{ enter: (d: number) => ({ x: d * 40, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: d * -40, opacity: 0 }) }}
                      initial="enter" animate="center" exit="exit"
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="flex flex-col gap-4"
                    >
                      {/* UPI App quick-select */}
                      <div className="relative" style={{ minHeight: 108 }}>
                        <motion.p
                          className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] mb-2"
                          animate={{ opacity: launchingApp ? 0 : 1 }}
                          transition={{ duration: 0.18 }}
                        >
                          Pay via app
                        </motion.p>
                        <div
                          className={launchingApp ? 'flex items-end justify-center gap-1.5' : 'grid grid-cols-3 gap-2'}
                          style={launchingApp ? { height: 108 } : undefined}
                        >
                          {UPI_APPS.map(app => {
                            const Logo = UPI_LOGOS[app.id]
                            const selected = selectedUpiApp === app.id
                            const isLaunching = launchingApp === app.id
                            return (
                              <motion.button
                                layout
                                key={app.id}
                                type="button"
                                onClick={() => selectUpiApp(app.id)}
                                disabled={!!launchingApp}
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                className={
                                  launchingApp
                                    ? 'flex items-center justify-center rounded-full border border-slate-100 overflow-hidden flex-shrink-0 bg-white'
                                    : [
                                        'flex items-center gap-2.5 px-3 py-2.5 rounded-none border transition-colors duration-150 text-left',
                                        selected
                                          ? 'border-indigo-300 bg-indigo-50'
                                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                                      ].join(' ')
                                }
                                style={
                                  launchingApp
                                    ? isLaunching
                                      ? // Selected app leaves the strip — it lives centre-stage in the overlay.
                                        // Width must stay non-zero or Framer's layout scale-correction breaks.
                                        { width: 10, height: 30, opacity: 0, borderWidth: 0, padding: 0 }
                                      : { width: 30, height: 30, opacity: 1 }
                                    : { opacity: 1 }
                                }
                              >
                                <motion.div
                                  layout
                                  className={launchingApp ? 'w-full h-full flex items-center justify-center' : 'w-7 h-7 rounded-none overflow-hidden flex-shrink-0 border border-slate-100'}
                                >
                                  {Logo ? <Logo size={launchingApp ? 30 : 28} /> : null}
                                </motion.div>
                                {!launchingApp && <span className="text-[11.5px] font-semibold text-slate-700 truncate">{app.name}</span>}
                              </motion.button>
                            )
                          })}
                        </div>
                        <AnimatePresence>
                          {launchingApp && <AppLaunchOverlay key={launchingApp} appId={launchingApp} />}
                        </AnimatePresence>
                      </div>

                      {/* UPI ID input */}
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">UPI ID</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={upiId}
                            onChange={e => { setUpiId(e.target.value); setSelectedUpiApp(null); setQrRevealed(false) }}
                            onBlur={() => setUpiIdTouched(true)}
                            placeholder={selectedUpiApp ? `yourname${UPI_APPS.find(a=>a.id===selectedUpiApp)?.handle}` : 'yourname@upi'}
                            className={[
                              'w-full px-4 py-3 rounded-xl border text-[14px] font-medium text-slate-800 outline-none transition-all duration-150 bg-white',
                              upiIdError
                                ? 'border-rose-300 bg-rose-50/40 focus:ring-2 focus:ring-rose-100'
                                : upiId.includes('@') && upiId.split('@')[0].length >= 3
                                ? 'border-emerald-300 bg-emerald-50/40 focus:ring-2 focus:ring-emerald-100'
                                : 'border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50',
                            ].join(' ')}
                            autoComplete="off"
                            spellCheck={false}
                            aria-label="UPI ID"
                          />
                          {upiId.includes('@') && upiId.split('@')[0].length >= 3 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          )}
                        </div>
                        {upiIdError ? (
                          <p className="mt-1.5 text-[11px] text-rose-500 font-medium">{upiIdError}</p>
                        ) : (
                          <p className="mt-1.5 text-[11px] text-slate-400">e.g. name@paytm, 9876543210@ybl</p>
                        )}
                      </div>

                      {/* Info strip */}
                      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#3B82F6" strokeWidth="1.4"/><line x1="6" y1="5.5" x2="6" y2="8.5" stroke="#3B82F6" strokeWidth="1.4" strokeLinecap="round"/><circle cx="6" cy="3.5" r="0.7" fill="#3B82F6"/></svg>
                        </div>
                        <p className="text-[11px] text-blue-600 font-medium leading-snug">A payment request will be sent to your UPI app. Open the app to approve.</p>
                      </div>
                    </motion.div>
                  )}

                  {activeMethod === 'wallet' && (
                    <motion.div
                      key="tab-wallet"
                      custom={tabDirectionRef.current}
                      variants={{ enter: (d: number) => ({ x: d * 40, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: d * -40, opacity: 0 }) }}
                      initial="enter" animate="center" exit="exit"
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="flex flex-col gap-4"
                    >
                      {/* Wallet grid */}
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] mb-2">Select wallet</p>
                        <div className="grid grid-cols-3 gap-2">
                          {WALLETS.map((w, i) => {
                            const Logo = WALLET_LOGOS[w.id]
                            const selected = selectedWallet === w.id
                            return (
                              <motion.button
                                key={w.id}
                                type="button"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  borderColor: selected ? w.color : 'rgb(226 232 240)',
                                  backgroundColor: selected ? `${w.color}12` : '#ffffff',
                                }}
                                transition={{
                                  opacity: { delay: i * 0.04, duration: 0.25 },
                                  y: { delay: i * 0.04, duration: 0.25 },
                                  borderColor: { duration: 0.2 },
                                  backgroundColor: { duration: 0.2 },
                                }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setSelectedWallet(prev => (prev === w.id ? null : w.id))}
                                className="flex flex-col items-center gap-1.5 py-3 rounded-none border outline-none"
                                style={{ borderWidth: 1.5 }}
                              >
                                <div className="w-9 h-9 rounded-none overflow-hidden border border-slate-100 shadow-sm">
                                  {Logo ? <Logo size={36} /> : null}
                                </div>
                                <span className="text-[10.5px] font-semibold text-slate-600 text-center leading-tight">
                                  {w.name}
                                </span>
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Mobile number — slides in when wallet selected */}
                      <AnimatePresence initial={false}>
                        {selectedWallet && (
                          <motion.div
                            key="wallet-mobile"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <div>
                              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">
                                Mobile linked to {WALLETS.find(w => w.id === selectedWallet)?.name}
                              </label>
                              <div className="relative flex items-center">
                                <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none">
                                  <span className="text-[13px]">🇮🇳</span>
                                  <span className="text-[13px] font-semibold text-slate-500">+91</span>
                                  <div className="w-px h-4 bg-slate-200 ml-1" />
                                </div>
                                <input
                                  type="tel"
                                  value={walletMobile}
                                  onChange={e => setWalletMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                  onBlur={() => setWalletMobileTouched(true)}
                                  placeholder="Enter 10-digit number"
                                  className={[
                                    'w-full pl-[84px] pr-4 py-3 rounded-none border text-[14px] font-medium text-slate-800 outline-none transition-all duration-150 bg-white',
                                    walletMobileError
                                      ? 'border-rose-300 bg-rose-50/40 focus:ring-2 focus:ring-rose-100'
                                      : walletMobileDigits.length === 10
                                      ? 'border-emerald-300 bg-emerald-50/40 focus:ring-2 focus:ring-emerald-100'
                                      : 'border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50',
                                  ].join(' ')}
                                  maxLength={10}
                                  aria-label="Mobile number"
                                />
                                {walletMobileDigits.length === 10 && (
                                  <div className="absolute right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </div>
                                )}
                              </div>
                              {walletMobileError && <p className="mt-1.5 text-[11px] text-rose-500 font-medium">{walletMobileError}</p>}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Cashback strip */}
                      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-[13px]">🎁</div>
                        <p className="text-[11px] text-amber-700 font-medium">Cashback &amp; rewards may apply based on your wallet balance and offers.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Submit button */}
              <motion.button
                type="submit"
                whileHover={{ scale: canSubmit ? 1.01 : 1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={[
                  'relative w-full flex items-center justify-center gap-2.5',
                  'py-3.5 px-6 rounded-xl font-semibold text-[15px] text-white',
                  'transition-opacity duration-200',
                  !canSubmit ? 'opacity-60' : '',
                ].join(' ')}
                style={{
                  background:
                    'linear-gradient(135deg, hsl(var(--accent-hue), 84%, 58%) 0%, hsl(var(--accent-hue), 80%, 50%) 100%)',
                  boxShadow:
                    '0 4px 16px hsl(var(--accent-hue), 80%, 60%, 0.35), 0 1px 0 rgba(255,255,255,0.2) inset',
                }}
                aria-label="Submit payment"
              >
                <LockIcon />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={submitLabel}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    {submitLabel}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              {/* Trust logos */}
              <div className="flex items-center justify-center gap-5 pt-0.5">
                {['Visa', 'Mastercard', 'Amex', 'Discover', 'RuPay'].map((name) => (
                  <span
                    key={name}
                    className="text-[11px] font-semibold text-slate-300 tracking-wide"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* ── Success Popup ────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'success' && (
          <SuccessModal key="success-modal" onGoHome={handleGoHome} />
        )}
      </AnimatePresence>
    </div>
  )
}

/** Clockwise-rotating Indian flag tricolor glow → green on finalizing */
function TricolorGlow({ finalizing = false }: { finalizing?: boolean }) {
  const conic =
    'conic-gradient(from 0deg, #FF9933 0%, #FFB347 14%, #fff 30%, #fff 50%, #138808 66%, #0B5C05 82%, #FF9933 100%)'

  return (
    <motion.div
      className="absolute pointer-events-none z-0"
      style={{ inset: -22 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      aria-hidden="true"
    >
      {/* ── Outer diffuse bloom */}
      <div className="absolute inset-0 rounded-[36px] overflow-hidden">
        <div
          className="tricolor-spin absolute left-1/2 top-1/2"
          style={{
            width: '200%',
            height: '200%',
            marginLeft: '-100%',
            marginTop: '-100%',
            background: conic,
            filter: 'blur(32px)',
            opacity: 0.65,
          }}
        />
      </div>

      {/* ── Crisp perimeter ring */}
      <div
        className="absolute overflow-hidden rounded-[26px]"
        style={{ inset: 12 }}
      >
        <div
          className="tricolor-spin absolute left-1/2 top-1/2"
          style={{
            width: '172%',
            height: '172%',
            marginLeft: '-86%',
            marginTop: '-86%',
            background: conic,
            filter: 'blur(1px)',
            opacity: 0.9,
          }}
        />
      </div>

      {/* ── Soft moving tip highlight */}
      <div
        className="absolute overflow-hidden rounded-[26px]"
        style={{ inset: 12 }}
      >
        <div
          className="tricolor-spin absolute left-1/2 top-1/2"
          style={{
            width: '172%',
            height: '172%',
            marginLeft: '-86%',
            marginTop: '-86%',
            background:
              'conic-gradient(from 0deg, transparent 0%, transparent 74%, rgba(255,255,255,0.7) 84%, rgba(255,220,100,0.9) 90%, transparent 100%)',
            filter: 'blur(3px)',
          }}
        />
      </div>

      {/* ── Green success glow fades in when finalizing */}
      <motion.div
        className="absolute inset-0 rounded-[36px] overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: finalizing ? 1 : 0 }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
      >
        {/* Pulsing green outer bloom */}
        <motion.div
          className="absolute left-1/2 top-1/2"
          style={{
            width: '200%',
            height: '200%',
            marginLeft: '-100%',
            marginTop: '-100%',
            background:
              'radial-gradient(ellipse 70% 70% at 50% 50%, #22c55e 0%, #16a34a 28%, #15803d 55%, transparent 80%)',
            filter: 'blur(30px)',
          }}
          animate={finalizing ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Green ring that continues with tricolor spin */}
        <div
          className="tricolor-spin absolute left-1/2 top-1/2"
          style={{
            width: '172%',
            height: '172%',
            marginLeft: '-86%',
            marginTop: '-86%',
            background:
              'conic-gradient(from 0deg, #22c55e 0%, #4ade80 25%, #86efac 50%, #4ade80 75%, #22c55e 100%)',
            filter: 'blur(1px)',
          }}
        />
        {/* Bright green traveling tip */}
        <div
          className="tricolor-spin absolute left-1/2 top-1/2"
          style={{
            width: '172%',
            height: '172%',
            marginLeft: '-86%',
            marginTop: '-86%',
            background:
              'conic-gradient(from 0deg, transparent 0%, transparent 80%, rgba(134,239,172,0.8) 88%, rgba(255,255,255,0.95) 92%, transparent 100%)',
            filter: 'blur(2px)',
          }}
        />
      </motion.div>
    </motion.div>
  )
}

/** Centered popup shown after the tricolor glow completes */
function SuccessModal({ onGoHome }: { onGoHome: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label="Payment successful"
    >
      {/* Frosted backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 12 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="relative glass-strong rounded-2xl p-8 sm:p-12 flex flex-col items-center gap-5 text-center w-full max-w-[400px]"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 20 }}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M8 16l5.5 5.5 11-11"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Payment Successful
          </h2>
          <p className="text-slate-400 text-sm mt-1.5 font-medium leading-relaxed">
            Your transaction has been processed securely.<br />
            A receipt has been sent to your email.
          </p>
        </motion.div>

        <motion.button
          type="button"
          onClick={onGoHome}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.28 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-1 w-full py-3.5 px-6 rounded-xl font-semibold text-[15px] text-white"
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            boxShadow:
              '0 4px 16px rgba(37, 99, 235, 0.35), 0 1px 0 rgba(255,255,255,0.2) inset',
          }}
          aria-label="Go to home"
        >
          Go to Home
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

