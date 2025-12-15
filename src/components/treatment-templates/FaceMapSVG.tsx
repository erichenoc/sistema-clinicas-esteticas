'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { InjectionPoint, FacialZone } from '@/types/treatment-templates'

interface FaceMapSVGProps {
  view: 'frontal' | 'lateral_izq' | 'lateral_der'
  injectionPoints: InjectionPoint[]
  onAddPoint?: (x: number, y: number, zone: FacialZone) => void
  onRemovePoint?: (pointId: string) => void
  onSelectPoint?: (point: InjectionPoint) => void
  selectedPointId?: string | null
  readOnly?: boolean
  className?: string
}

// Colores por tipo de tratamiento
const TREATMENT_COLORS: Record<string, string> = {
  botox: '#8B5CF6', // violet
  relleno_ha: '#3B82F6', // blue
  bioestimulador: '#10B981', // emerald
  hilos_tensores: '#F59E0B', // amber
  default: '#A67C52', // primary
}

export function FaceMapSVG({
  view,
  injectionPoints,
  onAddPoint,
  onRemovePoint,
  onSelectPoint,
  selectedPointId,
  readOnly = false,
  className,
}: FaceMapSVGProps) {
  const [hoveredZone, setHoveredZone] = useState<FacialZone | null>(null)

  // Filtrar puntos por vista
  const visiblePoints = injectionPoints.filter((p) => p.view === view)

  // Manejar clic en el SVG
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || !onAddPoint) return

    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Determinar la zona basada en la posición
    const zone = getZoneFromPosition(x, y, view)
    if (zone) {
      onAddPoint(x, y, zone)
    }
  }

  // Renderizar vista frontal
  const renderFrontalView = () => (
    <g>
      {/* Contorno de la cara */}
      <ellipse
        cx="50"
        cy="45"
        rx="35"
        ry="42"
        fill="#FDE8D4"
        stroke="#D4A574"
        strokeWidth="1"
      />

      {/* Cabello (simplificado) */}
      <path
        d="M 15 30 Q 15 5, 50 5 Q 85 5, 85 30"
        fill="#2D1B0E"
        stroke="#1A0F08"
        strokeWidth="0.5"
      />

      {/* Frente - zona interactiva */}
      <ellipse
        cx="50"
        cy="22"
        rx="20"
        ry="10"
        fill={hoveredZone === 'frente' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        stroke="none"
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('frente')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Cejas */}
      <path d="M 30 32 Q 40 28, 45 31" fill="none" stroke="#3D2914" strokeWidth="1.5" />
      <path d="M 55 31 Q 60 28, 70 32" fill="none" stroke="#3D2914" strokeWidth="1.5" />

      {/* Entrecejo - zona interactiva */}
      <rect
        x="45"
        y="28"
        width="10"
        height="8"
        fill={hoveredZone === 'entrecejo' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('entrecejo')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Ojos */}
      <ellipse cx="35" cy="38" rx="8" ry="4" fill="white" stroke="#3D2914" strokeWidth="0.5" />
      <ellipse cx="65" cy="38" rx="8" ry="4" fill="white" stroke="#3D2914" strokeWidth="0.5" />
      <circle cx="35" cy="38" r="3" fill="#3D2914" />
      <circle cx="65" cy="38" r="3" fill="#3D2914" />

      {/* Patas de gallo - zonas interactivas */}
      <circle
        cx="22"
        cy="38"
        r="6"
        fill={hoveredZone === 'patas_gallo_izq' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('patas_gallo_izq')}
        onMouseLeave={() => setHoveredZone(null)}
      />
      <circle
        cx="78"
        cy="38"
        r="6"
        fill={hoveredZone === 'patas_gallo_der' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('patas_gallo_der')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Nariz */}
      <path
        d="M 50 38 L 50 52 L 45 56 Q 50 58, 55 56 L 50 52"
        fill="none"
        stroke="#D4A574"
        strokeWidth="1"
      />

      {/* Nariz - zona interactiva */}
      <ellipse
        cx="50"
        cy="50"
        rx="6"
        ry="10"
        fill={hoveredZone === 'nariz' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('nariz')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Pómulos - zonas interactivas */}
      <ellipse
        cx="28"
        cy="50"
        rx="8"
        ry="6"
        fill={hoveredZone === 'pomulo_izq' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('pomulo_izq')}
        onMouseLeave={() => setHoveredZone(null)}
      />
      <ellipse
        cx="72"
        cy="50"
        rx="8"
        ry="6"
        fill={hoveredZone === 'pomulo_der' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('pomulo_der')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Surcos nasogenianos - zonas interactivas */}
      <path d="M 45 56 Q 42 62, 40 68" fill="none" stroke="#D4A574" strokeWidth="0.5" />
      <path d="M 55 56 Q 58 62, 60 68" fill="none" stroke="#D4A574" strokeWidth="0.5" />
      <ellipse
        cx="40"
        cy="62"
        rx="4"
        ry="8"
        fill={hoveredZone === 'surco_nasogeniano_izq' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('surco_nasogeniano_izq')}
        onMouseLeave={() => setHoveredZone(null)}
      />
      <ellipse
        cx="60"
        cy="62"
        rx="4"
        ry="8"
        fill={hoveredZone === 'surco_nasogeniano_der' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('surco_nasogeniano_der')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Labios */}
      <path
        d="M 42 65 Q 50 62, 58 65"
        fill="#E8A0A0"
        stroke="#C08080"
        strokeWidth="0.5"
      />
      <path
        d="M 42 65 Q 50 70, 58 65"
        fill="#D88888"
        stroke="#C08080"
        strokeWidth="0.5"
      />

      {/* Labio superior - zona interactiva */}
      <ellipse
        cx="50"
        cy="63"
        rx="10"
        ry="4"
        fill={hoveredZone === 'labio_superior' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('labio_superior')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Labio inferior - zona interactiva */}
      <ellipse
        cx="50"
        cy="68"
        rx="8"
        ry="4"
        fill={hoveredZone === 'labio_inferior' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('labio_inferior')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Comisuras - zonas interactivas */}
      <circle
        cx="40"
        cy="66"
        r="3"
        fill={hoveredZone === 'comisuras' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('comisuras')}
        onMouseLeave={() => setHoveredZone(null)}
      />
      <circle
        cx="60"
        cy="66"
        r="3"
        fill={hoveredZone === 'comisuras' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('comisuras')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Mentón - zona interactiva */}
      <ellipse
        cx="50"
        cy="78"
        rx="12"
        ry="8"
        fill={hoveredZone === 'menton' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('menton')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Línea mandibular - zonas interactivas */}
      <path d="M 20 55 Q 25 75, 38 82" fill="none" stroke="#D4A574" strokeWidth="0.5" />
      <path d="M 80 55 Q 75 75, 62 82" fill="none" stroke="#D4A574" strokeWidth="0.5" />
      <ellipse
        cx="28"
        cy="72"
        rx="6"
        ry="10"
        fill={hoveredZone === 'linea_mandibular_izq' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        transform="rotate(-20 28 72)"
        onMouseEnter={() => setHoveredZone('linea_mandibular_izq')}
        onMouseLeave={() => setHoveredZone(null)}
      />
      <ellipse
        cx="72"
        cy="72"
        rx="6"
        ry="10"
        fill={hoveredZone === 'linea_mandibular_der' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        transform="rotate(20 72 72)"
        onMouseEnter={() => setHoveredZone('linea_mandibular_der')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Sienes - zonas interactivas */}
      <circle
        cx="18"
        cy="28"
        r="6"
        fill={hoveredZone === 'sien_izq' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('sien_izq')}
        onMouseLeave={() => setHoveredZone(null)}
      />
      <circle
        cx="82"
        cy="28"
        r="6"
        fill={hoveredZone === 'sien_der' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('sien_der')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Cuello */}
      <rect x="40" y="85" width="20" height="15" fill="#FDE8D4" stroke="#D4A574" strokeWidth="0.5" />

      {/* Cuello - zona interactiva */}
      <rect
        x="35"
        y="88"
        width="30"
        height="10"
        fill={hoveredZone === 'cuello' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('cuello')}
        onMouseLeave={() => setHoveredZone(null)}
      />
    </g>
  )

  // Renderizar vista lateral
  const renderLateralView = (isLeft: boolean) => (
    <g transform={isLeft ? '' : 'scale(-1, 1) translate(-100, 0)'}>
      {/* Contorno de la cabeza - perfil */}
      <path
        d="M 70 10
           Q 85 15, 85 35
           Q 85 50, 80 60
           L 75 70
           Q 70 78, 60 82
           L 55 85
           L 55 95
           L 45 95
           L 45 82
           Q 35 78, 30 70
           Q 25 60, 25 50
           Q 25 35, 35 20
           Q 45 10, 70 10
           Z"
        fill="#FDE8D4"
        stroke="#D4A574"
        strokeWidth="1"
      />

      {/* Cabello */}
      <path
        d="M 70 10
           Q 85 15, 85 35
           Q 85 30, 75 20
           Q 60 10, 45 12
           Q 35 15, 30 25
           Q 25 30, 25 40
           L 28 35
           Q 30 20, 50 12
           Q 65 8, 70 10
           Z"
        fill="#2D1B0E"
        stroke="#1A0F08"
        strokeWidth="0.5"
      />

      {/* Frente - zona interactiva */}
      <ellipse
        cx="55"
        cy="25"
        rx="12"
        ry="10"
        fill={hoveredZone === 'frente' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('frente')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Ceja */}
      <path d="M 45 35 Q 55 32, 62 35" fill="none" stroke="#3D2914" strokeWidth="1.5" />

      {/* Ojo */}
      <ellipse cx="52" cy="40" rx="6" ry="3" fill="white" stroke="#3D2914" strokeWidth="0.5" />
      <circle cx="54" cy="40" r="2" fill="#3D2914" />

      {/* Sien - zona interactiva */}
      <circle
        cx="68"
        cy="35"
        r="6"
        fill={hoveredZone === (isLeft ? 'sien_izq' : 'sien_der') ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone(isLeft ? 'sien_izq' : 'sien_der')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Pómulo - zona interactiva */}
      <ellipse
        cx="58"
        cy="52"
        rx="8"
        ry="6"
        fill={hoveredZone === (isLeft ? 'pomulo_izq' : 'pomulo_der') ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone(isLeft ? 'pomulo_izq' : 'pomulo_der')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Nariz */}
      <path
        d="M 48 38 L 42 50 L 38 55 Q 42 58, 48 55"
        fill="none"
        stroke="#D4A574"
        strokeWidth="1"
      />

      {/* Nariz - zona interactiva */}
      <ellipse
        cx="42"
        cy="50"
        rx="6"
        ry="8"
        fill={hoveredZone === 'nariz' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('nariz')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Surco nasogeniano - zona interactiva */}
      <path d="M 42 58 Q 40 65, 38 70" fill="none" stroke="#D4A574" strokeWidth="0.5" />
      <ellipse
        cx="40"
        cy="64"
        rx="4"
        ry="6"
        fill={hoveredZone === (isLeft ? 'surco_nasogeniano_izq' : 'surco_nasogeniano_der') ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone(isLeft ? 'surco_nasogeniano_izq' : 'surco_nasogeniano_der')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Labios */}
      <path d="M 36 65 L 42 65 Q 44 68, 42 70 L 36 70" fill="#E8A0A0" stroke="#C08080" strokeWidth="0.5" />

      {/* Labio superior - zona interactiva */}
      <rect
        x="34"
        y="62"
        width="12"
        height="5"
        fill={hoveredZone === 'labio_superior' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('labio_superior')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Labio inferior - zona interactiva */}
      <rect
        x="34"
        y="68"
        width="12"
        height="5"
        fill={hoveredZone === 'labio_inferior' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('labio_inferior')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Mentón - zona interactiva */}
      <ellipse
        cx="40"
        cy="78"
        rx="8"
        ry="6"
        fill={hoveredZone === 'menton' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('menton')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Línea mandibular - zona interactiva */}
      <ellipse
        cx="55"
        cy="72"
        rx="6"
        ry="10"
        fill={hoveredZone === (isLeft ? 'linea_mandibular_izq' : 'linea_mandibular_der') ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        transform="rotate(-30 55 72)"
        onMouseEnter={() => setHoveredZone(isLeft ? 'linea_mandibular_izq' : 'linea_mandibular_der')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Cuello */}
      <path d="M 45 82 L 45 95 L 55 95 L 55 85" fill="#FDE8D4" stroke="#D4A574" strokeWidth="0.5" />

      {/* Cuello - zona interactiva */}
      <rect
        x="43"
        y="85"
        width="15"
        height="10"
        fill={hoveredZone === 'cuello' ? 'rgba(166, 124, 82, 0.3)' : 'transparent'}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredZone('cuello')}
        onMouseLeave={() => setHoveredZone(null)}
      />

      {/* Oreja */}
      <ellipse cx="72" cy="45" rx="5" ry="10" fill="#FDE8D4" stroke="#D4A574" strokeWidth="0.5" />
    </g>
  )

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        onClick={handleSvgClick}
        style={{ cursor: readOnly ? 'default' : 'crosshair' }}
      >
        {/* Fondo */}
        <rect width="100" height="100" fill="#F8F8F8" />

        {/* Renderizar la vista apropiada */}
        {view === 'frontal' && renderFrontalView()}
        {view === 'lateral_izq' && renderLateralView(true)}
        {view === 'lateral_der' && renderLateralView(false)}

        {/* Renderizar puntos de inyección */}
        {visiblePoints.map((point, index) => (
          <g key={point.id}>
            {/* Círculo del punto */}
            <circle
              cx={point.x}
              cy={point.y}
              r={selectedPointId === point.id ? 3.5 : 2.5}
              fill={TREATMENT_COLORS[point.product] || TREATMENT_COLORS.default}
              stroke={selectedPointId === point.id ? '#000' : '#fff'}
              strokeWidth={selectedPointId === point.id ? 1 : 0.5}
              className={cn(
                'transition-all',
                !readOnly && 'cursor-pointer hover:r-4'
              )}
              onClick={(e) => {
                e.stopPropagation()
                if (onSelectPoint) onSelectPoint(point)
              }}
            />
            {/* Número del punto */}
            <text
              x={point.x}
              y={point.y + 0.8}
              fontSize="2.5"
              fill="#fff"
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none font-bold"
            >
              {index + 1}
            </text>
          </g>
        ))}

        {/* Indicador de zona hovereada */}
        {hoveredZone && !readOnly && (
          <text
            x="50"
            y="98"
            fontSize="3"
            fill="#666"
            textAnchor="middle"
            className="pointer-events-none"
          >
            {getZoneLabel(hoveredZone)}
          </text>
        )}
      </svg>

      {/* Leyenda de colores */}
      {!readOnly && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 p-1 bg-white/80 text-[8px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: TREATMENT_COLORS.botox }} />
            Botox
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: TREATMENT_COLORS.relleno_ha }} />
            Relleno
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: TREATMENT_COLORS.bioestimulador }} />
            Bioest.
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: TREATMENT_COLORS.hilos_tensores }} />
            Hilos
          </span>
        </div>
      )}
    </div>
  )
}

// Obtener zona basada en posición (simplificado)
function getZoneFromPosition(
  x: number,
  y: number,
  view: 'frontal' | 'lateral_izq' | 'lateral_der'
): FacialZone | null {
  if (view === 'frontal') {
    // Frente
    if (y >= 12 && y <= 32 && x >= 30 && x <= 70) return 'frente'
    // Entrecejo
    if (y >= 28 && y <= 36 && x >= 45 && x <= 55) return 'entrecejo'
    // Sienes
    if (y >= 22 && y <= 34 && x <= 24) return 'sien_izq'
    if (y >= 22 && y <= 34 && x >= 76) return 'sien_der'
    // Patas de gallo
    if (y >= 32 && y <= 44 && x <= 28) return 'patas_gallo_izq'
    if (y >= 32 && y <= 44 && x >= 72) return 'patas_gallo_der'
    // Nariz
    if (y >= 40 && y <= 60 && x >= 44 && x <= 56) return 'nariz'
    // Pómulos
    if (y >= 44 && y <= 56 && x >= 20 && x <= 36) return 'pomulo_izq'
    if (y >= 44 && y <= 56 && x >= 64 && x <= 80) return 'pomulo_der'
    // Surcos nasogenianos
    if (y >= 54 && y <= 70 && x >= 36 && x <= 44) return 'surco_nasogeniano_izq'
    if (y >= 54 && y <= 70 && x >= 56 && x <= 64) return 'surco_nasogeniano_der'
    // Labio superior
    if (y >= 60 && y <= 66 && x >= 40 && x <= 60) return 'labio_superior'
    // Labio inferior
    if (y >= 66 && y <= 72 && x >= 42 && x <= 58) return 'labio_inferior'
    // Comisuras
    if (y >= 63 && y <= 69 && (x >= 37 && x <= 43 || x >= 57 && x <= 63)) return 'comisuras'
    // Mentón
    if (y >= 70 && y <= 86 && x >= 38 && x <= 62) return 'menton'
    // Línea mandibular
    if (y >= 62 && y <= 82 && x >= 22 && x <= 34) return 'linea_mandibular_izq'
    if (y >= 62 && y <= 82 && x >= 66 && x <= 78) return 'linea_mandibular_der'
    // Cuello
    if (y >= 85 && x >= 35 && x <= 65) return 'cuello'
  }

  // Para vistas laterales, simplificamos
  if (view === 'lateral_izq' || view === 'lateral_der') {
    if (y <= 35) return 'frente'
    if (y >= 35 && y <= 48) return view === 'lateral_izq' ? 'sien_izq' : 'sien_der'
    if (y >= 45 && y <= 58) return view === 'lateral_izq' ? 'pomulo_izq' : 'pomulo_der'
    if (y >= 58 && y <= 68) return 'labio_superior'
    if (y >= 68 && y <= 78) return 'menton'
    if (y >= 78) return 'cuello'
  }

  return null
}

// Obtener etiqueta de zona
function getZoneLabel(zone: FacialZone): string {
  const labels: Record<FacialZone, string> = {
    frente: 'Frente',
    entrecejo: 'Entrecejo (Glabela)',
    patas_gallo_izq: 'Patas de Gallo Izq.',
    patas_gallo_der: 'Patas de Gallo Der.',
    nariz: 'Nariz',
    pomulo_izq: 'Pómulo Izquierdo',
    pomulo_der: 'Pómulo Derecho',
    surco_nasogeniano_izq: 'Surco Nasogeniano Izq.',
    surco_nasogeniano_der: 'Surco Nasogeniano Der.',
    labio_superior: 'Labio Superior',
    labio_inferior: 'Labio Inferior',
    comisuras: 'Comisuras Labiales',
    menton: 'Mentón',
    linea_mandibular_izq: 'Línea Mandibular Izq.',
    linea_mandibular_der: 'Línea Mandibular Der.',
    cuello: 'Cuello',
    sien_izq: 'Sien Izquierda',
    sien_der: 'Sien Derecha',
  }
  return labels[zone] || zone
}

export default FaceMapSVG
