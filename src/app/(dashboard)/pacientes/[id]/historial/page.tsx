import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPatientById, getMedicalHistory } from '@/actions/medical-history'
import { MedicalHistoryPageClient } from './medical-history-page-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MedicalHistoryPage({ params }: PageProps) {
  const { id } = await params

  const [patient, medicalHistory] = await Promise.all([
    getPatientById(id),
    getMedicalHistory(id),
  ])

  if (!patient) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/pacientes/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Historial Médico</h1>
          <p className="text-muted-foreground">
            {patient.first_name} {patient.last_name}
          </p>
        </div>
      </div>

      {/* Medical History Form */}
      <MedicalHistoryPageClient
        patientId={id}
        patientName={`${patient.first_name} ${patient.last_name}`}
        initialData={medicalHistory ? {
          allergies: medicalHistory.allergies || [],
          currentMedications: medicalHistory.current_medications || [],
          chronicConditions: medicalHistory.chronic_conditions || [],
          previousSurgeries: medicalHistory.previous_surgeries || [],
          previousAestheticTreatments: medicalHistory.previous_aesthetic_treatments || [],
          isPregnant: medicalHistory.is_pregnant ?? false,
          isBreastfeeding: medicalHistory.is_breastfeeding ?? false,
          usesRetinoids: medicalHistory.uses_retinoids ?? false,
          sunExposureLevel: medicalHistory.sun_exposure_level || '',
          additionalNotes: medicalHistory.additional_notes || '',
          skinTypeFitzpatrick: medicalHistory.skin_type_fitzpatrick || '',
          hasPacemaker: false,
          hasMetalImplants: false,
          hasKeloidTendency: false,
          isSmoker: false,
        } : undefined}
      />
    </div>
  )
}
