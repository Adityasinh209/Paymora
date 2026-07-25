import React, { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FormFieldProps {
  label: string
  error?: string
  valid?: boolean
  children: React.ReactNode
  className?: string
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="7" fill="#22c55e" />
    <path
      d="M4.5 7l2 2 3-3"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const FormField = memo(function FormField({
  label,
  error,
  valid,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`relative flex flex-col gap-1.5 overflow-visible ${className}`}>
      {/* Label row */}
      <div className="flex items-center justify-between min-h-[20px]">
        <label className="text-[13px] font-semibold tracking-wide text-slate-500 uppercase">
          {label}
        </label>

        <AnimatePresence>
          {valid && (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              aria-label="Valid"
            >
              <CheckIcon />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Input slot */}
      {children}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            key="error"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="text-[12.5px] font-medium text-red-500 flex items-center gap-1 leading-tight"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="6" fill="#f87171" />
              <path d="M6 3.5v3" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="6" cy="8.5" r="0.7" fill="white" />
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
})
