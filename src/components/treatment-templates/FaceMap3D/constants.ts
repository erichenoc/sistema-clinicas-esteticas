import type { FacialZone3D, InjectionZone } from '@/types/treatment-templates'

// 18 Facial Zones defined in 3D space
// Coordinates calibrated for the female_head_sculpt model from Sketchfab
// Model is scaled to 0.05 and rotated -90° on X axis, centered at [0, 0.2, 0]
export const FACIAL_ZONES_3D: FacialZone3D[] = [
  // Upper face
  {
    id: 'frente',
    label: 'Frente',
    center: { x: 0, y: 0.55, z: 0.28 },
    color: '#fbbf24', // Yellow
    radius: 0.08,
  },
  {
    id: 'entrecejo',
    label: 'Entrecejo',
    center: { x: 0, y: 0.40, z: 0.35 },
    color: '#22c55e', // Green
    radius: 0.04,
  },
  // Temples
  {
    id: 'sien_der',
    label: 'Sien Derecha',
    center: { x: 0.38, y: 0.40, z: 0.12 },
    color: '#f97316', // Orange
    radius: 0.04,
  },
  {
    id: 'sien_izq',
    label: 'Sien Izquierda',
    center: { x: -0.38, y: 0.40, z: 0.12 },
    color: '#f97316', // Orange
    radius: 0.04,
  },
  // Crow's feet
  {
    id: 'patas_gallo_der',
    label: 'Patas de Gallo (Der)',
    center: { x: 0.35, y: 0.30, z: 0.18 },
    color: '#f97316', // Orange
    radius: 0.035,
  },
  {
    id: 'patas_gallo_izq',
    label: 'Patas de Gallo (Izq)',
    center: { x: -0.35, y: 0.30, z: 0.18 },
    color: '#f97316', // Orange
    radius: 0.035,
  },
  // Nose
  {
    id: 'nariz',
    label: 'Nariz',
    center: { x: 0, y: 0.18, z: 0.40 },
    color: '#ef4444', // Red
    radius: 0.04,
  },
  // Cheeks
  {
    id: 'mejilla_der',
    label: 'Mejilla Derecha',
    center: { x: 0.28, y: 0.12, z: 0.28 },
    color: '#ec4899', // Pink
    radius: 0.06,
  },
  {
    id: 'mejilla_izq',
    label: 'Mejilla Izquierda',
    center: { x: -0.28, y: 0.12, z: 0.28 },
    color: '#ec4899', // Pink
    radius: 0.06,
  },
  // Nasolabial folds
  {
    id: 'surco_nasogeniano_der',
    label: 'Surco Nasogeniano (Der)',
    center: { x: 0.15, y: 0.02, z: 0.35 },
    color: '#f9a8d4', // Light pink
    radius: 0.035,
  },
  {
    id: 'surco_nasogeniano_izq',
    label: 'Surco Nasogeniano (Izq)',
    center: { x: -0.15, y: 0.02, z: 0.35 },
    color: '#f9a8d4', // Light pink
    radius: 0.035,
  },
  // Lips
  {
    id: 'labio_superior',
    label: 'Labio Superior',
    center: { x: 0, y: -0.02, z: 0.38 },
    color: '#ef4444', // Red
    radius: 0.035,
  },
  {
    id: 'labio_inferior',
    label: 'Labio Inferior',
    center: { x: 0, y: -0.08, z: 0.36 },
    color: '#ef4444', // Red
    radius: 0.035,
  },
  {
    id: 'comisuras',
    label: 'Comisuras',
    center: { x: 0.12, y: -0.05, z: 0.32 },
    color: '#ec4899', // Pink
    radius: 0.03,
  },
  // Chin and jawline
  {
    id: 'menton',
    label: 'Menton',
    center: { x: 0, y: -0.18, z: 0.32 },
    color: '#fbbf24', // Yellow
    radius: 0.05,
  },
  {
    id: 'linea_mandibular_der',
    label: 'Linea Mandibular (Der)',
    center: { x: 0.32, y: -0.10, z: 0.12 },
    color: '#86efac', // Light green
    radius: 0.045,
  },
  {
    id: 'linea_mandibular_izq',
    label: 'Linea Mandibular (Izq)',
    center: { x: -0.32, y: -0.10, z: 0.12 },
    color: '#86efac', // Light green
    radius: 0.045,
  },
  // Neck
  {
    id: 'cuello',
    label: 'Cuello',
    center: { x: 0, y: -0.45, z: 0.08 },
    color: '#fcd34d', // Yellow
    radius: 0.07,
  },
]

// Get zone by ID
export function getZoneById(zoneId: InjectionZone): FacialZone3D | undefined {
  return FACIAL_ZONES_3D.find(zone => zone.id === zoneId)
}

// Detect zone from 3D position using distance to zone centers
export function detectZoneFromPosition(
  position: { x: number; y: number; z: number }
): InjectionZone | null {
  let closestZone: FacialZone3D | null = null
  let closestDistance = Infinity

  for (const zone of FACIAL_ZONES_3D) {
    const dx = position.x - zone.center.x
    const dy = position.y - zone.center.y
    const dz = position.z - zone.center.z
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

    // Check if within zone radius and closer than previous match
    if (distance < zone.radius && distance < closestDistance) {
      closestZone = zone
      closestDistance = distance
    }
  }

  // If no exact match, find closest zone overall
  if (!closestZone) {
    for (const zone of FACIAL_ZONES_3D) {
      const dx = position.x - zone.center.x
      const dy = position.y - zone.center.y
      const dz = position.z - zone.center.z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (distance < closestDistance) {
        closestZone = zone
        closestDistance = distance
      }
    }
  }

  return closestZone?.id ?? null
}

// Zone colors for visualization
export const ZONE_COLORS = {
  default: '#9ca3af',
  hover: '#3b82f6',
  selected: '#ef4444',
  history: '#6b7280',
}

// Point colors
export const POINT_COLORS = {
  current: '#ef4444', // Red for current session points
  selected: '#3b82f6', // Blue for selected point
  history: '#9ca3af', // Gray for history points
}
