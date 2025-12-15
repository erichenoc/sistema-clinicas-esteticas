'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Loading fallback component
function FaceMap3DLoader() {
  return (
    <div className="w-full h-[500px] bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Cargando modelo 3D...</span>
      </div>
    </div>
  )
}

// Lazy load the FaceMap3D component (Three.js is heavy, ~500KB+)
// IMPORTANT: ssr: false prevents Three.js from running on the server
export const FaceMap3D = dynamic(
  () => import('./FaceMap3D').then((mod) => mod.FaceMap3D),
  {
    ssr: false,
    loading: () => <FaceMap3DLoader />,
  }
)

// Re-export constants (these are safe for SSR - no Three.js)
export { FACIAL_ZONES_3D, detectZoneFromPosition } from './constants'

// Re-export types separately to avoid module evaluation
export type { FaceMap3DProps } from './FaceMap3D'
export type { Gender } from './FaceModel'
