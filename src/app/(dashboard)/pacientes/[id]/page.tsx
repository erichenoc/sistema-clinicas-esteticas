import { notFound } from 'next/navigation'
import { getPatientWithMedicalHistory } from '@/actions/medical-history'
import { PatientProfileClient, type PatientData, type MedicalHistoryDbData } from './patient-profile-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PatientProfilePage({ params }: PageProps) {
  const { id } = await params

  const patientData = await getPatientWithMedicalHistory(id)

  if (!patientData) {
    notFound()
  }

  return (
    <PatientProfileClient
      patient={patientData as unknown as PatientData}
      medicalHistory={patientData.medicalHistory as MedicalHistoryDbData | null}
    />
  )
}
