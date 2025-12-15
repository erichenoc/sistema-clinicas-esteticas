'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { InjectionZone } from '@/types/treatment-templates'
import { FACIAL_ZONES_3D, ZONE_COLORS } from './constants'

interface FacialZones3DProps {
  hoveredZone: InjectionZone | null
  onZoneHover: (zone: InjectionZone | null) => void
  readOnly?: boolean
}

// Individual zone sphere component
function ZoneSphere({
  zone,
  isHovered,
  onHover,
  readOnly,
}: {
  zone: (typeof FACIAL_ZONES_3D)[0]
  isHovered: boolean
  onHover: (zone: InjectionZone | null) => void
  readOnly?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [localHover, setLocalHover] = useState(false)

  // Animate hover effect
  useFrame(() => {
    if (meshRef.current) {
      const targetScale = localHover || isHovered ? 1.2 : 1
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      )
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={[zone.center.x, zone.center.y, zone.center.z]}
      onPointerEnter={(e) => {
        if (readOnly) return
        e.stopPropagation()
        setLocalHover(true)
        onHover(zone.id)
      }}
      onPointerLeave={(e) => {
        if (readOnly) return
        e.stopPropagation()
        setLocalHover(false)
        onHover(null)
      }}
    >
      <sphereGeometry args={[zone.radius, 16, 16]} />
      <meshStandardMaterial
        color={isHovered || localHover ? ZONE_COLORS.hover : zone.color}
        transparent
        opacity={isHovered || localHover ? 0.5 : 0.2}
        depthWrite={false}
      />
    </mesh>
  )
}

export function FacialZones3D({
  hoveredZone,
  onZoneHover,
  readOnly = false,
}: FacialZones3DProps) {
  return (
    <group>
      {FACIAL_ZONES_3D.map((zone) => (
        <ZoneSphere
          key={zone.id}
          zone={zone}
          isHovered={hoveredZone === zone.id}
          onHover={onZoneHover}
          readOnly={readOnly}
        />
      ))}
    </group>
  )
}

export default FacialZones3D
