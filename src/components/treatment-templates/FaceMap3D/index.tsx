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
export const FaceMap3D = dynamic(
  () => import('./FaceMap3D').then((mod) => mod.FaceMap3D),
  {
    ssr: false, // Three.js requires browser APIs
    loading: () => <FaceMap3DLoader />,
  }
)

// Re-export types and constants for convenience
export { FACIAL_ZONES_3D, detectZoneFromPosition } from './constants'
export type { FaceMap3DProps } from './FaceMap3D'
