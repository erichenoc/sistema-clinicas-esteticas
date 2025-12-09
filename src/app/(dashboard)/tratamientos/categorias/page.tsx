export const dynamic = 'force-dynamic'

import { getCategories } from '@/actions/treatments'
import { CategoriasClient } from './_components/categorias-client'

export default async function CategoriasPage() {
  const categories = await getCategories()

  return <CategoriasClient categories={categories} />
}
