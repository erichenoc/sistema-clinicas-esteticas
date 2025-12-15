'use client'

import { Suspense, useRef, useState, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { InjectionPoint, Point3D, InjectionZone } from '@/types/treatment-templates'
import { FaceModel, type Gender } from './FaceModel'
import { FacialZones3D } from './FacialZones3D'
import { InjectionPoints3D } from './InjectionPoints3D'
import { HistoryPoints3D } from './HistoryPoints3D'
import { detectZoneFromPosition } from './constants'
import { Loader2 } from 'lucide-react'

export interface FaceMap3DProps {
  points: InjectionPoint[]
  historyPoints?: InjectionPoint[]
  onPointClick?: (point: InjectionPoint) => void
  onAddPoint?: (position: Point3D, zone: InjectionZone) => void
  selectedPointId?: string | null
  readOnly?: boolean
  showHistory?: boolean
  gender?: Gender
  showWireframe?: boolean
  className?: string
}

// Component that handles raycasting and click detection
function ClickHandler({
  onAddPoint,
  readOnly,
}: {
  onAddPoint?: (position: Point3D, zone: InjectionZone) => void
  readOnly?: boolean
}) {
  const { camera, scene, gl } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (readOnly || !onAddPoint) return

      // Get canvas bounds
      const rect = gl.domElement.getBoundingClientRect()

      // Calculate mouse position in normalized device coordinates
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Update the raycaster
      raycaster.current.setFromCamera(mouse.current, camera)

      // Find intersections with the face model
      const faceMeshes = scene.children.filter(
        (child) => child instanceof THREE.Mesh || child instanceof THREE.Group
      )

      const intersects = raycaster.current.intersectObjects(faceMeshes, true)

      if (intersects.length > 0) {
        const hit = intersects[0]
        const position: Point3D = {
          x: hit.point.x,
          y: hit.point.y,
          z: hit.point.z,
        }

        const zone = detectZoneFromPosition(position)
        if (zone) {
          onAddPoint(position, zone)
        }
      }
    },
    [camera, scene, gl, onAddPoint, readOnly]
  )

  // Add click listener
  useFrame(() => {
    gl.domElement.onclick = handleClick
  })

  return null
}

// Loading component
function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Cargando modelo 3D...</span>
      </div>
    </Html>
  )
}

// Scene component with all 3D elements
function Scene({
  points,
  historyPoints,
  onPointClick,
  onAddPoint,
  selectedPointId,
  readOnly,
  showHistory,
  gender,
  showWireframe,
}: Omit<FaceMap3DProps, 'className'>) {
  const [hoveredZone, setHoveredZone] = useState<InjectionZone | null>(null)

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 5, 5]} intensity={0.4} />
      <directionalLight position={[0, -5, 5]} intensity={0.2} />

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={1.5}
        maxDistance={4}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(Math.PI * 3) / 4}
        target={[0, 0.2, 0]}
      />

      {/* Face model */}
      <Suspense fallback={<LoadingFallback />}>
        <FaceModel gender={gender} showWireframe={showWireframe} />
      </Suspense>

      {/* Facial zones overlay */}
      <FacialZones3D
        hoveredZone={hoveredZone}
        onZoneHover={setHoveredZone}
        readOnly={readOnly}
      />

      {/* History points (previous sessions) */}
      {showHistory && historyPoints && historyPoints.length > 0 && (
        <HistoryPoints3D points={historyPoints} />
      )}

      {/* Current session injection points */}
      <InjectionPoints3D
        points={points}
        selectedPointId={selectedPointId}
        onPointClick={onPointClick}
      />

      {/* Click handler for adding new points */}
      <ClickHandler onAddPoint={onAddPoint} readOnly={readOnly} />

      {/* Zone label on hover */}
      {hoveredZone && (
        <Html position={[0, 1.3, 0]} center>
          <div className="bg-black/80 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap">
            {hoveredZone.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </div>
        </Html>
      )}
    </>
  )
}

export function FaceMap3D({
  points,
  historyPoints,
  onPointClick,
  onAddPoint,
  selectedPointId,
  readOnly = false,
  showHistory = true,
  gender = 'female',
  showWireframe = false,
  className = '',
}: FaceMap3DProps) {
  return (
    <div className={`relative ${className}`}>
      {/* 3D Canvas */}
      <div className="w-full h-[500px] bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl overflow-hidden">
        <Canvas
          camera={{ position: [0, 0.5, 2.5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <Scene
            points={points}
            historyPoints={historyPoints}
            onPointClick={onPointClick}
            onAddPoint={onAddPoint}
            selectedPointId={selectedPointId}
            readOnly={readOnly}
            showHistory={showHistory}
            gender={gender}
            showWireframe={showWireframe}
          />
        </Canvas>
      </div>

      {/* Instructions overlay */}
      {!readOnly && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
          <span className="opacity-80">
            Arrastra para rotar • Scroll para zoom • Clic para agregar punto
          </span>
        </div>
      )}

      {/* Point counter */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm">
        <span className="text-sm font-medium text-slate-700">
          {points.length} punto{points.length !== 1 ? 's' : ''}
        </span>
        {showHistory && historyPoints && historyPoints.length > 0 && (
          <span className="text-sm text-slate-500 ml-2">
            ({historyPoints.length} historial)
          </span>
        )}
      </div>
    </div>
  )
}

export default FaceMap3D
