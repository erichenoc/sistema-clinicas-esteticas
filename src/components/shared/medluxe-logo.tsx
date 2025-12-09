'use client'

import { cn } from '@/lib/utils'

interface MedLuxeLogoProps {
  variant?: 'full' | 'compact' | 'icon'
  className?: string
  showTagline?: boolean
}

export function MedLuxeLogo({
  variant = 'full',
  className,
  showTagline = true,
}: MedLuxeLogoProps) {
  if (variant === 'icon') {
    return (
      <div className={cn('relative', className)}>
        {/* Diamond Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
            fill="currentColor"
            className="text-[#A67C52]"
          />
        </svg>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* Diamond */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
            fill="currentColor"
            className="text-[#A67C52]"
          />
        </svg>
        <span className="font-display text-lg tracking-wider">
          MED LUXE
        </span>
      </div>
    )
  }

  // Full logo
  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Main Logo Text */}
      <div className="flex items-baseline gap-3">
        <span
          className="font-display text-2xl tracking-[0.2em]"
          style={{ fontWeight: 400 }}
        >
          MED
        </span>
        {/* LUXE with diamond */}
        <div className="relative flex items-baseline">
          <span className="font-display text-2xl tracking-[0.15em]">L</span>
          {/* Small diamond under U */}
          <span className="relative font-display text-2xl tracking-[0.15em]">
            U
            <svg
              viewBox="0 0 12 12"
              fill="none"
              className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="font-display text-2xl tracking-[0.15em]">XE</span>
        </div>
      </div>

      {/* Tagline */}
      {showTagline && (
        <span
          className="mt-1 text-[10px] tracking-[0.35em] uppercase"
          style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 400 }}
        >
          Aesthetics and Wellness
        </span>
      )}
    </div>
  )
}

// Simpler text-based logo for sidebar
export function MedLuxeLogoSimple({
  className,
  inverted = false,
}: {
  className?: string
  inverted?: boolean
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-1">
        <span
          className={cn(
            'font-display text-xl tracking-[0.15em]',
            inverted ? 'text-white' : 'text-[#A67C52]'
          )}
        >
          MED
        </span>
        <div className="relative">
          <span
            className={cn(
              'font-display text-xl tracking-[0.1em]',
              inverted ? 'text-white' : 'text-[#A67C52]'
            )}
          >
            L
          </span>
          <span className="relative font-display text-xl tracking-[0.1em]">
            <span className={inverted ? 'text-white' : 'text-[#A67C52]'}>U</span>
            <svg
              viewBox="0 0 12 12"
              fill="none"
              className={cn(
                'absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2',
                inverted ? 'text-[#c9a67a]' : 'text-[#A67C52]'
              )}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span
            className={cn(
              'font-display text-xl tracking-[0.1em]',
              inverted ? 'text-white' : 'text-[#A67C52]'
            )}
          >
            XE
          </span>
        </div>
      </div>
      <span
        className={cn(
          'text-[8px] tracking-[0.2em] uppercase',
          inverted ? 'text-white/70' : 'text-[#998577]'
        )}
        style={{ fontFamily: 'var(--font-montserrat)' }}
      >
        Aesthetics & Wellness
      </span>
    </div>
  )
}
