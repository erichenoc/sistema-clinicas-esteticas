'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { InjectionPoint } from '@/types/treatment-templates'
import { POINT_COLORS } from './constants'

interface InjectionPoints3DProps {
  points: InjectionPoint[]
  selectedPointId?: string | null
  onPointClick?: (point: InjectionPoint) => void
}

// Individual injection point marker
function PointMarker({
  point,
  index,
  isSelected,
  onClick,
}: {
  point: InjectionPoint
  index: number
  isSelected: boolean
  onClick?: (point: InjectionPoint) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isHovered, setIsHovered] = useState(false)
  const pulseRef = useRef(0)

  // Animate selected point with pulsing effect
  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected) {
        pulseRef.current += 0.05
        const scale = 1 + Math.sin(pulseRef.current) * 0.2
        meshRef.current.scale.set(scale, scale, scale)
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
      }
    }
  })

  const color = isSelected
    ? POINT_COLORS.selected
    : isHovered
    ? POINT_COLORS.selected
    : POINT_COLORS.current

  return (
    <group position={[point.position3D.x, point.position3D.y, point.position3D.z]}>
      {/* Main point sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(point)
        }}
        onPointerEnter={(e) => {
          e.stopPropagation()
          setIsHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          setIsHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.5 : 0.2}
        />
      </mesh>

      {/* Point number label */}
      <Html
        position={[0.04, 0.04, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`
            px-1.5 py-0.5 rounded-full text-xs font-bold
            ${isSelected ? 'bg-blue-500' : 'bg-red-500'} text-white
            shadow-md
          `}
        >
          {index + 1}
        </div>
      </Html>

      {/* Tooltip on hover */}
      {isHovered && (
        <Html position={[0, 0.08, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-lg">
            <div className="font-semibold">{point.product}</div>
            <div className="text-gray-300">{point.dose}</div>
            <div className="text-gray-400">{point.technique}</div>
          </div>
        </Html>
      )}

      {/* Outer ring for selected point */}
      {isSelected && (
        <mesh>
          <ringGeometry args={[0.035, 0.045, 32]} />
          <meshBasicMaterial color={POINT_COLORS.selected} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  )
}

export function InjectionPoints3D({
  points,
  selectedPointId,
  onPointClick,
}: InjectionPoints3DProps) {
  return (
    <group>
      {points.map((point, index) => (
        <PointMarker
          key={point.id}
          point={point}
          index={index}
          isSelected={selectedPointId === point.id}
          onClick={onPointClick}
        />
      ))}
    </group>
  )
}

export default InjectionPoints3D
