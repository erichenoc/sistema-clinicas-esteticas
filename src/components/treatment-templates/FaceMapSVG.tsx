'use client'

import { useState, useRef, useCallback } from 'react'
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
}

export function FaceMapSVG({
  view,
  points,
  onPointClick,
  onAddPoint,
  selectedPointId,
  readOnly = false,
  className,
}: FaceMapSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)

  const filteredPoints = points.filter((p) => p.view === view)

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (readOnly || !onAddPoint || !svgRef.current) return

      const svg = svgRef.current
      const rect = svg.getBoundingClientRect()
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

  return (
    <div className={cn('relative aspect-[3/4] bg-muted/30 rounded-lg overflow-hidden', className)}>
      <svg
        ref={svgRef}
        viewBox="0 0 100 133"
        className={cn(
          'w-full h-full',
          !readOnly && 'cursor-crosshair'
        )}
        onClick={handleSvgClick}
      >
        {/* Face outline based on view */}
        {view === 'frontal' && <FrontalFaceSVG />}
        {view === 'left' && <LeftProfileSVG />}
        {view === 'right' && <RightProfileSVG />}

        {/* Injection points */}
        {filteredPoints.map((point) => (
          <g key={point.id}>
            {/* Outer ring for selection */}
            {selectedPointId === point.id && (
              <circle
                cx={point.x}
                cy={point.y}
                r={4}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={1}
                className="animate-pulse"
              />
            )}
            {/* Point marker */}
            <circle
              cx={point.x}
              cy={point.y}
              r={2.5}
              fill={selectedPointId === point.id ? '#3b82f6' : '#ef4444'}
              stroke="white"
              strokeWidth={0.5}
              className={cn(
                'transition-all cursor-pointer',
                hoveredPoint === point.id && 'r-3'
              )}
              onClick={(e) => handlePointClick(e, point)}
              onMouseEnter={() => setHoveredPoint(point.id)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            {/* Label on hover */}
            {hoveredPoint === point.id && (
              <text
                x={point.x}
                y={point.y - 5}
                textAnchor="middle"
                fontSize={3}
                fill="#374151"
                className="pointer-events-none"
              >
                {point.zone}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* View label */}
      <div className="absolute bottom-2 left-2 text-xs font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {view === 'frontal' && 'Vista Frontal'}
        {view === 'left' && 'Perfil Izquierdo'}
        {view === 'right' && 'Perfil Derecho'}
      </div>

      {/* Point count */}
      <div className="absolute top-2 right-2 text-xs font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {filteredPoints.length} punto{filteredPoints.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

// Frontal face SVG paths
function FrontalFaceSVG() {
  return (
    <g stroke="#d1d5db" strokeWidth={0.5} fill="none">
      {/* Face outline */}
      <ellipse cx={50} cy={60} rx={35} ry={45} />

      {/* Hair line */}
      <path d="M 20 35 Q 30 15, 50 12 Q 70 15, 80 35" />

      {/* Left eyebrow */}
      <path d="M 28 45 Q 35 42, 42 45" strokeWidth={0.8} />

      {/* Right eyebrow */}
      <path d="M 58 45 Q 65 42, 72 45" strokeWidth={0.8} />

      {/* Left eye */}
      <ellipse cx={35} cy={52} rx={6} ry={3} />
      <circle cx={35} cy={52} r={1.5} fill="#d1d5db" />

      {/* Right eye */}
      <ellipse cx={65} cy={52} rx={6} ry={3} />
      <circle cx={65} cy={52} r={1.5} fill="#d1d5db" />

      {/* Nose */}
      <path d="M 50 50 L 50 68" />
      <path d="M 45 70 Q 50 73, 55 70" />

      {/* Nasolabial folds */}
      <path d="M 40 70 Q 42 78, 43 82" strokeDasharray="1,1" />
      <path d="M 60 70 Q 58 78, 57 82" strokeDasharray="1,1" />

      {/* Lips */}
      <path d="M 40 85 Q 50 82, 60 85" />
      <path d="M 40 85 Q 50 90, 60 85" />

      {/* Chin */}
      <path d="M 45 95 Q 50 100, 55 95" strokeDasharray="1,1" />

      {/* Jawline markers */}
      <path d="M 20 70 Q 25 90, 35 98" strokeDasharray="1,1" />
      <path d="M 80 70 Q 75 90, 65 98" strokeDasharray="1,1" />

      {/* Ears */}
      <ellipse cx={15} cy={55} rx={4} ry={8} />
      <ellipse cx={85} cy={55} rx={4} ry={8} />

      {/* Neck */}
      <path d="M 35 105 L 35 125" />
      <path d="M 65 105 L 65 125" />
    </g>
  )
}

// Left profile SVG paths
function LeftProfileSVG() {
  return (
    <g stroke="#d1d5db" strokeWidth={0.5} fill="none">
      {/* Head outline - left profile */}
      <path d="M 70 20 Q 30 25, 25 55 Q 20 75, 30 90 Q 40 105, 50 110 L 50 130" />

      {/* Back of head */}
      <path d="M 70 20 Q 85 35, 85 60 Q 85 85, 75 100 L 65 130" />

      {/* Forehead */}
      <path d="M 70 20 L 35 35" strokeDasharray="1,1" />

      {/* Eyebrow */}
      <path d="M 35 43 Q 42 40, 48 43" strokeWidth={0.8} />

      {/* Eye */}
      <path d="M 38 50 Q 45 48, 48 50 Q 45 52, 38 50" />
      <circle cx={43} cy={50} r={1} fill="#d1d5db" />

      {/* Nose */}
      <path d="M 48 50 L 25 65 L 35 70" />

      {/* Nasolabial fold */}
      <path d="M 35 70 Q 38 78, 40 85" strokeDasharray="1,1" />

      {/* Lips */}
      <path d="M 35 85 Q 42 82, 45 85 Q 42 88, 35 85" />

      {/* Chin */}
      <path d="M 35 85 Q 30 95, 35 100" />

      {/* Jaw */}
      <path d="M 35 100 Q 55 105, 75 100" strokeDasharray="1,1" />

      {/* Ear */}
      <ellipse cx={75} cy={55} rx={5} ry={10} />

      {/* Neck */}
      <path d="M 50 110 L 50 130" />
      <path d="M 65 105 L 65 130" />
    </g>
  )
}

// Right profile SVG paths (mirror of left)
function RightProfileSVG() {
  return (
    <g stroke="#d1d5db" strokeWidth={0.5} fill="none" transform="scale(-1, 1) translate(-100, 0)">
      {/* Head outline - right profile (mirrored left) */}
      <path d="M 70 20 Q 30 25, 25 55 Q 20 75, 30 90 Q 40 105, 50 110 L 50 130" />

      {/* Back of head */}
      <path d="M 70 20 Q 85 35, 85 60 Q 85 85, 75 100 L 65 130" />

      {/* Forehead */}
      <path d="M 70 20 L 35 35" strokeDasharray="1,1" />

      {/* Eyebrow */}
      <path d="M 35 43 Q 42 40, 48 43" strokeWidth={0.8} />

      {/* Eye */}
      <path d="M 38 50 Q 45 48, 48 50 Q 45 52, 38 50" />
      <circle cx={43} cy={50} r={1} fill="#d1d5db" />

      {/* Nose */}
      <path d="M 48 50 L 25 65 L 35 70" />

      {/* Nasolabial fold */}
      <path d="M 35 70 Q 38 78, 40 85" strokeDasharray="1,1" />

      {/* Lips */}
      <path d="M 35 85 Q 42 82, 45 85 Q 42 88, 35 85" />

      {/* Chin */}
      <path d="M 35 85 Q 30 95, 35 100" />

      {/* Jaw */}
      <path d="M 35 100 Q 55 105, 75 100" strokeDasharray="1,1" />

      {/* Ear */}
      <ellipse cx={75} cy={55} rx={5} ry={10} />

      {/* Neck */}
      <path d="M 50 110 L 50 130" />
      <path d="M 65 105 L 65 130" />
    </g>
  )
}

export default FaceMapSVG
