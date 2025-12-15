'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FaceModelProps {
  onMeshReady?: (mesh: THREE.Mesh) => void
}

// Create a realistic head geometry procedurally
function createHeadGeometry(): THREE.BufferGeometry {
  // Start with a sphere and modify it to look like a head
  const geometry = new THREE.SphereGeometry(0.5, 64, 64)
  const positions = geometry.attributes.position
  const vertex = new THREE.Vector3()

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i)

    // Original spherical position
    const theta = Math.atan2(vertex.z, vertex.x)
    const phi = Math.acos(vertex.y / 0.5)

    // Modify to create head shape
    let r = 0.5

    // Flatten the back of the head slightly
    if (vertex.z < -0.1) {
      r *= 0.92 + 0.08 * (vertex.z + 0.5)
    }

    // Narrow the chin area
    if (vertex.y < -0.2) {
      const chinFactor = 1 - ((-vertex.y - 0.2) / 0.3) * 0.25
      r *= chinFactor
    }

    // Widen the cheekbones slightly
    if (vertex.y > -0.1 && vertex.y < 0.2 && Math.abs(vertex.x) > 0.2) {
      r *= 1.05
    }

    // Add forehead curvature
    if (vertex.y > 0.3 && vertex.z > 0.1) {
      r *= 1.02
    }

    // Create brow ridge
    if (vertex.y > 0.15 && vertex.y < 0.3 && vertex.z > 0.3) {
      r *= 1.03
    }

    // Nose area - push forward
    if (vertex.y > -0.15 && vertex.y < 0.25 && Math.abs(vertex.x) < 0.1 && vertex.z > 0.35) {
      const noseFactor = 1 + (0.15 - Math.abs(vertex.y - 0.05)) * 0.3
      r *= Math.min(noseFactor, 1.12)
    }

    // Lips area - push forward slightly
    if (vertex.y > -0.25 && vertex.y < -0.05 && Math.abs(vertex.x) < 0.15 && vertex.z > 0.35) {
      r *= 1.04
    }

    // Apply the modified radius
    const normalizedVertex = vertex.normalize()
    positions.setXYZ(
      i,
      normalizedVertex.x * r,
      normalizedVertex.y * r,
      normalizedVertex.z * r
    )
  }

  geometry.computeVertexNormals()
  return geometry
}

export function FaceModel({ onMeshReady }: FaceModelProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Create the head geometry once
  const geometry = useMemo(() => createHeadGeometry(), [])

  // Create realistic skin material
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f5d0c5'), // Skin tone
      roughness: 0.7,
      metalness: 0.0,
      flatShading: false,
    })
  }, [])

  // Notify parent when mesh is ready
  useFrame(() => {
    if (meshRef.current && onMeshReady) {
      onMeshReady(meshRef.current)
    }
  })

  return (
    <group>
      {/* Main head mesh */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        position={[0, 0.2, 0]}
        scale={[1.8, 2, 1.6]}
      />

      {/* Neck cylinder */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.5, 32]} />
        <meshStandardMaterial color="#f5d0c5" roughness={0.7} />
      </mesh>

      {/* Eyes - simple spheres for reference */}
      <mesh position={[0.18, 0.45, 0.42]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.18, 0.45, 0.42]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Pupils */}
      <mesh position={[0.18, 0.45, 0.48]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      <mesh position={[-0.18, 0.45, 0.48]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>

      {/* Nose tip */}
      <mesh position={[0, 0.22, 0.62]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#edc4b8" roughness={0.6} />
      </mesh>

      {/* Upper lip */}
      <mesh position={[0, 0.02, 0.58]} rotation={[0.2, 0, 0]}>
        <capsuleGeometry args={[0.02, 0.12, 8, 16]} />
        <meshStandardMaterial color="#d4958a" roughness={0.5} />
      </mesh>

      {/* Lower lip */}
      <mesh position={[0, -0.06, 0.56]} rotation={[-0.1, 0, 0]}>
        <capsuleGeometry args={[0.025, 0.1, 8, 16]} />
        <meshStandardMaterial color="#d4958a" roughness={0.5} />
      </mesh>

      {/* Ears */}
      <mesh position={[0.52, 0.35, 0]} rotation={[0, 0.3, 0]}>
        <capsuleGeometry args={[0.04, 0.12, 8, 16]} />
        <meshStandardMaterial color="#f0c4b8" roughness={0.7} />
      </mesh>
      <mesh position={[-0.52, 0.35, 0]} rotation={[0, -0.3, 0]}>
        <capsuleGeometry args={[0.04, 0.12, 8, 16]} />
        <meshStandardMaterial color="#f0c4b8" roughness={0.7} />
      </mesh>
    </group>
  )
}

export default FaceModel
