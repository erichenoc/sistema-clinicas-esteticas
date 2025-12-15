'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type Gender = 'male' | 'female'

interface FaceModelProps {
  gender?: Gender
  showWireframe?: boolean
  onMeshReady?: (mesh: THREE.Mesh) => void
}

// Create a realistic head geometry procedurally based on gender
function createHeadGeometry(gender: Gender): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(0.5, 64, 64)
  const positions = geometry.attributes.position
  const vertex = new THREE.Vector3()

  // Gender-specific parameters
  const isMale = gender === 'male'

  // Male: wider jaw, more angular, pronounced brow ridge
  // Female: narrower jaw, softer features, rounder forehead
  const jawWidth = isMale ? 1.0 : 0.85
  const browRidge = isMale ? 1.06 : 1.02
  const cheekboneWidth = isMale ? 1.08 : 1.05
  const chinNarrow = isMale ? 0.22 : 0.28
  const foreheadCurve = isMale ? 1.01 : 1.03
  const noseProminence = isMale ? 1.15 : 1.10
  const lipFullness = isMale ? 1.02 : 1.05

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i)

    let r = 0.5

    // Flatten the back of the head slightly
    if (vertex.z < -0.1) {
      r *= 0.92 + 0.08 * (vertex.z + 0.5)
    }

    // Narrow the chin area - different for male/female
    if (vertex.y < -0.2) {
      const chinFactor = 1 - ((-vertex.y - 0.2) / 0.3) * chinNarrow
      r *= chinFactor
    }

    // Jaw area - males have wider, more angular jaws
    if (vertex.y < 0 && vertex.y > -0.3 && Math.abs(vertex.x) > 0.15) {
      r *= jawWidth
    }

    // Cheekbones
    if (vertex.y > -0.1 && vertex.y < 0.2 && Math.abs(vertex.x) > 0.2) {
      r *= cheekboneWidth
    }

    // Forehead curvature
    if (vertex.y > 0.3 && vertex.z > 0.1) {
      r *= foreheadCurve
    }

    // Brow ridge - more pronounced in males
    if (vertex.y > 0.15 && vertex.y < 0.3 && vertex.z > 0.3) {
      r *= browRidge
    }

    // Nose area
    if (vertex.y > -0.15 && vertex.y < 0.25 && Math.abs(vertex.x) < 0.1 && vertex.z > 0.35) {
      const noseFactor = 1 + (0.15 - Math.abs(vertex.y - 0.05)) * 0.3
      r *= Math.min(noseFactor, noseProminence)
    }

    // Lips area - fuller in females
    if (vertex.y > -0.25 && vertex.y < -0.05 && Math.abs(vertex.x) < 0.15 && vertex.z > 0.35) {
      r *= lipFullness
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

// Skin tone colors by gender
const skinTones = {
  male: {
    primary: '#e8c4b8',
    secondary: '#ddb8ab',
    lips: '#c4857a',
    eyes: '#4a3728'
  },
  female: {
    primary: '#f5d5c8',
    secondary: '#f0c8bb',
    lips: '#d4958a',
    eyes: '#3d2f25'
  }
}

export function FaceModel({ gender = 'female', showWireframe = false, onMeshReady }: FaceModelProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Create the head geometry based on gender
  const geometry = useMemo(() => createHeadGeometry(gender), [gender])

  const colors = skinTones[gender]

  // Create materials
  const skinMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.primary),
      roughness: 0.65,
      metalness: 0.0,
      flatShading: false,
    })
  }, [colors.primary])

  const wireframeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color('#4a6fa5'),
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    })
  }, [])

  // Notify parent when mesh is ready
  useFrame(() => {
    if (meshRef.current && onMeshReady) {
      onMeshReady(meshRef.current)
    }
  })

  // Scale adjustments by gender
  const headScale: [number, number, number] = gender === 'male'
    ? [1.9, 2.05, 1.7]
    : [1.75, 1.95, 1.55]

  const neckRadius = gender === 'male' ? [0.28, 0.33] : [0.23, 0.28]
  const eyeSpacing = gender === 'male' ? 0.19 : 0.17
  const eyeSize = gender === 'male' ? 0.055 : 0.06
  const lipWidth = gender === 'male' ? 0.10 : 0.12
  const earSize = gender === 'male' ? 0.05 : 0.04

  return (
    <group>
      {/* Main head mesh */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={skinMaterial}
        position={[0, 0.2, 0]}
        scale={headScale}
      />

      {/* Wireframe overlay for clinical look */}
      {showWireframe && (
        <mesh
          geometry={geometry}
          material={wireframeMaterial}
          position={[0, 0.2, 0]}
          scale={headScale.map(s => s * 1.002) as [number, number, number]}
        />
      )}

      {/* Neck cylinder */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[neckRadius[0], neckRadius[1], 0.5, 32]} />
        <meshStandardMaterial color={colors.primary} roughness={0.7} />
      </mesh>

      {/* Eyes */}
      <mesh position={[eyeSpacing, 0.45, 0.42]}>
        <sphereGeometry args={[eyeSize, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-eyeSpacing, 0.45, 0.42]}>
        <sphereGeometry args={[eyeSize, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Pupils */}
      <mesh position={[eyeSpacing, 0.45, 0.48]}>
        <sphereGeometry args={[eyeSize * 0.4, 16, 16]} />
        <meshStandardMaterial color={colors.eyes} />
      </mesh>
      <mesh position={[-eyeSpacing, 0.45, 0.48]}>
        <sphereGeometry args={[eyeSize * 0.4, 16, 16]} />
        <meshStandardMaterial color={colors.eyes} />
      </mesh>

      {/* Eyebrows - more prominent in males */}
      {gender === 'male' && (
        <>
          <mesh position={[eyeSpacing, 0.55, 0.45]} rotation={[0, 0, 0.1]}>
            <boxGeometry args={[0.12, 0.02, 0.03]} />
            <meshStandardMaterial color="#3d2f25" />
          </mesh>
          <mesh position={[-eyeSpacing, 0.55, 0.45]} rotation={[0, 0, -0.1]}>
            <boxGeometry args={[0.12, 0.02, 0.03]} />
            <meshStandardMaterial color="#3d2f25" />
          </mesh>
        </>
      )}

      {/* Eyelashes hint for females */}
      {gender === 'female' && (
        <>
          <mesh position={[eyeSpacing, 0.50, 0.46]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.08, 0.008, 0.02]} />
            <meshStandardMaterial color="#2d2420" />
          </mesh>
          <mesh position={[-eyeSpacing, 0.50, 0.46]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.08, 0.008, 0.02]} />
            <meshStandardMaterial color="#2d2420" />
          </mesh>
        </>
      )}

      {/* Nose tip */}
      <mesh position={[0, 0.22, 0.62]}>
        <sphereGeometry args={[gender === 'male' ? 0.065 : 0.055, 16, 16]} />
        <meshStandardMaterial color={colors.secondary} roughness={0.6} />
      </mesh>

      {/* Upper lip */}
      <mesh position={[0, 0.02, 0.58]} rotation={[0.2, 0, 0]}>
        <capsuleGeometry args={[0.02, lipWidth, 8, 16]} />
        <meshStandardMaterial color={colors.lips} roughness={0.5} />
      </mesh>

      {/* Lower lip */}
      <mesh position={[0, -0.06, 0.56]} rotation={[-0.1, 0, 0]}>
        <capsuleGeometry args={[gender === 'female' ? 0.028 : 0.023, lipWidth * 0.9, 8, 16]} />
        <meshStandardMaterial color={colors.lips} roughness={0.5} />
      </mesh>

      {/* Ears */}
      <mesh position={[0.52, 0.35, 0]} rotation={[0, 0.3, 0]}>
        <capsuleGeometry args={[earSize, 0.12, 8, 16]} />
        <meshStandardMaterial color={colors.secondary} roughness={0.7} />
      </mesh>
      <mesh position={[-0.52, 0.35, 0]} rotation={[0, -0.3, 0]}>
        <capsuleGeometry args={[earSize, 0.12, 8, 16]} />
        <meshStandardMaterial color={colors.secondary} roughness={0.7} />
      </mesh>

      {/* Hair hint - optional styling difference */}
      {gender === 'female' && (
        <mesh position={[0, 0.75, -0.1]} rotation={[-0.2, 0, 0]}>
          <sphereGeometry args={[0.45, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#3d2820" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}

      {gender === 'male' && (
        <mesh position={[0, 0.72, -0.05]} rotation={[-0.15, 0, 0]}>
          <sphereGeometry args={[0.42, 32, 32, 0, Math.PI * 2, 0, Math.PI / 3]} />
          <meshStandardMaterial color="#2d2015" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

export default FaceModel
