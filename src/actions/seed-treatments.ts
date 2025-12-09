'use server'

import { createCategory, createTreatment, getCategories } from './treatments'

// Tratamientos de drapamelamoquete.com
const FACIAL_TREATMENTS = [
  { name: 'HIFU Facial', description: 'Ultrasonido focalizado de alta intensidad para rejuvenecimiento y lifting facial no invasivo', duration: 60, price: 15000, sessions: 1 },
  { name: 'Limpieza Facial Profunda', description: 'Limpieza profesional del rostro con extracción de impurezas y tratamiento hidratante', duration: 60, price: 2500, sessions: 1 },
  { name: 'Microdermoabrasión Facial', description: 'Exfoliación mecánica para renovación celular y mejora de la textura de la piel', duration: 45, price: 3500, sessions: 6 },
  { name: 'Transdermoterapia', description: 'Técnica de penetración de activos mediante electroterapia para máxima absorción', duration: 45, price: 4000, sessions: 6 },
  { name: 'Dermapen', description: 'Microneedling para estimular la producción de colágeno y elastina', duration: 45, price: 5000, sessions: 4 },
  { name: 'Mesoterapia Facial', description: 'Microinyecciones de vitaminas y ácido hialurónico para revitalización facial', duration: 30, price: 4500, sessions: 4 },
  { name: 'Peelings Faciales', description: 'Exfoliación química para renovación celular y tratamiento de manchas', duration: 45, price: 3000, sessions: 4 },
  { name: 'Tratamiento para Espinillas', description: 'Tratamiento especializado para acné y control de grasa', duration: 60, price: 3500, sessions: 6 },
  { name: 'Tratamiento para Manchas', description: 'Protocolo despigmentante para unificar el tono de la piel', duration: 45, price: 4000, sessions: 6 },
  { name: 'Rejuvenecimiento Lifting Facial', description: 'Protocolo integral de rejuvenecimiento con efecto tensor', duration: 90, price: 8000, sessions: 4 },
  { name: 'Rellenos Faciales', description: 'Aplicación de ácido hialurónico para restaurar volumen y definir contornos', duration: 45, price: 12000, sessions: 1 },
  { name: 'Toxina Botulínica', description: 'Tratamiento para líneas de expresión y arrugas dinámicas', duration: 30, price: 10000, sessions: 1 },
  { name: 'Hilos Tensores Facial', description: 'Lifting no quirúrgico con hilos de PDO para efecto tensor inmediato', duration: 60, price: 25000, sessions: 1 },
  { name: 'Terapia de Inducción de Colágeno', description: 'Estimulación de la producción natural de colágeno para rejuvenecimiento', duration: 45, price: 5500, sessions: 4 },
  { name: 'Radiofrecuencia Facial', description: 'Tratamiento térmico para tensar la piel y estimular colágeno', duration: 45, price: 4000, sessions: 8 },
  { name: 'Aumento de Labios', description: 'Relleno con ácido hialurónico para labios más voluminosos y definidos', duration: 30, price: 8000, sessions: 1 },
  { name: 'Perfilado de Nariz', description: 'Rinomodelación sin cirugía con ácido hialurónico', duration: 30, price: 10000, sessions: 1 },
]

const CORPORAL_TREATMENTS = [
  { name: 'Emsculpt', description: 'Tecnología electromagnética para tonificación muscular y reducción de grasa', duration: 30, price: 8000, sessions: 4 },
  { name: 'Tratamiento para Estrías', description: 'Protocolo para atenuar y mejorar la apariencia de estrías', duration: 45, price: 4000, sessions: 6 },
  { name: 'Tratamiento para Celulitis', description: 'Protocolo integral para combatir la celulitis y mejorar la textura de la piel', duration: 60, price: 4500, sessions: 10 },
  { name: 'Tratamiento para Varices', description: 'Escleroterapia y tratamientos para arañas vasculares y varices', duration: 30, price: 3500, sessions: 3 },
  { name: 'Lipoláser', description: 'Lipólisis láser para reducción de grasa localizada no invasiva', duration: 45, price: 6000, sessions: 6 },
  { name: 'Tratamiento para Alopecia', description: 'Protocolo para estimular el crecimiento capilar y fortalecer el cabello', duration: 45, price: 5000, sessions: 8 },
  { name: 'Tratamiento para Hiperhidrosis', description: 'Control de sudoración excesiva con toxina botulínica', duration: 30, price: 12000, sessions: 1 },
  { name: 'Vacuumterapia', description: 'Masaje por vacío para mejorar circulación y reducir celulitis', duration: 45, price: 2500, sessions: 10 },
  { name: 'Tratamiento Flacidez Corporal', description: 'Protocolo para reafirmar y tonificar la piel del cuerpo', duration: 60, price: 4500, sessions: 8 },
  { name: 'Drenaje Linfático', description: 'Masaje especializado para eliminar líquidos y toxinas', duration: 60, price: 2500, sessions: 10 },
  { name: 'Peelings Corporales', description: 'Exfoliación química corporal para renovación y luminosidad', duration: 60, price: 3500, sessions: 4 },
  { name: 'Eliminación de Cicatrices', description: 'Tratamiento para mejorar la apariencia de cicatrices', duration: 45, price: 4500, sessions: 6 },
  { name: 'Ultracavitación Corporal', description: 'Ultrasonido de baja frecuencia para eliminar grasa localizada', duration: 45, price: 3500, sessions: 10 },
  { name: 'Blanqueamiento Corporal', description: 'Tratamiento para unificar el tono de la piel del cuerpo', duration: 60, price: 4000, sessions: 6 },
  { name: 'Radiofrecuencia Corporal', description: 'Tratamiento térmico para reafirmar y tensar la piel del cuerpo', duration: 45, price: 4000, sessions: 8 },
  { name: 'Eliminación de Queloides', description: 'Tratamiento especializado para reducir cicatrices queloides', duration: 30, price: 5000, sessions: 4 },
  { name: 'Exfoliaciones y Envolturas', description: 'Tratamiento corporal detox con exfoliación y envoltura nutritiva', duration: 75, price: 3500, sessions: 4 },
  { name: 'Microdermoabrasión Corporal', description: 'Exfoliación mecánica corporal para renovación celular', duration: 60, price: 4000, sessions: 6 },
  { name: 'Tratamientos Reductores de Grasa', description: 'Protocolos combinados para reducción de medidas', duration: 60, price: 4500, sessions: 10 },
  { name: 'Masajes Relajantes y Terapéuticos', description: 'Masajes profesionales para relajación y bienestar', duration: 60, price: 2000, sessions: 1 },
  { name: 'Electrocauterización de Verrugas', description: 'Eliminación de verrugas mediante electrocauterio', duration: 30, price: 1500, sessions: 1 },
  { name: 'Regeneración con Factores de Crecimiento', description: 'Plasma rico en plaquetas para regeneración tisular', duration: 45, price: 8000, sessions: 3 },
]

// Imágenes placeholder por categoría (usando URLs de Unsplash)
const FACIAL_IMAGE_BASE = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop' // facial treatment
const CORPORAL_IMAGE_BASE = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop' // body treatment

export async function seedTreatments(): Promise<{ success: boolean; message: string; created: number }> {
  let createdCount = 0

  try {
    // Primero, verificar si ya existen las categorías
    const existingCategories = await getCategories()

    let facialCategoryId: string | null = null
    let corporalCategoryId: string | null = null

    // Buscar o crear categoría Facial
    const existingFacial = existingCategories.find(c => c.name.toLowerCase().includes('facial'))
    if (existingFacial) {
      facialCategoryId = existingFacial.id
    } else {
      const facialResult = await createCategory({
        name: 'Tratamientos Faciales',
        description: 'Tratamientos estéticos para el rostro',
        color: '#EC4899', // Pink
        icon: 'sparkles',
        sort_order: 1,
      })
      if (facialResult.data) {
        facialCategoryId = facialResult.data.id
      }
    }

    // Buscar o crear categoría Corporal
    const existingCorporal = existingCategories.find(c => c.name.toLowerCase().includes('corporal') || c.name.toLowerCase().includes('cuerpo'))
    if (existingCorporal) {
      corporalCategoryId = existingCorporal.id
    } else {
      const corporalResult = await createCategory({
        name: 'Tratamientos Corporales',
        description: 'Tratamientos estéticos para el cuerpo',
        color: '#8B5CF6', // Purple
        icon: 'activity',
        sort_order: 2,
      })
      if (corporalResult.data) {
        corporalCategoryId = corporalResult.data.id
      }
    }

    // Crear tratamientos faciales
    for (const treatment of FACIAL_TREATMENTS) {
      const result = await createTreatment({
        name: treatment.name,
        description: treatment.description,
        duration_minutes: treatment.duration,
        price: treatment.price,
        recommended_sessions: treatment.sessions,
        category_id: facialCategoryId || undefined,
        image_url: `${FACIAL_IMAGE_BASE}&sig=${encodeURIComponent(treatment.name)}`,
        is_active: true,
        is_public: true,
      })

      if (result.data) {
        createdCount++
      }
    }

    // Crear tratamientos corporales
    for (const treatment of CORPORAL_TREATMENTS) {
      const result = await createTreatment({
        name: treatment.name,
        description: treatment.description,
        duration_minutes: treatment.duration,
        price: treatment.price,
        recommended_sessions: treatment.sessions,
        category_id: corporalCategoryId || undefined,
        image_url: `${CORPORAL_IMAGE_BASE}&sig=${encodeURIComponent(treatment.name)}`,
        is_active: true,
        is_public: true,
      })

      if (result.data) {
        createdCount++
      }
    }

    return {
      success: true,
      message: `Se crearon ${createdCount} tratamientos exitosamente`,
      created: createdCount,
    }
  } catch (error) {
    console.error('Error seeding treatments:', error)
    return {
      success: false,
      message: `Error al crear tratamientos: ${error}`,
      created: createdCount,
    }
  }
}
