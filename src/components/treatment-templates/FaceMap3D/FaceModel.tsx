'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'

export type Gender = 'male' | 'female'

interface FaceModelProps {
  gender?: Gender
  showWireframe?: boolean
  onMeshReady?: (mesh: THREE.Mesh) => void
}

// Use male head model for both genders for now (it's simpler and loads reliably)
// The female model has 445 meshes which is very complex
const MODEL_PATH = '/models/heads/male-head.glb'

// Skin tone material colors
const skinTones = {
  male: '#e8c4b8',
  female: '#f5d5c8',
}

export function FaceModel({ gender = 'female', showWireframe = false, onMeshReady }: FaceModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(MODEL_PATH)

  const skinColor = skinTones[gender]

  // Clone the scene to avoid modifying the cached original
  const clonedScene = useMemo(() => {
    const cloned = scene.clone()
    return cloned
  }, [scene])

  // Apply skin material to all meshes in the model
  useEffect(() => {
    if (clonedScene) {
      const skinMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(skinColor),
        roughness: 0.6,
        metalness: 0.0,
        flatShading: false,
      })

      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = skinMaterial
          child.castShadow = true
          child.receiveShadow = true

          // Notify parent of mesh for raycasting
          if (onMeshReady) {
            onMeshReady(child)
          }
        }
      })
    }
  }, [clonedScene, skinColor, onMeshReady])

  // Create wireframe material
  const wireframeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color('#4a6fa5'),
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    })
  }, [])

  // Create wireframe version of the model
  const wireframeScene = useMemo(() => {
    if (!showWireframe) return null
    const wireframe = clonedScene.clone()
    wireframe.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = wireframeMaterial
      }
    })
    return wireframe
  }, [clonedScene, wireframeMaterial, showWireframe])

  return (
    <group ref={groupRef}>
      {/* Center component automatically centers and scales the model */}
      <Center position={[0, 0.2, 0]}>
        <primitive
          object={clonedScene}
          scale={0.08}
        />
      </Center>

      {/* Wireframe overlay */}
      {showWireframe && wireframeScene && (
        <Center position={[0, 0.2, 0]}>
          <primitive
            object={wireframeScene}
            scale={0.081}
          />
        </Center>
      )}
    </group>
  )
}

// Preload model
useGLTF.preload(MODEL_PATH)

export default FaceModel
