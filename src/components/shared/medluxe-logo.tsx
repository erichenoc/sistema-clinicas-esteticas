'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

const LOGO_URL = 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1765430185/Med_Luxe_Logo_1_kohhy1.png'

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
        <Image
          src={LOGO_URL}
          alt="Med Luxe Logo"
          width={40}
          height={40}
          className="h-full w-full object-contain"
        />
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Image
          src={LOGO_URL}
          alt="Med Luxe"
          width={120}
          height={40}
          className="h-8 w-auto object-contain"
        />
      </div>
    )
  }

  // Full logo
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <Image
        src={LOGO_URL}
        alt="Med Luxe Aesthetics & Wellness"
        width={200}
        height={80}
        className="h-16 w-auto object-contain"
        priority
      />
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

// Simpler logo for sidebar using Cloudinary image
export function MedLuxeLogoSimple({
  className,
  inverted = false,
}: {
  className?: string
  inverted?: boolean
}) {
  return (
    <div className={cn('flex items-center', className)}>
      <Image
        src={LOGO_URL}
        alt="Med Luxe Aesthetics & Wellness"
        width={200}
        height={70}
        className={cn(
          'h-14 w-auto object-contain',
          inverted && 'brightness-0 invert'
        )}
      />
    </div>
  )
}
