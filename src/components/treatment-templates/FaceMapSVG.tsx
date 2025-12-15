'use client'

import { useRef, useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import type { FaceView, InjectionPoint } from '@/types/treatment-templates'

interface FaceMapSVGProps {
  view: FaceView
  points: InjectionPoint[]
  onPointClick?: (point: InjectionPoint) => void
  onAddPoint?: (x: number, y: number, view: FaceView) => void
  selectedPointId?: string | null
  readOnly?: boolean
  className?: string
  gender?: 'male' | 'female'
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
}: FaceMapSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageError, setImageError] = useState(false)

  const filteredPoints = points.filter((p) => p.view === view)

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (readOnly || !onAddPoint || !containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()

      // Calculate position as percentage
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      onAddPoint(x, y, view)
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

  // Get image URL based on view and gender
  const getImageUrl = () => {
    // Using high-quality medical illustration style images
    // These are placeholder URLs - in production you would use actual image assets
    const baseUrl = 'https://images.unsplash.com/photo-'

    if (gender === 'female') {
      switch (view) {
        case 'frontal':
          return `${baseUrl}1531746020798-e6953c6306f4?w=400&h=500&fit=crop&crop=face` // Woman frontal
        case 'left':
          return `${baseUrl}1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face` // Woman profile
        case 'right':
          return `${baseUrl}1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face&flip=h`
      }
    } else {
      switch (view) {
        case 'frontal':
          return `${baseUrl}1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face` // Man frontal
        case 'left':
          return `${baseUrl}1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face` // Man profile
        case 'right':
          return `${baseUrl}1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face&flip=h`
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl overflow-hidden border-2 border-slate-300 shadow-lg',
        !readOnly && 'cursor-crosshair',
        className
      )}
      onClick={handleClick}
      style={{ minHeight: '350px', aspectRatio: '3/4' }}
    >
      {/* Background image or SVG fallback */}
      {!imageError ? (
        <img
          src={getImageUrl()}
          alt={`Vista ${view} - ${gender === 'female' ? 'Mujer' : 'Hombre'}`}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          onError={() => setImageError(true)}
        />
      ) : null}

      {/* Always show SVG overlay with zones */}
      <svg
        viewBox="0 0 100 133"
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        {view === 'frontal' && <FrontalZones />}
        {view === 'left' && <LeftProfileZones />}
        {view === 'right' && <RightProfileZones />}
      </svg>

      {/* Injection points */}
      {filteredPoints.map((point, index) => (
        <div
          key={point.id}
          className={cn(
            'absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200',
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

      {/* Gender indicator */}
      <div className="absolute top-3 left-3 text-xs font-medium text-slate-600 bg-white/95 px-2 py-1 rounded-full shadow-md backdrop-blur-sm">
        {gender === 'female' ? 'Mujer' : 'Hombre'}
      </div>

      {/* Instructions */}
      {!readOnly && filteredPoints.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 text-white px-5 py-3 rounded-xl text-sm font-medium shadow-xl">
            Haz clic para agregar punto de inyeccion
          </div>
        </div>
      )}
    </div>
  )
}

// SVG Zone overlays - These show the injection zones on top of any image
function FrontalZones() {
  return (
    <g>
      {/* Forehead zone */}
      <rect x={25} y={8} width={50} height={18} rx={3} fill="rgba(251, 191, 36, 0.2)" stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={50} y={19} textAnchor="middle" fontSize={3.5} fill="#92400e" fontWeight="600">FRENTE</text>

      {/* Glabella zone */}
      <rect x={42} y={28} width={16} height={10} rx={2} fill="rgba(251, 191, 36, 0.2)" stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={50} y={35} textAnchor="middle" fontSize={2.5} fill="#92400e">ENTRECEJO</text>

      {/* Left crow's feet */}
      <circle cx={22} cy={42} r={6} fill="rgba(251, 191, 36, 0.2)" stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={22} y={43} textAnchor="middle" fontSize={2} fill="#92400e">PATA</text>
      <text x={22} y={46} textAnchor="middle" fontSize={2} fill="#92400e">GALLO</text>

      {/* Right crow's feet */}
      <circle cx={78} cy={42} r={6} fill="rgba(251, 191, 36, 0.2)" stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={78} y={43} textAnchor="middle" fontSize={2} fill="#92400e">PATA</text>
      <text x={78} y={46} textAnchor="middle" fontSize={2} fill="#92400e">GALLO</text>

      {/* Left temple */}
      <circle cx={18} cy={32} r={5} fill="rgba(147, 197, 253, 0.2)" stroke="#3b82f6" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={18} y={33} textAnchor="middle" fontSize={2} fill="#1e40af">SIEN</text>

      {/* Right temple */}
      <circle cx={82} cy={32} r={5} fill="rgba(147, 197, 253, 0.2)" stroke="#3b82f6" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={82} y={33} textAnchor="middle" fontSize={2} fill="#1e40af">SIEN</text>

      {/* Left nasolabial */}
      <ellipse cx={35} cy={62} rx={5} ry={8} fill="rgba(167, 243, 208, 0.2)" stroke="#10b981" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={35} y={61} textAnchor="middle" fontSize={2} fill="#047857">SURCO</text>
      <text x={35} y={64} textAnchor="middle" fontSize={2} fill="#047857">NASOG.</text>

      {/* Right nasolabial */}
      <ellipse cx={65} cy={62} rx={5} ry={8} fill="rgba(167, 243, 208, 0.2)" stroke="#10b981" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={65} y={61} textAnchor="middle" fontSize={2} fill="#047857">SURCO</text>
      <text x={65} y={64} textAnchor="middle" fontSize={2} fill="#047857">NASOG.</text>

      {/* Left cheek */}
      <ellipse cx={28} cy={55} rx={7} ry={9} fill="rgba(253, 186, 186, 0.2)" stroke="#f87171" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={28} y={56} textAnchor="middle" fontSize={2.5} fill="#b91c1c">MEJILLA</text>

      {/* Right cheek */}
      <ellipse cx={72} cy={55} rx={7} ry={9} fill="rgba(253, 186, 186, 0.2)" stroke="#f87171" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={72} y={56} textAnchor="middle" fontSize={2.5} fill="#b91c1c">MEJILLA</text>

      {/* Lips zone */}
      <ellipse cx={50} cy={73} rx={12} ry={5} fill="rgba(251, 207, 232, 0.3)" stroke="#ec4899" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={50} y={74} textAnchor="middle" fontSize={2.5} fill="#be185d">LABIOS</text>

      {/* Marionette lines */}
      <ellipse cx={38} cy={80} rx={4} ry={5} fill="rgba(196, 181, 253, 0.2)" stroke="#8b5cf6" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={38} y={80} textAnchor="middle" fontSize={1.8} fill="#6d28d9">MARIONET</text>

      <ellipse cx={62} cy={80} rx={4} ry={5} fill="rgba(196, 181, 253, 0.2)" stroke="#8b5cf6" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={62} y={80} textAnchor="middle" fontSize={1.8} fill="#6d28d9">MARIONET</text>

      {/* Chin */}
      <ellipse cx={50} cy={90} rx={10} ry={6} fill="rgba(251, 191, 36, 0.2)" stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={50} y={91} textAnchor="middle" fontSize={2.5} fill="#92400e">MENTON</text>

      {/* Jawline left */}
      <path d="M 18 70 Q 20 85, 30 95" fill="none" stroke="#f59e0b" strokeWidth={0.5} strokeDasharray="2,1" />
      <text x={20} y={85} textAnchor="middle" fontSize={2} fill="#92400e" transform="rotate(-45 20 85)">MANDIB.</text>

      {/* Jawline right */}
      <path d="M 82 70 Q 80 85, 70 95" fill="none" stroke="#f59e0b" strokeWidth={0.5} strokeDasharray="2,1" />
      <text x={80} y={85} textAnchor="middle" fontSize={2} fill="#92400e" transform="rotate(45 80 85)">MANDIB.</text>

      {/* Neck */}
      <rect x={35} y={100} width={30} height={20} rx={3} fill="rgba(209, 213, 219, 0.2)" stroke="#6b7280" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={50} y={112} textAnchor="middle" fontSize={3} fill="#374151">CUELLO</text>
    </g>
  )
}

function LeftProfileZones() {
  return (
    <g>
      {/* Forehead */}
      <path d="M 35 15 Q 50 10, 65 18 L 65 30 Q 50 25, 35 30 Z" fill="rgba(251, 191, 36, 0.2)" stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={50} y={23} textAnchor="middle" fontSize={3} fill="#92400e">FRENTE</text>

      {/* Temple */}
      <circle cx={70} cy={35} r={7} fill="rgba(147, 197, 253, 0.2)" stroke="#3b82f6" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={70} y={36} textAnchor="middle" fontSize={2.5} fill="#1e40af">SIEN</text>

      {/* Crow's feet */}
      <circle cx={62} cy={45} r={5} fill="rgba(251, 191, 36, 0.2)" stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={62} y={46} textAnchor="middle" fontSize={2} fill="#92400e">PATA G.</text>

      {/* Cheek */}
      <ellipse cx={55} cy={58} rx={10} ry={12} fill="rgba(253, 186, 186, 0.2)" stroke="#f87171" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={55} y={59} textAnchor="middle" fontSize={2.5} fill="#b91c1c">MEJILLA</text>

      {/* Nasolabial */}
      <ellipse cx={40} cy={65} rx={5} ry={8} fill="rgba(167, 243, 208, 0.2)" stroke="#10b981" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={40} y={65} textAnchor="middle" fontSize={2} fill="#047857">SURCO</text>

      {/* Lips */}
      <ellipse cx={35} cy={75} rx={8} ry={4} fill="rgba(251, 207, 232, 0.3)" stroke="#ec4899" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={35} y={76} textAnchor="middle" fontSize={2} fill="#be185d">LABIOS</text>

      {/* Chin */}
      <ellipse cx={40} cy={88} rx={8} ry={6} fill="rgba(251, 191, 36, 0.2)" stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={40} y={89} textAnchor="middle" fontSize={2.5} fill="#92400e">MENTON</text>

      {/* Jawline */}
      <path d="M 50 85 Q 60 92, 75 90" fill="none" stroke="#f59e0b" strokeWidth={0.5} strokeDasharray="2,1" />
      <text x={62} y={92} textAnchor="middle" fontSize={2} fill="#92400e">MANDIBULA</text>

      {/* Neck */}
      <rect x={50} y={100} width={25} height={20} rx={3} fill="rgba(209, 213, 219, 0.2)" stroke="#6b7280" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={62} y={112} textAnchor="middle" fontSize={2.5} fill="#374151">CUELLO</text>
    </g>
  )
}

function RightProfileZones() {
  return (
    <g>
      {/* Forehead */}
      <path d="M 65 15 Q 50 10, 35 18 L 35 30 Q 50 25, 65 30 Z" fill="rgba(251, 191, 36, 0.2)" stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={50} y={23} textAnchor="middle" fontSize={3} fill="#92400e">FRENTE</text>

      {/* Temple */}
      <circle cx={30} cy={35} r={7} fill="rgba(147, 197, 253, 0.2)" stroke="#3b82f6" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={30} y={36} textAnchor="middle" fontSize={2.5} fill="#1e40af">SIEN</text>

      {/* Crow's feet */}
      <circle cx={38} cy={45} r={5} fill="rgba(251, 191, 36, 0.2)" stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={38} y={46} textAnchor="middle" fontSize={2} fill="#92400e">PATA G.</text>

      {/* Cheek */}
      <ellipse cx={45} cy={58} rx={10} ry={12} fill="rgba(253, 186, 186, 0.2)" stroke="#f87171" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={45} y={59} textAnchor="middle" fontSize={2.5} fill="#b91c1c">MEJILLA</text>

      {/* Nasolabial */}
      <ellipse cx={60} cy={65} rx={5} ry={8} fill="rgba(167, 243, 208, 0.2)" stroke="#10b981" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={60} y={65} textAnchor="middle" fontSize={2} fill="#047857">SURCO</text>

      {/* Lips */}
      <ellipse cx={65} cy={75} rx={8} ry={4} fill="rgba(251, 207, 232, 0.3)" stroke="#ec4899" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={65} y={76} textAnchor="middle" fontSize={2} fill="#be185d">LABIOS</text>

      {/* Chin */}
      <ellipse cx={60} cy={88} rx={8} ry={6} fill="rgba(251, 191, 36, 0.2)" stroke="#f59e0b" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={60} y={89} textAnchor="middle" fontSize={2.5} fill="#92400e">MENTON</text>

      {/* Jawline */}
      <path d="M 50 85 Q 40 92, 25 90" fill="none" stroke="#f59e0b" strokeWidth={0.5} strokeDasharray="2,1" />
      <text x={38} y={92} textAnchor="middle" fontSize={2} fill="#92400e">MANDIBULA</text>

      {/* Neck */}
      <rect x={25} y={100} width={25} height={20} rx={3} fill="rgba(209, 213, 219, 0.2)" stroke="#6b7280" strokeWidth={0.3} strokeDasharray="2,1" />
      <text x={38} y={112} textAnchor="middle" fontSize={2.5} fill="#374151">CUELLO</text>
    </g>
  )
}

export default FaceMapSVG
