'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { MedicalHistoryEnhanced, type MedicalHistoryFormData } from '../../_components/medical-history-enhanced'
import { saveMedicalHistory } from '@/actions/medical-history'
import { toast } from 'sonner'

interface MedicalHistoryPageClientProps {
  patientId: string
  patientName: string
  initialData?: Partial<MedicalHistoryFormData>
}

export function MedicalHistoryPageClient({
  patientId,
  patientName,
  initialData,
}: MedicalHistoryPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSave = async (data: MedicalHistoryFormData) => {
    startTransition(async () => {
      try {
        await saveMedicalHistory({
          patient_id: patientId,
          allergies: data.allergies,
          current_medications: data.currentMedications,
          chronic_conditions: data.chronicConditions,
          previous_surgeries: data.previousSurgeries,
          previous_aesthetic_treatments: data.previousAestheticTreatments,
          is_pregnant: data.isPregnant,
          is_breastfeeding: data.isBreastfeeding,
          uses_retinoids: data.usesRetinoids,
          sun_exposure_level: data.sunExposureLevel,
          additional_notes: data.additionalNotes,
          skin_type_fitzpatrick: data.skinTypeFitzpatrick,
        })

        toast.success('Historial médico guardado correctamente')
        router.refresh()
      } catch {
        toast.error('Error al guardar el historial médico')
        throw new Error('Failed to save')
      }
    })
  }

  return (
    <MedicalHistoryEnhanced
      patientId={patientId}
      patientName={patientName}
      initialData={initialData}
      onSave={handleSave}
      mode="full"
    />
  )
}
