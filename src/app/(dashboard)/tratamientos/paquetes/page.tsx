export const revalidate = 30

import { getPackages, getTreatmentsForPackages } from '@/actions/treatments'
import { PaquetesClient } from './_components/paquetes-client'

export default async function PaquetesPage() {
  const [packages, treatments] = await Promise.all([
    getPackages(),
    getTreatmentsForPackages(),
  ])

  return <PaquetesClient packages={packages} treatments={treatments} />
}
