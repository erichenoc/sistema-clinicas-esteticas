'use client'

import { useState, useMemo } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { InjectionPoint } from '@/types/treatment-templates'
import { POINT_COLORS } from './constants'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface HistoryPoints3DProps {
  points: InjectionPoint[]
}

// Group points by session
function groupBySession(points: InjectionPoint[]): Map<string, InjectionPoint[]> {
  const groups = new Map<string, InjectionPoint[]>()

  for (const point of points) {
    const sessionId = point.sessionId || 'unknown'
    const existing = groups.get(sessionId) || []
    existing.push(point)
    groups.set(sessionId, existing)
  }

  return groups
}

// Individual history point marker
function HistoryPointMarker({
  point,
  sessionColor,
}: {
  point: InjectionPoint
  sessionColor: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  const formattedDate = point.sessionDate
    ? format(new Date(point.sessionDate), "d 'de' MMMM, yyyy", { locale: es })
    : 'Fecha desconocida'

  return (
    <group position={[point.position3D.x, point.position3D.y, point.position3D.z]}>
      {/* History point sphere - smaller and more transparent */}
      <mesh
        onPointerEnter={(e) => {
          e.stopPropagation()
          setIsHovered(true)
        }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          setIsHovered(false)
        }}
      >
        <sphereGeometry args={[0.015, 12, 12]} />
        <meshStandardMaterial
          color={sessionColor}
          transparent
          opacity={isHovered ? 0.9 : 0.5}
        />
      </mesh>

      {/* Tooltip on hover showing session info */}
      {isHovered && (
        <Html position={[0, 0.06, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-gray-800/95 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-lg border border-gray-600">
            <div className="text-gray-400 text-[10px] mb-1">Sesion anterior</div>
            <div className="font-semibold">{point.product}</div>
            <div className="text-gray-300">{point.dose}</div>
            <div className="text-gray-400 mt-1 text-[10px]">{formattedDate}</div>
          </div>
        </Html>
      )}
    </group>
  )
}

// Session group with connecting lines
function SessionGroup({
  sessionId,
  points,
  colorIndex,
}: {
  sessionId: string
  points: InjectionPoint[]
  colorIndex: number
}) {
  // Generate different colors for different sessions
  const sessionColors = [
    '#6b7280', // gray
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#f59e0b', // amber
    '#10b981', // emerald
  ]

  const color = sessionColors[colorIndex % sessionColors.length]

  return (
    <group>
      {points.map((point, index) => (
        <HistoryPointMarker
          key={`${sessionId}-${point.id}-${index}`}
          point={point}
          sessionColor={color}
        />
      ))}
    </group>
  )
}

export function HistoryPoints3D({ points }: HistoryPoints3DProps) {
  const sessionGroups = useMemo(() => groupBySession(points), [points])

  if (points.length === 0) return null

  return (
    <group>
      {Array.from(sessionGroups.entries()).map(([sessionId, sessionPoints], index) => (
        <SessionGroup
          key={sessionId}
          sessionId={sessionId}
          points={sessionPoints}
          colorIndex={index}
        />
      ))}
    </group>
  )
}

export default HistoryPoints3D
