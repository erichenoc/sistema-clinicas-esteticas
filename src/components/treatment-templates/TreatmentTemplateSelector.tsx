'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Syringe, FileQuestion } from 'lucide-react'
import { FacialTreatmentTemplate } from './FacialTreatmentTemplate'
import { InjectableTreatmentTemplate } from './InjectableTreatmentTemplate'
import type {
  TreatmentTemplateType,
  TreatmentTemplateData,
  FacialTreatmentData,
  InjectableTreatmentData,
} from '@/types/treatment-templates'
import {
  inferTemplateType,
  inferFacialSubtype,
  inferInjectableSubtype,
} from '@/types/treatment-templates'

interface TreatmentTemplateSelectorProps {
  treatmentName: string
  categoryName: string | null
  patientName: string
  professionalName?: string
  initialData?: TreatmentTemplateData | null
  onChange: (data: TreatmentTemplateData) => void
  readOnly?: boolean
  sessionNumber?: number
  forceTemplateType?: TreatmentTemplateType | null
}

export function TreatmentTemplateSelector({
  treatmentName,
  categoryName,
  patientName,
  professionalName = '',
  initialData,
  onChange,
  readOnly = false,
  sessionNumber,
  forceTemplateType,
}: TreatmentTemplateSelectorProps) {
  // Determinar el tipo de plantilla
  const [templateType, setTemplateType] = useState<TreatmentTemplateType | null>(() => {
    if (forceTemplateType !== undefined) return forceTemplateType
    if (initialData) return initialData.templateType
    return inferTemplateType(treatmentName, categoryName)
  })

  // Estado para los datos de cada plantilla
  const [facialData, setFacialData] = useState<FacialTreatmentData>(() => {
    if (initialData?.templateType === 'facial') {
      return initialData as FacialTreatmentData
    }
    return {
      templateType: 'facial',
      patientName,
      patientAllergies: '',
      treatmentArea: 'Rostro completo',
      sessions: [{
        sessionNumber: 1,
        date: new Date().toISOString().split('T')[0],
        facialType: inferFacialSubtype(treatmentName),
        peelingUsed: '',
        peelingTime: 0,
        mesotherapyProducts: '',
        maskUsed: '',
        maskTime: 0,
        otherProducts: '',
        observations: '',
      }],
    }
  })

  const [injectableData, setInjectableData] = useState<InjectableTreatmentData>(() => {
    if (initialData?.templateType === 'injectable') {
      return initialData as InjectableTreatmentData
    }
    return {
      templateType: 'injectable',
      patientName,
      professionalName,
      sessions: [{
        sessionNumber: 1,
        date: new Date().toISOString().split('T')[0],
        treatmentSubtype: inferInjectableSubtype(treatmentName),
        injectionPoints: [],
        productBrand: '',
        productLot: '',
        observations: '',
        recommendations: '',
      }],
    }
  })

  // Notificar cambios
  useEffect(() => {
    if (templateType === 'facial') {
      onChange(facialData)
    } else if (templateType === 'injectable') {
      onChange(injectableData)
    }
  }, [facialData, injectableData, templateType, onChange])

  // Actualizar cuando cambian los props de paciente/profesional
  useEffect(() => {
    setFacialData((prev) => ({ ...prev, patientName }))
    setInjectableData((prev) => ({ ...prev, patientName, professionalName }))
  }, [patientName, professionalName])

  // Si no hay tipo de plantilla detectado
  if (!templateType) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-muted-foreground" />
            Seleccionar Plantilla de Tratamiento
          </CardTitle>
          <CardDescription>
            Este tratamiento no tiene una plantilla predefinida. Selecciona el tipo de plantilla que deseas usar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card
              className="cursor-pointer hover:border-[#A67C52] transition-colors"
              onClick={() => setTemplateType('facial')}
            >
              <CardContent className="pt-6 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-[#A67C52]" />
                <h3 className="font-semibold mb-1">Tratamientos Faciales</h3>
                <p className="text-sm text-muted-foreground">
                  Limpieza facial, Dermapen, Mesoterapia, Peelings
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-[#A67C52] transition-colors"
              onClick={() => setTemplateType('injectable')}
            >
              <CardContent className="pt-6 text-center">
                <Syringe className="h-12 w-12 mx-auto mb-3 text-[#A67C52]" />
                <h3 className="font-semibold mb-1">Tratamientos Inyectables</h3>
                <p className="text-sm text-muted-foreground">
                  Rellenos HA, Bioestimuladores, Hilos, Botox
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Permitir cambiar entre plantillas si no es readOnly
  if (!readOnly) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Plantilla detectada
            </Badge>
          </div>
          <Tabs
            value={templateType}
            onValueChange={(v) => setTemplateType(v as TreatmentTemplateType)}
          >
            <TabsList className="h-8">
              <TabsTrigger value="facial" className="text-xs px-2 h-6">
                <Sparkles className="h-3 w-3 mr-1" />
                Facial
              </TabsTrigger>
              <TabsTrigger value="injectable" className="text-xs px-2 h-6">
                <Syringe className="h-3 w-3 mr-1" />
                Inyectable
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {templateType === 'facial' && (
          <FacialTreatmentTemplate
            data={facialData}
            onChange={setFacialData}
            readOnly={readOnly}
            sessionNumber={sessionNumber}
          />
        )}

        {templateType === 'injectable' && (
          <InjectableTreatmentTemplate
            data={injectableData}
            onChange={setInjectableData}
            readOnly={readOnly}
            sessionNumber={sessionNumber}
          />
        )}
      </div>
    )
  }

  // Vista de solo lectura
  return (
    <>
      {templateType === 'facial' && (
        <FacialTreatmentTemplate
          data={facialData}
          onChange={setFacialData}
          readOnly={true}
          sessionNumber={sessionNumber}
        />
      )}

      {templateType === 'injectable' && (
        <InjectableTreatmentTemplate
          data={injectableData}
          onChange={setInjectableData}
          readOnly={true}
          sessionNumber={sessionNumber}
        />
      )}
    </>
  )
}

export default TreatmentTemplateSelector
