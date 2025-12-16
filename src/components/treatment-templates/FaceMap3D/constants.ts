import type { FacialZone3D, InjectionZone } from '@/types/treatment-templates'

// 18 Facial Zones defined in 3D space
// Coordinates calibrated for the female_head_sculpt model from Sketchfab
// Model is scaled to 0.05 with NO rotation, centered via drei Center at [0, 0.2, 0]
// Coordinate system: X = left(-)/right(+), Y = down(-)/up(+), Z = back(-)/front(+)
export const FACIAL_ZONES_3D: FacialZone3D[] = [
  // Upper face - Tercio Superior (BOTOX zones)
  {
    id: 'frente',
    label: 'Frente',
    center: { x: 0, y: 0.65, z: 0.15 },
    color: '#fbbf24', // Yellow
    radius: 0.12,
  },
  {
    id: 'entrecejo',
    label: 'Entrecejo',
    center: { x: 0, y: 0.50, z: 0.22 },
    color: '#22c55e', // Green
    radius: 0.06,
  },
  // Temples - Sienes
  {
    id: 'sien_der',
    label: 'Sien Derecha',
    center: { x: 0.30, y: 0.50, z: 0.05 },
    color: '#f97316', // Orange
    radius: 0.06,
  },
  {
    id: 'sien_izq',
    label: 'Sien Izquierda',
    center: { x: -0.30, y: 0.50, z: 0.05 },
    color: '#f97316', // Orange
    radius: 0.06,
  },
  // Crow's feet - Patas de gallo (BOTOX zones)
  {
    id: 'patas_gallo_der',
    label: 'Patas de Gallo (Der)',
    center: { x: 0.28, y: 0.40, z: 0.12 },
    color: '#f97316', // Orange
    radius: 0.05,
  },
  {
    id: 'patas_gallo_izq',
    label: 'Patas de Gallo (Izq)',
    center: { x: -0.28, y: 0.40, z: 0.12 },
    color: '#f97316', // Orange
    radius: 0.05,
  },
  // Nose - Nariz (Rellenos - rinomodelación)
  {
    id: 'nariz',
    label: 'Nariz',
    center: { x: 0, y: 0.30, z: 0.30 },
    color: '#ef4444', // Red
    radius: 0.05,
  },
  // Cheeks - Mejillas (Rellenos - volumen)
  {
    id: 'mejilla_der',
    label: 'Mejilla Derecha',
    center: { x: 0.22, y: 0.28, z: 0.18 },
    color: '#ec4899', // Pink
    radius: 0.08,
  },
  {
    id: 'mejilla_izq',
    label: 'Mejilla Izquierda',
    center: { x: -0.22, y: 0.28, z: 0.18 },
    color: '#ec4899', // Pink
    radius: 0.08,
  },
  // Nasolabial folds - Surcos nasogenianos (Rellenos)
  {
    id: 'surco_nasogeniano_der',
    label: 'Surco Nasogeniano (Der)',
    center: { x: 0.10, y: 0.18, z: 0.26 },
    color: '#f9a8d4', // Light pink
    radius: 0.05,
  },
  {
    id: 'surco_nasogeniano_izq',
    label: 'Surco Nasogeniano (Izq)',
    center: { x: -0.10, y: 0.18, z: 0.26 },
    color: '#f9a8d4', // Light pink
    radius: 0.05,
  },
  // Lips - Labios (Rellenos - aumento/perfilado)
  {
    id: 'labio_superior',
    label: 'Labio Superior',
    center: { x: 0, y: 0.10, z: 0.30 },
    color: '#ef4444', // Red
    radius: 0.05,
  },
  {
    id: 'labio_inferior',
    label: 'Labio Inferior',
    center: { x: 0, y: 0.02, z: 0.28 },
    color: '#ef4444', // Red
    radius: 0.05,
  },
  {
    id: 'comisuras',
    label: 'Comisuras',
    center: { x: 0.12, y: 0.06, z: 0.24 },
    color: '#ec4899', // Pink
    radius: 0.04,
  },
  // Chin and jawline - Mentón y línea mandibular (Rellenos)
  {
    id: 'menton',
    label: 'Menton',
    center: { x: 0, y: -0.08, z: 0.22 },
    color: '#fbbf24', // Yellow
    radius: 0.06,
  },
  {
    id: 'linea_mandibular_der',
    label: 'Linea Mandibular (Der)',
    center: { x: 0.25, y: 0.0, z: 0.08 },
    color: '#86efac', // Light green
    radius: 0.06,
  },
  {
    id: 'linea_mandibular_izq',
    label: 'Linea Mandibular (Izq)',
    center: { x: -0.25, y: 0.0, z: 0.08 },
    color: '#86efac', // Light green
    radius: 0.06,
  },
  // Neck - Cuello
  {
    id: 'cuello',
    label: 'Cuello',
    center: { x: 0, y: -0.25, z: 0.05 },
    color: '#fcd34d', // Yellow
    radius: 0.10,
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
  current: '#ffffff', // White for current session points
  selected: '#3b82f6', // Blue for selected point
  history: '#9ca3af', // Gray for history points
  outline: '#000000', // Black outline for visibility
}

// Treatment type to valid zones mapping
// BOTOX: Only upper third of face (dynamic wrinkles)
// Fillers (HA): Most facial zones except crow's feet
export const TREATMENT_ZONE_MAP: Record<string, InjectionZone[]> = {
  // Toxina Botulínica - Solo tercio superior
  'botox': ['frente', 'entrecejo', 'patas_gallo_der', 'patas_gallo_izq', 'sien_der', 'sien_izq'],
  'toxina': ['frente', 'entrecejo', 'patas_gallo_der', 'patas_gallo_izq', 'sien_der', 'sien_izq'],

  // Rellenos con Ácido Hialurónico - Tercio medio e inferior
  'relleno': [
    'nariz', 'mejilla_der', 'mejilla_izq',
    'surco_nasogeniano_der', 'surco_nasogeniano_izq',
    'labio_superior', 'labio_inferior', 'comisuras',
    'menton', 'linea_mandibular_der', 'linea_mandibular_izq'
  ],
  'acido hialuronico': [
    'nariz', 'mejilla_der', 'mejilla_izq',
    'surco_nasogeniano_der', 'surco_nasogeniano_izq',
    'labio_superior', 'labio_inferior', 'comisuras',
    'menton', 'linea_mandibular_der', 'linea_mandibular_izq'
  ],

  // Labios específicamente
  'labios': ['labio_superior', 'labio_inferior', 'comisuras'],
  'aumento de labios': ['labio_superior', 'labio_inferior', 'comisuras'],

  // Nariz - Rinomodelación
  'perfilado de nariz': ['nariz'],
  'rinomodelacion': ['nariz'],

  // Surcos nasogenianos
  'surcos': ['surco_nasogeniano_der', 'surco_nasogeniano_izq'],
  'nasogeniano': ['surco_nasogeniano_der', 'surco_nasogeniano_izq'],

  // Mentón
  'menton': ['menton'],
  'aumento de menton': ['menton'],

  // Bioestimuladores - Todo el rostro
  'profhilo': [
    'frente', 'mejilla_der', 'mejilla_izq', 'menton',
    'linea_mandibular_der', 'linea_mandibular_izq', 'cuello'
  ],
  'bioestimulador': [
    'frente', 'mejilla_der', 'mejilla_izq', 'menton',
    'linea_mandibular_der', 'linea_mandibular_izq', 'cuello'
  ],
  'sculptra': [
    'sien_der', 'sien_izq', 'mejilla_der', 'mejilla_izq',
    'linea_mandibular_der', 'linea_mandibular_izq', 'menton'
  ],
  'radiesse': [
    'mejilla_der', 'mejilla_izq', 'menton',
    'linea_mandibular_der', 'linea_mandibular_izq'
  ],

  // Hilos tensores
  'hilos': [
    'mejilla_der', 'mejilla_izq', 'linea_mandibular_der', 'linea_mandibular_izq',
    'cuello'
  ],

  // Default - todas las zonas
  'default': [
    'frente', 'entrecejo', 'sien_der', 'sien_izq',
    'patas_gallo_der', 'patas_gallo_izq', 'nariz',
    'mejilla_der', 'mejilla_izq',
    'surco_nasogeniano_der', 'surco_nasogeniano_izq',
    'labio_superior', 'labio_inferior', 'comisuras',
    'menton', 'linea_mandibular_der', 'linea_mandibular_izq', 'cuello'
  ],
}

// Get valid zones for a treatment
export function getValidZonesForTreatment(treatmentName: string): InjectionZone[] {
  const name = treatmentName.toLowerCase()

  // Check each key in the map
  for (const [key, zones] of Object.entries(TREATMENT_ZONE_MAP)) {
    if (key !== 'default' && name.includes(key)) {
      return zones
    }
  }

  return TREATMENT_ZONE_MAP['default']
}

// Check if a zone is valid for a treatment
export function isZoneValidForTreatment(zone: InjectionZone, treatmentName: string): boolean {
  const validZones = getValidZonesForTreatment(treatmentName)
  return validZones.includes(zone)
}
