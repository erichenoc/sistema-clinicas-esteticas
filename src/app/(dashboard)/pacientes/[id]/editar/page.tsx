import { notFound } from 'next/navigation'
import { getPatientById } from '@/actions/patients'
import { EditPatientForm } from './_components/edit-patient-form'

interface EditarPacientePageProps {
  params: Promise<{ id: string }>
}

export default async function EditarPacientePage({ params }: EditarPacientePageProps) {
  const { id } = await params

  const patient = await getPatientById(id)

  if (!patient) {
    notFound()
  }

  return <EditPatientForm patient={patient} />
}
