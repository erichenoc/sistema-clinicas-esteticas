export const revalidate = 30

import { TreatmentsClient } from './_components/treatments-client'
import { getTreatments, getCategories } from '@/actions/treatments'
import type { TreatmentListItem } from '@/types/treatments'

export default async function TratamientosPage() {
  const [dbTreatments, dbCategories] = await Promise.all([
    getTreatments(),
    getCategories(),
  ])

  // Transform to expected format for components
  const treatments: TreatmentListItem[] = dbTreatments.map((t) => ({
    id: t.id,
    name: t.name,
    categoryName: t.category_name,
    categoryColor: t.category_color,
    price: t.price,
    durationMinutes: t.duration_minutes,
    isActive: t.is_active,
    imageUrl: t.image_url,
  }))

  const categories = dbCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    color: c.color,
    treatmentCount: c.treatment_count,
  }))

  return <TreatmentsClient treatments={treatments} categories={categories} />
}
