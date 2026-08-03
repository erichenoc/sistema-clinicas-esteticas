// Datos en vivo detras de login: no se prerenderiza ni se cachea
export const dynamic = 'force-dynamic'

import { getPackages, getTreatmentsForPackages } from '@/actions/treatments'
import { PaquetesClient } from './_components/paquetes-client'

export default async function PaquetesPage() {
  const [packages, treatments] = await Promise.all([
    getPackages(),
    getTreatmentsForPackages(),
  ])

  return <PaquetesClient packages={packages} treatments={treatments} />
}
