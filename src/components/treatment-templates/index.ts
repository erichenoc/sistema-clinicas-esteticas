// 3D Face Map Components
export { FaceMap3D, FACIAL_ZONES_3D, detectZoneFromPosition } from './FaceMap3D'
export type { FaceMap3DProps } from './FaceMap3D'

// Treatment Templates
export { FacialTreatmentTemplate } from './FacialTreatmentTemplate'
export { InjectableTreatmentTemplate } from './InjectableTreatmentTemplate'
export {
  TreatmentTemplateSelector,
  hasTreatmentTemplate,
  getEmptyTemplateData,
} from './TreatmentTemplateSelector'

// Legacy SVG (kept for backward compatibility, but deprecated)
// FaceMap3D should be used instead
export { FaceMapSVG } from './FaceMapSVG'
