export const dynamic = 'force-dynamic'

import {
  getPOSTreatments,
  getPOSPackages,
  getPOSProducts,
  getPOSPatients,
} from '@/actions/pos'
import { POSClient } from './_components/pos-client'

export default async function POSPage() {
  const [dbTreatments, dbPackages, dbProducts, dbPatients] = await Promise.all([
    getPOSTreatments(),
    getPOSPackages(),
    getPOSProducts(),
    getPOSPatients(),
  ])

  // Transform treatments data
  const treatments = dbTreatments.map((t) => ({
    id: t.id,
    name: t.name,
    price: t.price,
    category: t.category,
    color: t.color,
  }))

  // Transform packages data (snake_case from DB to camelCase for frontend)
  const packages = dbPackages.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.original_price,
    sessions: p.sessions,
  }))

  // Transform products data
  const products = dbProducts.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
  }))

  // Transform patients data (POSPatient from actions uses string | null)
  const patients = dbPatients.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    email: p.email,
    credit: p.credit,
  }))

  return (
    <POSClient
      treatments={treatments}
      packages={packages}
      products={products}
      patients={patients}
    />
  )
}
