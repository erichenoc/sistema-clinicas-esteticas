import { getClinicSettings, getBranches } from '@/actions/settings'
import { SettingsClient } from './_components/settings-client'

export default async function ConfiguracionPage() {
  // Obtener datos de la base de datos
  const [clinic, branches] = await Promise.all([
    getClinicSettings(),
    getBranches(),
  ])

  return <SettingsClient initialClinic={clinic} initialBranches={branches} />
}
