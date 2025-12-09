export const dynamic = 'force-dynamic'

import { getSessions, getSessionStats } from '@/actions/sessions'
import { getUsers } from '@/actions/users'
import { SesionesClient } from './_components/sesiones-client'
import type { SessionListItem, TreatedZone, ProductUsed } from '@/types/sessions'

export default async function SesionesPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const [dbSessions, dbStats, dbUsers] = await Promise.all([
    getSessions({ startDate: todayISO }),
    getSessionStats(),
    getUsers(),
  ])

  // Transform sessions data from snake_case to camelCase
  const sessions: SessionListItem[] = dbSessions.map((s) => ({
    id: s.id,
    clinicId: s.clinic_id,
    branchId: s.branch_id,
    appointmentId: s.appointment_id,
    patientId: s.patient_id,
    professionalId: s.professional_id,
    treatmentId: s.treatment_id,
    treatmentName: s.treatment_name,
    packageSessionId: s.package_session_id,
    startedAt: s.started_at,
    endedAt: s.ended_at,
    durationMinutes: s.duration_minutes,
    status: s.status,
    treatedZones: (s.treated_zones || []) as TreatedZone[],
    technicalParameters: (s.technical_parameters || {}) as Record<string, unknown>,
    productsUsed: (s.products_used || []) as ProductUsed[],
    observations: s.observations,
    patientFeedback: s.patient_feedback,
    adverseReactions: s.adverse_reactions,
    resultRating: s.result_rating,
    resultNotes: s.result_notes,
    patientSignatureUrl: s.patient_signature_url,
    professionalSignatureUrl: s.professional_signature_url,
    signedAt: s.signed_at,
    followUpRequired: s.follow_up_required,
    followUpNotes: s.follow_up_notes,
    nextSessionRecommendedAt: s.next_session_recommended_at,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    createdBy: s.created_by,
    patientName: s.patient_name,
    patientPhone: s.patient_phone,
    patientAvatar: s.patient_avatar,
    professionalName: s.professional_name,
    treatmentDisplayName: s.treatment_display_name,
    treatmentPrice: s.treatment_price,
    categoryName: s.category_name,
    categoryColor: s.category_color,
    appointmentScheduledAt: null,
    imageCount: s.image_count,
    totalProductCost: s.total_product_cost,
  }))

  // Get professionals from users with role professional or admin
  const professionals = dbUsers
    .filter((u) => u.role === 'professional' || u.role === 'admin')
    .map((u) => ({
      id: u.id,
      name: u.full_name || u.email,
    }))

  // Calculate stats
  const completedToday = sessions.filter((s) => s.status === 'completed').length
  const todayRevenue = sessions
    .filter((s) => s.status === 'completed')
    .reduce((acc, s) => acc + (s.treatmentPrice || 0), 0)
  const productCost = sessions
    .filter((s) => s.status === 'completed')
    .reduce((acc, s) => acc + s.totalProductCost, 0)

  const stats = {
    inProgress: dbStats.inProgress,
    completedToday,
    totalToday: sessions.length,
    todayRevenue,
    productCost,
  }

  return (
    <SesionesClient
      sessions={sessions}
      professionals={professionals}
      stats={stats}
    />
  )
}
