import { MotionConfig } from 'framer-motion'
import { AnimatedBackground } from './components/AnimatedBackground'
import { CheckoutForm } from './components/CheckoutForm'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AnimatedBackground />

      <main className="relative min-h-dvh w-full flex flex-col items-center justify-start lg:justify-center pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:pl-[max(1.25rem,env(safe-area-inset-left))] sm:pr-[max(1.25rem,env(safe-area-inset-right))]">
        <header className="mb-4 sm:mb-5 lg:mb-6 text-center w-full max-w-[960px] px-1">
          <div className="inline-flex items-center gap-2 mb-2 sm:mb-2.5">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="white" strokeWidth="1.3" />
                <rect x="1" y="6" width="14" height="2.5" fill="white" opacity="0.7" />
                <rect x="3" y="10" width="4" height="1.5" rx="0.5" fill="white" opacity="0.9" />
              </svg>
            </div>
            <span className="font-display text-[14px] sm:text-[15px] font-bold text-slate-700 tracking-tight">
              Paymora
            </span>
          </div>

          <h1 className="font-display text-[1.4rem] sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight px-2">
            Complete Your Purchase
          </h1>
          <p className="text-slate-500 text-[13px] sm:text-[14px] mt-1 sm:mt-1.5 font-medium px-3">
            Your payment information is always encrypted
          </p>
        </header>

        <CheckoutForm />

        <footer className="mt-4 sm:mt-5 lg:mt-6 text-center text-[11px] sm:text-[12px] text-slate-400/80 font-medium max-w-[320px] sm:max-w-none leading-relaxed px-2">
          <span className="inline sm:hidden">256-bit SSL · PCI DSS · Paymora</span>
          <span className="hidden sm:inline">256-bit SSL encryption · PCI DSS compliant · Powered by Paymora</span>
        </footer>
      </main>
    </MotionConfig>
  )
}
