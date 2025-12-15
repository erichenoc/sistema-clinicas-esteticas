'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { FaceView, InjectionPoint, InjectionZone } from '@/types/treatment-templates'

interface FaceMapSVGProps {
  view: FaceView
  points: InjectionPoint[]
  onPointClick?: (point: InjectionPoint) => void
  onAddPoint?: (x: number, y: number, view: FaceView, zone: InjectionZone) => void
  selectedPointId?: string | null
  readOnly?: boolean
  className?: string
  gender?: 'male' | 'female'
  useRealImages?: boolean
}

// Real face image URLs - using high-quality placeholder images
// These can be replaced with actual professional medical images
const FACE_IMAGES = {
  female: {
    frontal: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=533&fit=crop&crop=face',
    left: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=533&fit=crop&crop=face',
    right: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=533&fit=crop&crop=face&flip=h',
  },
  male: {
    frontal: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=533&fit=crop&crop=face',
    left: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=533&fit=crop&crop=face',
    right: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=533&fit=crop&crop=face&flip=h',
  },
}

// Zone detection based on percentage coordinates (0-100)
// ViewBox is 0 0 100 133, so we need to scale Y coordinates
function detectZone(x: number, y: number, view: FaceView): InjectionZone {
  // Scale y from percentage to SVG coordinates (0-100 -> 0-133)
  const scaledY = (y / 100) * 133

  if (view === 'frontal') {
    // Forehead: top area
    if (scaledY < 28 && x > 25 && x < 75) return 'frente'

    // Glabella (entrecejo)
    if (scaledY >= 28 && scaledY < 40 && x >= 40 && x <= 60) return 'entrecejo'

    // Temples
    if (x < 23 && scaledY >= 24 && scaledY < 40) return 'sien_izq'
    if (x > 77 && scaledY >= 24 && scaledY < 40) return 'sien_der'

    // Crow's feet
    if (x < 30 && scaledY >= 36 && scaledY < 50) return 'patas_gallo_izq'
    if (x > 70 && scaledY >= 36 && scaledY < 50) return 'patas_gallo_der'

    // Nose
    if (x >= 42 && x <= 58 && scaledY >= 38 && scaledY < 58) return 'nariz'

    // Cheeks
    if (x < 38 && scaledY >= 44 && scaledY < 68) return 'mejilla_izq'
    if (x > 62 && scaledY >= 44 && scaledY < 68) return 'mejilla_der'

    // Nasolabial folds
    if (x >= 30 && x < 42 && scaledY >= 54 && scaledY < 72) return 'surco_nasogeniano_izq'
    if (x > 58 && x <= 70 && scaledY >= 54 && scaledY < 72) return 'surco_nasogeniano_der'

    // Lips
    if (scaledY >= 68 && scaledY < 80 && x >= 35 && x <= 65) {
      if (scaledY < 74) return 'labio_superior'
      return 'labio_inferior'
    }

    // Marionette lines / comisuras
    if (scaledY >= 75 && scaledY < 88 && (x < 42 || x > 58) && x > 30 && x < 70) return 'comisuras'

    // Chin
    if (scaledY >= 84 && scaledY < 98 && x >= 38 && x <= 62) return 'menton'

    // Jawline
    if (scaledY >= 70 && scaledY < 98) {
      if (x < 35) return 'linea_mandibular_izq'
      if (x > 65) return 'linea_mandibular_der'
    }

    // Neck
    if (scaledY >= 100) return 'cuello'
  }

  // For profile views
  if (view === 'left' || view === 'right') {
    if (scaledY < 32) return 'frente'
    if (scaledY >= 28 && scaledY < 42 && x > 60) return view === 'left' ? 'sien_izq' : 'sien_der'
    if (scaledY >= 40 && scaledY < 50) return view === 'left' ? 'patas_gallo_izq' : 'patas_gallo_der'
    if (scaledY >= 38 && scaledY < 55 && x < 50) return 'nariz'
    if (scaledY >= 45 && scaledY < 72) return view === 'left' ? 'mejilla_izq' : 'mejilla_der'
    if (scaledY >= 68 && scaledY < 82) return 'labio_superior'
    if (scaledY >= 82 && scaledY < 96) return 'menton'
    if (scaledY >= 96) return 'cuello'
  }

  // Default
  return 'frente'
}

export function FaceMapSVG({
  view,
  points,
  onPointClick,
  onAddPoint,
  selectedPointId,
  readOnly = false,
  className,
  gender = 'female',
  useRealImages = true,
}: FaceMapSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const filteredPoints = points.filter((p) => p.view === view)

  // Get the appropriate image URL based on gender and view
  const getImageUrl = () => {
    const images = FACE_IMAGES[gender]
    return images[view] || images.frontal
  }

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (readOnly || !onAddPoint || !containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()

      // Calculate position as percentage
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      // Detect the zone based on click position
      const zone = detectZone(x, y, view)

      onAddPoint(x, y, view, zone)
    },
    [readOnly, onAddPoint, view]
  )

  const handlePointClick = useCallback(
    (e: React.MouseEvent, point: InjectionPoint) => {
      e.stopPropagation()
      onPointClick?.(point)
    },
    [onPointClick]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (readOnly || !containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      const zone = detectZone(x, y, view)
      setHoveredZone(zone)
    },
    [readOnly, view]
  )

  // Reset image state when view changes
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [view, gender])

  const showRealImage = useRealImages && !imageError

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-xl overflow-hidden border-2 border-slate-300 shadow-lg',
        !showRealImage && 'bg-gradient-to-b from-slate-100 to-slate-200',
        !readOnly && 'cursor-crosshair',
        className
      )}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredZone(null)}
      style={{ minHeight: '350px', aspectRatio: '3/4' }}
    >
      {/* Real face image background */}
      {showRealImage && (
        <>
          {/* Loading placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-slate-300 flex items-center justify-center">
              <div className="animate-pulse text-slate-500">Cargando imagen...</div>
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getImageUrl()}
            alt={`Vista ${view} del rostro`}
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {/* Subtle overlay for better zone visibility */}
          <div className="absolute inset-0 bg-white/10" />
        </>
      )}

      {/* SVG with zone overlays - shown on top of image or as fallback */}
      <svg
        viewBox="0 0 100 133"
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        {showRealImage ? (
          // Zone overlays only (no face drawing)
          <>
            {view === 'frontal' && <FrontalZoneOverlay hoveredZone={hoveredZone} />}
            {view === 'left' && <LeftProfileZoneOverlay hoveredZone={hoveredZone} />}
            {view === 'right' && <RightProfileZoneOverlay hoveredZone={hoveredZone} />}
          </>
        ) : (
          // Full SVG face (fallback)
          <>
            {view === 'frontal' && <FrontalFace hoveredZone={hoveredZone} />}
            {view === 'left' && <LeftProfileFace hoveredZone={hoveredZone} />}
            {view === 'right' && <RightProfileFace hoveredZone={hoveredZone} />}
          </>
        )}
      </svg>

      {/* Injection points */}
      {filteredPoints.map((point, index) => (
        <div
          key={point.id}
          className={cn(
            'absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 z-10',
            'cursor-pointer hover:scale-110',
            selectedPointId === point.id && 'scale-125'
          )}
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
          }}
          onClick={(e) => handlePointClick(e, point)}
        >
          {/* Glow effect for selected */}
          {selectedPointId === point.id && (
            <div className="absolute inset-0 -m-2 rounded-full bg-blue-400/50 animate-ping" />
          )}
          {/* Point marker */}
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white',
              selectedPointId === point.id ? 'bg-blue-500' : 'bg-red-500'
            )}
          >
            {index + 1}
          </div>
        </div>
      ))}

      {/* View label */}
      <div className="absolute bottom-3 left-3 text-sm font-semibold text-slate-700 bg-white/95 px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm">
        {view === 'frontal' && 'Vista Frontal'}
        {view === 'left' && 'Perfil Izquierdo'}
        {view === 'right' && 'Perfil Derecho'}
      </div>

      {/* Point count */}
      <div className="absolute top-3 right-3 text-sm font-semibold text-slate-700 bg-white/95 px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm">
        {filteredPoints.length} punto{filteredPoints.length !== 1 ? 's' : ''}
      </div>

      {/* Hovered zone indicator */}
      {!readOnly && hoveredZone && (
        <div className="absolute top-3 left-3 text-xs font-medium text-slate-600 bg-white/95 px-2 py-1 rounded-full shadow-md backdrop-blur-sm capitalize">
          {hoveredZone.replace(/_/g, ' ').replace(/izq/g, '(Izq)').replace(/der/g, '(Der)')}
        </div>
      )}

      {/* Instructions */}
      {!readOnly && filteredPoints.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 text-white px-5 py-3 rounded-xl text-sm font-medium shadow-xl">
            Haz clic en la zona para agregar punto
          </div>
        </div>
      )}
    </div>
  )
}

// Frontal face with realistic structure and zone labels
function FrontalFace({ hoveredZone }: { hoveredZone: string | null }) {
  const getZoneOpacity = (zone: string) => hoveredZone === zone ? 0.4 : 0.15

  return (
    <g>
      {/* Face outline */}
      <ellipse cx={50} cy={55} rx={32} ry={45} fill="#fce7d6" stroke="#d4a574" strokeWidth={0.5} />

      {/* Hair line */}
      <path d="M 20 35 Q 25 10, 50 8 Q 75 10, 80 35" fill="none" stroke="#8b6914" strokeWidth={1} />

      {/* FOREHEAD zone */}
      <rect
        x={25} y={10} width={50} height={18} rx={3}
        fill={`rgba(251, 191, 36, ${getZoneOpacity('frente')})`}
        stroke="#f59e0b" strokeWidth={0.4} strokeDasharray="2,1"
      />
      <text x={50} y={21} textAnchor="middle" fontSize={3.5} fill="#92400e" fontWeight="600">FRENTE</text>

      {/* Eyebrows */}
      <path d="M 30 34 Q 37 31, 44 34" fill="none" stroke="#5c4033" strokeWidth={1} strokeLinecap="round" />
      <path d="M 56 34 Q 63 31, 70 34" fill="none" stroke="#5c4033" strokeWidth={1} strokeLinecap="round" />

      {/* GLABELLA zone (entrecejo) */}
      <rect
        x={43} y={30} width={14} height={8} rx={2}
        fill={`rgba(251, 191, 36, ${getZoneOpacity('entrecejo')})`}
        stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={50} y={36} textAnchor="middle" fontSize={2.5} fill="#92400e">ENTRECEJO</text>

      {/* Eyes */}
      <ellipse cx={35} cy={42} rx={7} ry={3.5} fill="white" stroke="#333" strokeWidth={0.3} />
      <circle cx={35} cy={42} r={2.5} fill="#4a3728" />
      <circle cx={34} cy={41.5} r={0.8} fill="white" />

      <ellipse cx={65} cy={42} rx={7} ry={3.5} fill="white" stroke="#333" strokeWidth={0.3} />
      <circle cx={65} cy={42} r={2.5} fill="#4a3728" />
      <circle cx={64} cy={41.5} r={0.8} fill="white" />

      {/* Left temple (SIEN IZQ) */}
      <circle
        cx={18} cy={32} r={5}
        fill={`rgba(147, 197, 253, ${getZoneOpacity('sien_izq')})`}
        stroke="#3b82f6" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={18} y={33} textAnchor="middle" fontSize={2} fill="#1e40af">SIEN</text>

      {/* Right temple (SIEN DER) */}
      <circle
        cx={82} cy={32} r={5}
        fill={`rgba(147, 197, 253, ${getZoneOpacity('sien_der')})`}
        stroke="#3b82f6" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={82} y={33} textAnchor="middle" fontSize={2} fill="#1e40af">SIEN</text>

      {/* Left crow's feet */}
      <circle
        cx={22} cy={42} r={6}
        fill={`rgba(251, 191, 36, ${getZoneOpacity('patas_gallo_izq')})`}
        stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={22} y={42} textAnchor="middle" fontSize={1.8} fill="#92400e">PATA</text>
      <text x={22} y={45} textAnchor="middle" fontSize={1.8} fill="#92400e">GALLO</text>

      {/* Right crow's feet */}
      <circle
        cx={78} cy={42} r={6}
        fill={`rgba(251, 191, 36, ${getZoneOpacity('patas_gallo_der')})`}
        stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={78} y={42} textAnchor="middle" fontSize={1.8} fill="#92400e">PATA</text>
      <text x={78} y={45} textAnchor="middle" fontSize={1.8} fill="#92400e">GALLO</text>

      {/* NOSE - Full nose structure */}
      <path
        d="M 50 38 L 50 52 M 46 54 Q 50 58, 54 54"
        fill="none" stroke="#d4a574" strokeWidth={0.5}
      />
      <ellipse
        cx={50} cy={50} rx={6} ry={10}
        fill={`rgba(254, 215, 170, ${getZoneOpacity('nariz')})`}
        stroke="#f97316" strokeWidth={0.4} strokeDasharray="2,1"
      />
      <text x={50} y={51} textAnchor="middle" fontSize={2.5} fill="#c2410c" fontWeight="600">NARIZ</text>

      {/* Left cheek (MEJILLA IZQ) */}
      <ellipse
        cx={28} cy={55} rx={7} ry={9}
        fill={`rgba(253, 186, 186, ${getZoneOpacity('mejilla_izq')})`}
        stroke="#f87171" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={28} y={56} textAnchor="middle" fontSize={2.2} fill="#b91c1c">MEJILLA</text>

      {/* Right cheek (MEJILLA DER) */}
      <ellipse
        cx={72} cy={55} rx={7} ry={9}
        fill={`rgba(253, 186, 186, ${getZoneOpacity('mejilla_der')})`}
        stroke="#f87171" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={72} y={56} textAnchor="middle" fontSize={2.2} fill="#b91c1c">MEJILLA</text>

      {/* Left nasolabial fold */}
      <ellipse
        cx={36} cy={62} rx={4} ry={7}
        fill={`rgba(167, 243, 208, ${getZoneOpacity('surco_nasogeniano_izq')})`}
        stroke="#10b981" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={36} y={61} textAnchor="middle" fontSize={1.8} fill="#047857">SURCO</text>
      <text x={36} y={64} textAnchor="middle" fontSize={1.8} fill="#047857">NASOG.</text>

      {/* Right nasolabial fold */}
      <ellipse
        cx={64} cy={62} rx={4} ry={7}
        fill={`rgba(167, 243, 208, ${getZoneOpacity('surco_nasogeniano_der')})`}
        stroke="#10b981" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={64} y={61} textAnchor="middle" fontSize={1.8} fill="#047857">SURCO</text>
      <text x={64} y={64} textAnchor="middle" fontSize={1.8} fill="#047857">NASOG.</text>

      {/* Mouth / Lips */}
      <path d="M 42 72 Q 50 69, 58 72" fill="none" stroke="#c2727d" strokeWidth={0.8} />
      <path d="M 42 72 Q 50 76, 58 72" fill="none" stroke="#c2727d" strokeWidth={0.8} />

      {/* Upper lip zone */}
      <ellipse
        cx={50} cy={70} rx={10} ry={3}
        fill={`rgba(251, 207, 232, ${getZoneOpacity('labio_superior')})`}
        stroke="#ec4899" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={50} y={71} textAnchor="middle" fontSize={2} fill="#be185d">LABIO SUP.</text>

      {/* Lower lip zone */}
      <ellipse
        cx={50} cy={76} rx={10} ry={3}
        fill={`rgba(251, 207, 232, ${getZoneOpacity('labio_inferior')})`}
        stroke="#ec4899" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={50} y={77} textAnchor="middle" fontSize={2} fill="#be185d">LABIO INF.</text>

      {/* Comisuras / Marionette lines */}
      <ellipse
        cx={38} cy={80} rx={4} ry={5}
        fill={`rgba(196, 181, 253, ${getZoneOpacity('comisuras')})`}
        stroke="#8b5cf6" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={38} y={81} textAnchor="middle" fontSize={1.6} fill="#6d28d9">COMIS.</text>

      <ellipse
        cx={62} cy={80} rx={4} ry={5}
        fill={`rgba(196, 181, 253, ${getZoneOpacity('comisuras')})`}
        stroke="#8b5cf6" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={62} y={81} textAnchor="middle" fontSize={1.6} fill="#6d28d9">COMIS.</text>

      {/* Chin (MENTON) */}
      <ellipse
        cx={50} cy={90} rx={10} ry={6}
        fill={`rgba(251, 191, 36, ${getZoneOpacity('menton')})`}
        stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={50} y={91} textAnchor="middle" fontSize={2.5} fill="#92400e">MENTÓN</text>

      {/* Jawline left */}
      <path
        d="M 18 65 Q 20 82, 32 96"
        fill="none"
        stroke={hoveredZone === 'linea_mandibular_izq' ? '#f59e0b' : '#d4a574'}
        strokeWidth={hoveredZone === 'linea_mandibular_izq' ? 1.5 : 0.5}
        strokeDasharray="2,1"
      />
      <text x={22} y={82} textAnchor="middle" fontSize={1.8} fill="#92400e" transform="rotate(-50 22 82)">MANDÍB.</text>

      {/* Jawline right */}
      <path
        d="M 82 65 Q 80 82, 68 96"
        fill="none"
        stroke={hoveredZone === 'linea_mandibular_der' ? '#f59e0b' : '#d4a574'}
        strokeWidth={hoveredZone === 'linea_mandibular_der' ? 1.5 : 0.5}
        strokeDasharray="2,1"
      />
      <text x={78} y={82} textAnchor="middle" fontSize={1.8} fill="#92400e" transform="rotate(50 78 82)">MANDÍB.</text>

      {/* Neck */}
      <rect
        x={35} y={100} width={30} height={20} rx={3}
        fill={`rgba(209, 213, 219, ${getZoneOpacity('cuello')})`}
        stroke="#6b7280" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={50} y={112} textAnchor="middle" fontSize={3} fill="#374151">CUELLO</text>
    </g>
  )
}

// Left profile face
function LeftProfileFace({ hoveredZone }: { hoveredZone: string | null }) {
  const getZoneOpacity = (zone: string) => hoveredZone === zone ? 0.4 : 0.15

  return (
    <g>
      {/* Face outline - profile view */}
      <path
        d="M 70 20 Q 75 15, 65 10 Q 50 8, 40 15 L 35 30 L 30 45 L 28 55 Q 25 60, 30 70 L 35 75 L 32 85 Q 35 100, 50 100 L 75 100 L 75 75 Q 80 60, 75 45 Q 72 30, 70 20"
        fill="#fce7d6" stroke="#d4a574" strokeWidth={0.5}
      />

      {/* Forehead */}
      <path
        d="M 35 15 Q 50 10, 65 18 L 65 32 Q 50 27, 35 32 Z"
        fill={`rgba(251, 191, 36, ${getZoneOpacity('frente')})`}
        stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={50} y={24} textAnchor="middle" fontSize={3} fill="#92400e">FRENTE</text>

      {/* Eye */}
      <ellipse cx={55} cy={42} rx={5} ry={2.5} fill="white" stroke="#333" strokeWidth={0.3} />
      <circle cx={55} cy={42} r={1.8} fill="#4a3728" />

      {/* Eyebrow */}
      <path d="M 48 38 Q 55 35, 62 38" fill="none" stroke="#5c4033" strokeWidth={1} />

      {/* Temple */}
      <circle
        cx={70} cy={35} r={6}
        fill={`rgba(147, 197, 253, ${getZoneOpacity('sien_izq')})`}
        stroke="#3b82f6" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={70} y={36} textAnchor="middle" fontSize={2.2} fill="#1e40af">SIEN</text>

      {/* Crow's feet */}
      <circle
        cx={63} cy={44} r={4}
        fill={`rgba(251, 191, 36, ${getZoneOpacity('patas_gallo_izq')})`}
        stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={63} y={45} textAnchor="middle" fontSize={1.8} fill="#92400e">PATA G.</text>

      {/* Nose - Profile */}
      <path d="M 42 38 L 38 48 L 28 55 L 35 58 L 42 55" fill="none" stroke="#d4a574" strokeWidth={0.6} />
      <ellipse
        cx={35} cy={50} rx={7} ry={8}
        fill={`rgba(254, 215, 170, ${getZoneOpacity('nariz')})`}
        stroke="#f97316" strokeWidth={0.4} strokeDasharray="2,1"
      />
      <text x={35} y={51} textAnchor="middle" fontSize={2.2} fill="#c2410c" fontWeight="600">NARIZ</text>

      {/* Cheek */}
      <ellipse
        cx={55} cy={58} rx={10} ry={12}
        fill={`rgba(253, 186, 186, ${getZoneOpacity('mejilla_izq')})`}
        stroke="#f87171" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={55} y={59} textAnchor="middle" fontSize={2.5} fill="#b91c1c">MEJILLA</text>

      {/* Nasolabial */}
      <ellipse
        cx={40} cy={65} rx={4} ry={7}
        fill={`rgba(167, 243, 208, ${getZoneOpacity('surco_nasogeniano_izq')})`}
        stroke="#10b981" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={40} y={65} textAnchor="middle" fontSize={1.8} fill="#047857">SURCO</text>

      {/* Lips */}
      <path d="M 32 72 Q 38 70, 44 72" fill="none" stroke="#c2727d" strokeWidth={0.8} />
      <path d="M 32 72 Q 38 75, 44 72" fill="none" stroke="#c2727d" strokeWidth={0.8} />
      <ellipse
        cx={38} cy={73} rx={6} ry={4}
        fill={`rgba(251, 207, 232, ${getZoneOpacity('labio_superior')})`}
        stroke="#ec4899" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={38} y={74} textAnchor="middle" fontSize={1.8} fill="#be185d">LABIOS</text>

      {/* Chin */}
      <ellipse
        cx={40} cy={88} rx={8} ry={6}
        fill={`rgba(251, 191, 36, ${getZoneOpacity('menton')})`}
        stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={40} y={89} textAnchor="middle" fontSize={2.5} fill="#92400e">MENTÓN</text>

      {/* Jawline */}
      <path d="M 48 85 Q 60 92, 75 88" fill="none" stroke="#d4a574" strokeWidth={0.5} strokeDasharray="2,1" />
      <text x={62} y={93} textAnchor="middle" fontSize={2} fill="#92400e">MANDÍBULA</text>

      {/* Neck */}
      <rect
        x={50} y={100} width={25} height={20} rx={3}
        fill={`rgba(209, 213, 219, ${getZoneOpacity('cuello')})`}
        stroke="#6b7280" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={62} y={112} textAnchor="middle" fontSize={2.5} fill="#374151">CUELLO</text>

      {/* Ear hint */}
      <ellipse cx={75} cy={50} rx={4} ry={8} fill="none" stroke="#d4a574" strokeWidth={0.4} />
    </g>
  )
}

// Right profile face (mirrored)
function RightProfileFace({ hoveredZone }: { hoveredZone: string | null }) {
  const getZoneOpacity = (zone: string) => hoveredZone === zone ? 0.4 : 0.15

  return (
    <g>
      {/* Face outline - profile view (mirrored) */}
      <path
        d="M 30 20 Q 25 15, 35 10 Q 50 8, 60 15 L 65 30 L 70 45 L 72 55 Q 75 60, 70 70 L 65 75 L 68 85 Q 65 100, 50 100 L 25 100 L 25 75 Q 20 60, 25 45 Q 28 30, 30 20"
        fill="#fce7d6" stroke="#d4a574" strokeWidth={0.5}
      />

      {/* Forehead */}
      <path
        d="M 65 15 Q 50 10, 35 18 L 35 32 Q 50 27, 65 32 Z"
        fill={`rgba(251, 191, 36, ${getZoneOpacity('frente')})`}
        stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={50} y={24} textAnchor="middle" fontSize={3} fill="#92400e">FRENTE</text>

      {/* Eye */}
      <ellipse cx={45} cy={42} rx={5} ry={2.5} fill="white" stroke="#333" strokeWidth={0.3} />
      <circle cx={45} cy={42} r={1.8} fill="#4a3728" />

      {/* Eyebrow */}
      <path d="M 52 38 Q 45 35, 38 38" fill="none" stroke="#5c4033" strokeWidth={1} />

      {/* Temple */}
      <circle
        cx={30} cy={35} r={6}
        fill={`rgba(147, 197, 253, ${getZoneOpacity('sien_der')})`}
        stroke="#3b82f6" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={30} y={36} textAnchor="middle" fontSize={2.2} fill="#1e40af">SIEN</text>

      {/* Crow's feet */}
      <circle
        cx={37} cy={44} r={4}
        fill={`rgba(251, 191, 36, ${getZoneOpacity('patas_gallo_der')})`}
        stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={37} y={45} textAnchor="middle" fontSize={1.8} fill="#92400e">PATA G.</text>

      {/* Nose - Profile */}
      <path d="M 58 38 L 62 48 L 72 55 L 65 58 L 58 55" fill="none" stroke="#d4a574" strokeWidth={0.6} />
      <ellipse
        cx={65} cy={50} rx={7} ry={8}
        fill={`rgba(254, 215, 170, ${getZoneOpacity('nariz')})`}
        stroke="#f97316" strokeWidth={0.4} strokeDasharray="2,1"
      />
      <text x={65} y={51} textAnchor="middle" fontSize={2.2} fill="#c2410c" fontWeight="600">NARIZ</text>

      {/* Cheek */}
      <ellipse
        cx={45} cy={58} rx={10} ry={12}
        fill={`rgba(253, 186, 186, ${getZoneOpacity('mejilla_der')})`}
        stroke="#f87171" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={45} y={59} textAnchor="middle" fontSize={2.5} fill="#b91c1c">MEJILLA</text>

      {/* Nasolabial */}
      <ellipse
        cx={60} cy={65} rx={4} ry={7}
        fill={`rgba(167, 243, 208, ${getZoneOpacity('surco_nasogeniano_der')})`}
        stroke="#10b981" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={60} y={65} textAnchor="middle" fontSize={1.8} fill="#047857">SURCO</text>

      {/* Lips */}
      <path d="M 68 72 Q 62 70, 56 72" fill="none" stroke="#c2727d" strokeWidth={0.8} />
      <path d="M 68 72 Q 62 75, 56 72" fill="none" stroke="#c2727d" strokeWidth={0.8} />
      <ellipse
        cx={62} cy={73} rx={6} ry={4}
        fill={`rgba(251, 207, 232, ${getZoneOpacity('labio_superior')})`}
        stroke="#ec4899" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={62} y={74} textAnchor="middle" fontSize={1.8} fill="#be185d">LABIOS</text>

      {/* Chin */}
      <ellipse
        cx={60} cy={88} rx={8} ry={6}
        fill={`rgba(251, 191, 36, ${getZoneOpacity('menton')})`}
        stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={60} y={89} textAnchor="middle" fontSize={2.5} fill="#92400e">MENTÓN</text>

      {/* Jawline */}
      <path d="M 52 85 Q 40 92, 25 88" fill="none" stroke="#d4a574" strokeWidth={0.5} strokeDasharray="2,1" />
      <text x={38} y={93} textAnchor="middle" fontSize={2} fill="#92400e">MANDÍBULA</text>

      {/* Neck */}
      <rect
        x={25} y={100} width={25} height={20} rx={3}
        fill={`rgba(209, 213, 219, ${getZoneOpacity('cuello')})`}
        stroke="#6b7280" strokeWidth={0.3} strokeDasharray="2,1"
      />
      <text x={38} y={112} textAnchor="middle" fontSize={2.5} fill="#374151">CUELLO</text>

      {/* Ear hint */}
      <ellipse cx={25} cy={50} rx={4} ry={8} fill="none" stroke="#d4a574" strokeWidth={0.4} />
    </g>
  )
}

// ============= ZONE OVERLAYS FOR REAL IMAGES =============
// These are transparent overlays that show zones on top of real photos

function FrontalZoneOverlay({ hoveredZone }: { hoveredZone: string | null }) {
  const getZoneStyle = (zone: string) => ({
    fill: hoveredZone === zone ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)',
    stroke: hoveredZone === zone ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
    strokeWidth: hoveredZone === zone ? 0.8 : 0.3,
  })

  const getLabelStyle = (zone: string) => ({
    fill: hoveredZone === zone ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
    fontWeight: hoveredZone === zone ? 700 : 600,
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
  })

  return (
    <g>
      {/* Drop shadow filter for text */}
      <defs>
        <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodColor="#000" floodOpacity="0.7"/>
        </filter>
      </defs>

      {/* FOREHEAD */}
      <rect
        x={25} y={10} width={50} height={18} rx={3}
        {...getZoneStyle('frente')}
        strokeDasharray="3,2"
      />
      <text x={50} y={21} textAnchor="middle" fontSize={3.5} {...getLabelStyle('frente')} filter="url(#textShadow)">
        FRENTE
      </text>

      {/* GLABELLA (entrecejo) */}
      <rect
        x={43} y={30} width={14} height={8} rx={2}
        {...getZoneStyle('entrecejo')}
        strokeDasharray="2,1"
      />
      <text x={50} y={36} textAnchor="middle" fontSize={2.5} {...getLabelStyle('entrecejo')} filter="url(#textShadow)">
        ENTRECEJO
      </text>

      {/* Left temple */}
      <circle cx={18} cy={32} r={5} {...getZoneStyle('sien_izq')} strokeDasharray="2,1" />
      <text x={18} y={33} textAnchor="middle" fontSize={2} {...getLabelStyle('sien_izq')} filter="url(#textShadow)">
        SIEN
      </text>

      {/* Right temple */}
      <circle cx={82} cy={32} r={5} {...getZoneStyle('sien_der')} strokeDasharray="2,1" />
      <text x={82} y={33} textAnchor="middle" fontSize={2} {...getLabelStyle('sien_der')} filter="url(#textShadow)">
        SIEN
      </text>

      {/* Left crow's feet */}
      <circle cx={22} cy={42} r={6} {...getZoneStyle('patas_gallo_izq')} strokeDasharray="2,1" />
      <text x={22} y={41} textAnchor="middle" fontSize={1.8} {...getLabelStyle('patas_gallo_izq')} filter="url(#textShadow)">
        PATA
      </text>
      <text x={22} y={44} textAnchor="middle" fontSize={1.8} {...getLabelStyle('patas_gallo_izq')} filter="url(#textShadow)">
        GALLO
      </text>

      {/* Right crow's feet */}
      <circle cx={78} cy={42} r={6} {...getZoneStyle('patas_gallo_der')} strokeDasharray="2,1" />
      <text x={78} y={41} textAnchor="middle" fontSize={1.8} {...getLabelStyle('patas_gallo_der')} filter="url(#textShadow)">
        PATA
      </text>
      <text x={78} y={44} textAnchor="middle" fontSize={1.8} {...getLabelStyle('patas_gallo_der')} filter="url(#textShadow)">
        GALLO
      </text>

      {/* NOSE */}
      <ellipse cx={50} cy={50} rx={6} ry={10} {...getZoneStyle('nariz')} strokeDasharray="2,1" />
      <text x={50} y={51} textAnchor="middle" fontSize={2.5} {...getLabelStyle('nariz')} filter="url(#textShadow)">
        NARIZ
      </text>

      {/* Left cheek */}
      <ellipse cx={28} cy={55} rx={7} ry={9} {...getZoneStyle('mejilla_izq')} strokeDasharray="2,1" />
      <text x={28} y={56} textAnchor="middle" fontSize={2.2} {...getLabelStyle('mejilla_izq')} filter="url(#textShadow)">
        MEJILLA
      </text>

      {/* Right cheek */}
      <ellipse cx={72} cy={55} rx={7} ry={9} {...getZoneStyle('mejilla_der')} strokeDasharray="2,1" />
      <text x={72} y={56} textAnchor="middle" fontSize={2.2} {...getLabelStyle('mejilla_der')} filter="url(#textShadow)">
        MEJILLA
      </text>

      {/* Left nasolabial fold */}
      <ellipse cx={36} cy={62} rx={4} ry={7} {...getZoneStyle('surco_nasogeniano_izq')} strokeDasharray="2,1" />
      <text x={36} y={61} textAnchor="middle" fontSize={1.8} {...getLabelStyle('surco_nasogeniano_izq')} filter="url(#textShadow)">
        SURCO
      </text>
      <text x={36} y={64} textAnchor="middle" fontSize={1.8} {...getLabelStyle('surco_nasogeniano_izq')} filter="url(#textShadow)">
        NASOG.
      </text>

      {/* Right nasolabial fold */}
      <ellipse cx={64} cy={62} rx={4} ry={7} {...getZoneStyle('surco_nasogeniano_der')} strokeDasharray="2,1" />
      <text x={64} y={61} textAnchor="middle" fontSize={1.8} {...getLabelStyle('surco_nasogeniano_der')} filter="url(#textShadow)">
        SURCO
      </text>
      <text x={64} y={64} textAnchor="middle" fontSize={1.8} {...getLabelStyle('surco_nasogeniano_der')} filter="url(#textShadow)">
        NASOG.
      </text>

      {/* Upper lip */}
      <ellipse cx={50} cy={70} rx={10} ry={3} {...getZoneStyle('labio_superior')} strokeDasharray="2,1" />
      <text x={50} y={71} textAnchor="middle" fontSize={2} {...getLabelStyle('labio_superior')} filter="url(#textShadow)">
        LABIO SUP.
      </text>

      {/* Lower lip */}
      <ellipse cx={50} cy={76} rx={10} ry={3} {...getZoneStyle('labio_inferior')} strokeDasharray="2,1" />
      <text x={50} y={77} textAnchor="middle" fontSize={2} {...getLabelStyle('labio_inferior')} filter="url(#textShadow)">
        LABIO INF.
      </text>

      {/* Left comisura */}
      <ellipse cx={38} cy={80} rx={4} ry={5} {...getZoneStyle('comisuras')} strokeDasharray="2,1" />
      <text x={38} y={81} textAnchor="middle" fontSize={1.6} {...getLabelStyle('comisuras')} filter="url(#textShadow)">
        COMIS.
      </text>

      {/* Right comisura */}
      <ellipse cx={62} cy={80} rx={4} ry={5} {...getZoneStyle('comisuras')} strokeDasharray="2,1" />
      <text x={62} y={81} textAnchor="middle" fontSize={1.6} {...getLabelStyle('comisuras')} filter="url(#textShadow)">
        COMIS.
      </text>

      {/* Chin */}
      <ellipse cx={50} cy={90} rx={10} ry={6} {...getZoneStyle('menton')} strokeDasharray="2,1" />
      <text x={50} y={91} textAnchor="middle" fontSize={2.5} {...getLabelStyle('menton')} filter="url(#textShadow)">
        MENTÓN
      </text>

      {/* Left jawline */}
      <path
        d="M 18 65 Q 20 82, 32 96"
        fill="none"
        stroke={hoveredZone === 'linea_mandibular_izq' ? '#ffffff' : 'rgba(255,255,255,0.5)'}
        strokeWidth={hoveredZone === 'linea_mandibular_izq' ? 1.5 : 0.8}
        strokeDasharray="3,2"
      />
      <text x={22} y={82} textAnchor="middle" fontSize={1.8} {...getLabelStyle('linea_mandibular_izq')} transform="rotate(-50 22 82)" filter="url(#textShadow)">
        MANDÍB.
      </text>

      {/* Right jawline */}
      <path
        d="M 82 65 Q 80 82, 68 96"
        fill="none"
        stroke={hoveredZone === 'linea_mandibular_der' ? '#ffffff' : 'rgba(255,255,255,0.5)'}
        strokeWidth={hoveredZone === 'linea_mandibular_der' ? 1.5 : 0.8}
        strokeDasharray="3,2"
      />
      <text x={78} y={82} textAnchor="middle" fontSize={1.8} {...getLabelStyle('linea_mandibular_der')} transform="rotate(50 78 82)" filter="url(#textShadow)">
        MANDÍB.
      </text>

      {/* Neck */}
      <rect x={35} y={100} width={30} height={20} rx={3} {...getZoneStyle('cuello')} strokeDasharray="2,1" />
      <text x={50} y={112} textAnchor="middle" fontSize={3} {...getLabelStyle('cuello')} filter="url(#textShadow)">
        CUELLO
      </text>
    </g>
  )
}

function LeftProfileZoneOverlay({ hoveredZone }: { hoveredZone: string | null }) {
  const getZoneStyle = (zone: string) => ({
    fill: hoveredZone === zone ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)',
    stroke: hoveredZone === zone ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
    strokeWidth: hoveredZone === zone ? 0.8 : 0.3,
  })

  const getLabelStyle = (zone: string) => ({
    fill: hoveredZone === zone ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
    fontWeight: hoveredZone === zone ? 700 : 600,
  })

  return (
    <g>
      <defs>
        <filter id="textShadowL" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodColor="#000" floodOpacity="0.7"/>
        </filter>
      </defs>

      {/* Forehead */}
      <path
        d="M 35 15 Q 50 10, 65 18 L 65 32 Q 50 27, 35 32 Z"
        {...getZoneStyle('frente')}
        strokeDasharray="2,1"
      />
      <text x={50} y={24} textAnchor="middle" fontSize={3} {...getLabelStyle('frente')} filter="url(#textShadowL)">
        FRENTE
      </text>

      {/* Temple */}
      <circle cx={70} cy={35} r={6} {...getZoneStyle('sien_izq')} strokeDasharray="2,1" />
      <text x={70} y={36} textAnchor="middle" fontSize={2.2} {...getLabelStyle('sien_izq')} filter="url(#textShadowL)">
        SIEN
      </text>

      {/* Crow's feet */}
      <circle cx={63} cy={44} r={4} {...getZoneStyle('patas_gallo_izq')} strokeDasharray="2,1" />
      <text x={63} y={45} textAnchor="middle" fontSize={1.8} {...getLabelStyle('patas_gallo_izq')} filter="url(#textShadowL)">
        PATA G.
      </text>

      {/* Nose */}
      <ellipse cx={35} cy={50} rx={7} ry={8} {...getZoneStyle('nariz')} strokeDasharray="2,1" />
      <text x={35} y={51} textAnchor="middle" fontSize={2.2} {...getLabelStyle('nariz')} filter="url(#textShadowL)">
        NARIZ
      </text>

      {/* Cheek */}
      <ellipse cx={55} cy={58} rx={10} ry={12} {...getZoneStyle('mejilla_izq')} strokeDasharray="2,1" />
      <text x={55} y={59} textAnchor="middle" fontSize={2.5} {...getLabelStyle('mejilla_izq')} filter="url(#textShadowL)">
        MEJILLA
      </text>

      {/* Nasolabial */}
      <ellipse cx={40} cy={65} rx={4} ry={7} {...getZoneStyle('surco_nasogeniano_izq')} strokeDasharray="2,1" />
      <text x={40} y={65} textAnchor="middle" fontSize={1.8} {...getLabelStyle('surco_nasogeniano_izq')} filter="url(#textShadowL)">
        SURCO
      </text>

      {/* Lips */}
      <ellipse cx={38} cy={73} rx={6} ry={4} {...getZoneStyle('labio_superior')} strokeDasharray="2,1" />
      <text x={38} y={74} textAnchor="middle" fontSize={1.8} {...getLabelStyle('labio_superior')} filter="url(#textShadowL)">
        LABIOS
      </text>

      {/* Chin */}
      <ellipse cx={40} cy={88} rx={8} ry={6} {...getZoneStyle('menton')} strokeDasharray="2,1" />
      <text x={40} y={89} textAnchor="middle" fontSize={2.5} {...getLabelStyle('menton')} filter="url(#textShadowL)">
        MENTÓN
      </text>

      {/* Jawline */}
      <path
        d="M 48 85 Q 60 92, 75 88"
        fill="none"
        stroke={hoveredZone?.includes('mandibular') ? '#ffffff' : 'rgba(255,255,255,0.5)'}
        strokeWidth={0.8}
        strokeDasharray="2,1"
      />
      <text x={62} y={93} textAnchor="middle" fontSize={2} {...getLabelStyle('linea_mandibular_izq')} filter="url(#textShadowL)">
        MANDÍBULA
      </text>

      {/* Neck */}
      <rect x={50} y={100} width={25} height={20} rx={3} {...getZoneStyle('cuello')} strokeDasharray="2,1" />
      <text x={62} y={112} textAnchor="middle" fontSize={2.5} {...getLabelStyle('cuello')} filter="url(#textShadowL)">
        CUELLO
      </text>
    </g>
  )
}

function RightProfileZoneOverlay({ hoveredZone }: { hoveredZone: string | null }) {
  const getZoneStyle = (zone: string) => ({
    fill: hoveredZone === zone ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)',
    stroke: hoveredZone === zone ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
    strokeWidth: hoveredZone === zone ? 0.8 : 0.3,
  })

  const getLabelStyle = (zone: string) => ({
    fill: hoveredZone === zone ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
    fontWeight: hoveredZone === zone ? 700 : 600,
  })

  return (
    <g>
      <defs>
        <filter id="textShadowR" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodColor="#000" floodOpacity="0.7"/>
        </filter>
      </defs>

      {/* Forehead */}
      <path
        d="M 65 15 Q 50 10, 35 18 L 35 32 Q 50 27, 65 32 Z"
        {...getZoneStyle('frente')}
        strokeDasharray="2,1"
      />
      <text x={50} y={24} textAnchor="middle" fontSize={3} {...getLabelStyle('frente')} filter="url(#textShadowR)">
        FRENTE
      </text>

      {/* Temple */}
      <circle cx={30} cy={35} r={6} {...getZoneStyle('sien_der')} strokeDasharray="2,1" />
      <text x={30} y={36} textAnchor="middle" fontSize={2.2} {...getLabelStyle('sien_der')} filter="url(#textShadowR)">
        SIEN
      </text>

      {/* Crow's feet */}
      <circle cx={37} cy={44} r={4} {...getZoneStyle('patas_gallo_der')} strokeDasharray="2,1" />
      <text x={37} y={45} textAnchor="middle" fontSize={1.8} {...getLabelStyle('patas_gallo_der')} filter="url(#textShadowR)">
        PATA G.
      </text>

      {/* Nose */}
      <ellipse cx={65} cy={50} rx={7} ry={8} {...getZoneStyle('nariz')} strokeDasharray="2,1" />
      <text x={65} y={51} textAnchor="middle" fontSize={2.2} {...getLabelStyle('nariz')} filter="url(#textShadowR)">
        NARIZ
      </text>

      {/* Cheek */}
      <ellipse cx={45} cy={58} rx={10} ry={12} {...getZoneStyle('mejilla_der')} strokeDasharray="2,1" />
      <text x={45} y={59} textAnchor="middle" fontSize={2.5} {...getLabelStyle('mejilla_der')} filter="url(#textShadowR)">
        MEJILLA
      </text>

      {/* Nasolabial */}
      <ellipse cx={60} cy={65} rx={4} ry={7} {...getZoneStyle('surco_nasogeniano_der')} strokeDasharray="2,1" />
      <text x={60} y={65} textAnchor="middle" fontSize={1.8} {...getLabelStyle('surco_nasogeniano_der')} filter="url(#textShadowR)">
        SURCO
      </text>

      {/* Lips */}
      <ellipse cx={62} cy={73} rx={6} ry={4} {...getZoneStyle('labio_superior')} strokeDasharray="2,1" />
      <text x={62} y={74} textAnchor="middle" fontSize={1.8} {...getLabelStyle('labio_superior')} filter="url(#textShadowR)">
        LABIOS
      </text>

      {/* Chin */}
      <ellipse cx={60} cy={88} rx={8} ry={6} {...getZoneStyle('menton')} strokeDasharray="2,1" />
      <text x={60} y={89} textAnchor="middle" fontSize={2.5} {...getLabelStyle('menton')} filter="url(#textShadowR)">
        MENTÓN
      </text>

      {/* Jawline */}
      <path
        d="M 52 85 Q 40 92, 25 88"
        fill="none"
        stroke={hoveredZone?.includes('mandibular') ? '#ffffff' : 'rgba(255,255,255,0.5)'}
        strokeWidth={0.8}
        strokeDasharray="2,1"
      />
      <text x={38} y={93} textAnchor="middle" fontSize={2} {...getLabelStyle('linea_mandibular_der')} filter="url(#textShadowR)">
        MANDÍBULA
      </text>

      {/* Neck */}
      <rect x={25} y={100} width={25} height={20} rx={3} {...getZoneStyle('cuello')} strokeDasharray="2,1" />
      <text x={38} y={112} textAnchor="middle" fontSize={2.5} {...getLabelStyle('cuello')} filter="url(#textShadowR)">
        CUELLO
      </text>
    </g>
  )
}

export default FaceMapSVG
