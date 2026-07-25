import { AnimatedBackground } from './components/AnimatedBackground'
import { CheckoutForm } from './components/CheckoutForm'

export default function App() {
  return (
    <>
      <AnimatedBackground />

      <main className="relative min-h-dvh flex flex-col items-center justify-center py-6 sm:py-8 px-4">
        {/* Page header — tighter so the page doesn't feel sparse */}
        <header className="mb-5 sm:mb-6 text-center">
          <div className="inline-flex items-center gap-2 mb-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
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
            <span className="font-display text-[15px] font-bold text-slate-700 tracking-tight">
              SecurePay
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            Complete Your Purchase
          </h1>
          <p className="text-slate-500 text-[14px] mt-1.5 font-medium">
            Your payment information is always encrypted
          </p>
        </header>

        <CheckoutForm />

        {/* Footer */}
        <footer className="mt-5 sm:mt-6 text-center text-[12px] text-slate-400/80 font-medium">
          256-bit SSL encryption · PCI DSS compliant · Powered by SecurePay
        </footer>
      </main>
    </>
  )
}
