'use client'

import { useMemo } from 'react'
import { FileText, Syringe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FacialTreatmentTemplate } from './FacialTreatmentTemplate'
import { InjectableTreatmentTemplate } from './InjectableTreatmentTemplate'
import {
  getTemplateType,
  type TreatmentTemplateData,
  type FacialTreatmentData,
  type InjectableTreatmentData,
} from '@/types/treatment-templates'
import type { Gender } from './FaceMap3D'

interface TreatmentTemplateSelectorProps {
  treatmentName: string
  data: TreatmentTemplateData | null
  onChange: (data: TreatmentTemplateData) => void
  readOnly?: boolean
  patientId?: string
  patientGender?: Gender
  currentSessionId?: string
}

const emptyFacialData: FacialTreatmentData = {
  templateType: 'facial',
  sessions: [],
  generalNotes: '',
}

const emptyInjectableData: InjectableTreatmentData = {
  templateType: 'injectable',
  injectionPoints: [],
  observations: '',
  recommendations: '',
  totalDose: '',
  productUsed: '',
  lotNumber: '',
}

export function TreatmentTemplateSelector({
  treatmentName,
  data,
  onChange,
  readOnly = false,
  patientId,
  patientGender,
  currentSessionId,
}: TreatmentTemplateSelectorProps) {
  const templateType = useMemo(() => getTemplateType(treatmentName), [treatmentName])

  // Initialize data if needed
  const currentData = useMemo(() => {
    if (data) return data

    if (templateType === 'facial') {
      return emptyFacialData
    } else if (templateType === 'injectable') {
      return emptyInjectableData
    }

    return null
  }, [data, templateType])

  if (!templateType || !currentData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay plantilla especializada disponible para este tipo de tratamiento.</p>
        <p className="text-sm mt-2">
          Las plantillas están disponibles para tratamientos faciales e inyectables.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Template Type Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          {templateType === 'facial' ? (
            <>
              <FileText className="h-3 w-3" />
              Plantilla Facial
            </>
          ) : (
            <>
              <Syringe className="h-3 w-3" />
              Plantilla Inyectables
            </>
          )}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Detectada para: {treatmentName}
        </span>
      </div>

      {/* Render appropriate template */}
      {templateType === 'facial' && currentData.templateType === 'facial' && (
        <FacialTreatmentTemplate
          data={currentData as FacialTreatmentData}
          onChange={(newData) => onChange(newData)}
          readOnly={readOnly}
        />
      )}

      {templateType === 'injectable' && currentData.templateType === 'injectable' && (
        <InjectableTreatmentTemplate
          data={currentData as InjectableTreatmentData}
          onChange={(newData) => onChange(newData)}
          readOnly={readOnly}
          patientId={patientId}
          patientGender={patientGender}
          currentSessionId={currentSessionId}
        />
      )}
    </div>
  )
}

// Helper to check if treatment has template support
export function hasTreatmentTemplate(treatmentName: string): boolean {
  return getTemplateType(treatmentName) !== null
}

// Helper to get empty data for a treatment type
export function getEmptyTemplateData(treatmentName: string): TreatmentTemplateData | null {
  const type = getTemplateType(treatmentName)
  if (type === 'facial') return { ...emptyFacialData }
  if (type === 'injectable') return { ...emptyInjectableData }
  return null
}

export default TreatmentTemplateSelector
