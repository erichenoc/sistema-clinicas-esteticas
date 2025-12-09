'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipos
export type ProfessionalStatus = 'active' | 'inactive' | 'vacation' | 'suspended' | 'terminated'
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled' | 'disputed'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave' | 'vacation' | 'sick' | 'holiday' | 'work_from_home' | 'partial'

export interface ProfessionalData {
  id: string
  clinic_id: string
  user_id: string
  professional_code: string | null
  license_number: string | null
  license_expiry: string | null
  specialties: string[]
  title: string | null
  bio: string | null
  employment_type: string
  hire_date: string | null
  termination_date: string | null
  base_salary: number | null
  salary_type: string
  default_commission_rate: number
  commission_type: string
  max_daily_appointments: number
  appointment_buffer_minutes: number
  accepts_walk_ins: boolean
  can_view_all_patients: boolean
  can_modify_prices: boolean
  can_give_discounts: boolean
  max_discount_percent: number
  status: ProfessionalStatus
  profile_image_url: string | null
  signature_image_url: string | null
  display_order: number
  show_on_booking: boolean
  created_at: string
  updated_at: string
}

export interface ProfessionalSummaryData extends ProfessionalData {
  first_name: string
  last_name: string
  email: string
  phone: string | null
  full_name: string
  appointments_this_month: number
  revenue_this_month: number
  average_rating: number
  total_ratings: number
  treatments_count: number
}

export interface CommissionData {
  id: string
  clinic_id: string
  professional_id: string
  reference_type: string
  reference_id: string
  commission_rule_id: string | null
  base_amount: number
  commission_rate: number
  commission_amount: number
  status: CommissionStatus
  period_start: string | null
  period_end: string | null
  payment_date: string | null
  payment_reference: string | null
  notes: string | null
  created_at: string
  approved_at: string | null
  approved_by: string | null
  paid_at: string | null
  paid_by: string | null
  professional_name: string
  reference_description: string
}

export interface AttendanceData {
  id: string
  clinic_id: string
  professional_id: string
  branch_id: string | null
  date: string
  clock_in: string | null
  clock_in_method: string | null
  clock_in_notes: string | null
  clock_out: string | null
  clock_out_method: string | null
  clock_out_notes: string | null
  break_minutes: number
  scheduled_hours: number | null
  worked_hours: number | null
  overtime_hours: number
  status: AttendanceStatus
  notes: string | null
  created_at: string
  updated_at: string
  approved_by: string | null
  professional_name: string
  branch_name: string | null
}

// =============================================
// PROFESIONALES
// =============================================

export async function getProfessionals(options?: {
  status?: ProfessionalStatus
}): Promise<ProfessionalSummaryData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('professional_profiles')
    .select(`
      *,
      users (
        id,
        full_name,
        email,
        phone,
        avatar_url
      )
    `)
    .order('display_order', { ascending: true })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching professionals:', error)
    return []
  }

  // Transform data and add computed stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((p: any) => {
    const nameParts = p.users?.full_name?.split(' ') || ['', '']
    return {
      ...p,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: p.users?.email || '',
      phone: p.users?.phone || null,
      full_name: p.title
        ? `${p.title} ${p.users?.full_name || ''}`
        : p.users?.full_name || 'Profesional',
      // TODO: Calculate from real data
      appointments_this_month: 0,
      revenue_this_month: 0,
      average_rating: 0,
      total_ratings: 0,
      treatments_count: 0,
    }
  })
}

export async function getProfessionalById(id: string): Promise<ProfessionalSummaryData | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('professional_profiles')
    .select(`
      *,
      users (
        id,
        full_name,
        email,
        phone,
        avatar_url
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching professional:', error)
    return null
  }

  const nameParts = data.users?.full_name?.split(' ') || ['', '']
  return {
    ...data,
    first_name: nameParts[0] || '',
    last_name: nameParts.slice(1).join(' ') || '',
    email: data.users?.email || '',
    phone: data.users?.phone || null,
    full_name: data.title
      ? `${data.title} ${data.users?.full_name || ''}`
      : data.users?.full_name || 'Profesional',
    appointments_this_month: 0,
    revenue_this_month: 0,
    average_rating: 0,
    total_ratings: 0,
    treatments_count: 0,
  }
}

// =============================================
// COMISIONES
// =============================================

export async function getCommissions(options?: {
  professionalId?: string
  status?: CommissionStatus
  startDate?: string
  endDate?: string
}): Promise<CommissionData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('professional_commissions')
    .select(`
      *,
      professional_profiles (
        id,
        title,
        users (full_name)
      )
    `)
    .order('created_at', { ascending: false })

  if (options?.professionalId) {
    query = query.eq('professional_id', options.professionalId)
  }
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.startDate) {
    query = query.gte('created_at', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching commissions:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((c: any) => {
    const profName = c.professional_profiles?.users?.full_name || 'Profesional'
    const title = c.professional_profiles?.title
    return {
      ...c,
      professional_name: title ? `${title} ${profName}` : profName,
      reference_description: `${c.reference_type} - ${c.reference_id}`,
    }
  })
}

export async function updateCommissionStatus(
  id: string,
  status: CommissionStatus,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'approved') {
    updateData.approved_at = new Date().toISOString()
    updateData.approved_by = userId
  } else if (status === 'paid') {
    updateData.paid_at = new Date().toISOString()
    updateData.paid_by = userId
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('professional_commissions')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating commission:', error)
    return { success: false, error: 'Error al actualizar la comision' }
  }

  revalidatePath('/profesionales')
  return { success: true, error: null }
}

// =============================================
// ASISTENCIA
// =============================================

export async function getAttendanceLogs(options?: {
  professionalId?: string
  date?: string
  startDate?: string
  endDate?: string
}): Promise<AttendanceData[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('attendance_logs')
    .select(`
      *,
      professional_profiles (
        id,
        title,
        users (full_name)
      ),
      branches (name)
    `)
    .order('date', { ascending: false })
    .order('clock_in', { ascending: false })

  if (options?.professionalId) {
    query = query.eq('professional_id', options.professionalId)
  }
  if (options?.date) {
    query = query.eq('date', options.date)
  }
  if (options?.startDate) {
    query = query.gte('date', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('date', options.endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching attendance logs:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((a: any) => {
    const profName = a.professional_profiles?.users?.full_name || 'Profesional'
    const title = a.professional_profiles?.title
    return {
      ...a,
      professional_name: title ? `${title} ${profName}` : profName,
      branch_name: a.branches?.name || 'Sucursal Principal',
    }
  })
}

export async function clockIn(
  professionalId: string,
  method: string = 'app',
  notes?: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('attendance_logs')
    .insert({
      clinic_id: '00000000-0000-0000-0000-000000000001',
      professional_id: professionalId,
      date: today,
      clock_in: now,
      clock_in_method: method,
      clock_in_notes: notes,
      status: 'present',
    })

  if (error) {
    console.error('Error clocking in:', error)
    return { success: false, error: 'Error al registrar entrada' }
  }

  revalidatePath('/profesionales')
  return { success: true, error: null }
}

export async function clockOut(
  attendanceId: string,
  method: string = 'app',
  notes?: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('attendance_logs')
    .update({
      clock_out: now,
      clock_out_method: method,
      clock_out_notes: notes,
      updated_at: now,
    })
    .eq('id', attendanceId)

  if (error) {
    console.error('Error clocking out:', error)
    return { success: false, error: 'Error al registrar salida' }
  }

  revalidatePath('/profesionales')
  return { success: true, error: null }
}

// =============================================
// ESTADISTICAS
// =============================================

export async function getProfessionalStats(): Promise<{
  total: number
  active: number
  pending_commissions: number
  pending_amount: number
  month_revenue: number
  month_appointments: number
}> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: professionals } = await (supabase as any)
    .from('professional_profiles')
    .select('id, status')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: commissions } = await (supabase as any)
    .from('professional_commissions')
    .select('id, status, commission_amount')
    .in('status', ['pending', 'approved'])

  const total = professionals?.length || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const active = professionals?.filter((p: any) => p.status === 'active').length || 0

  const pendingCommissions = commissions?.length || 0
  const pendingAmount = commissions?.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, c: any) => sum + (c.commission_amount || 0),
    0
  ) || 0

  return {
    total,
    active,
    pending_commissions: pendingCommissions,
    pending_amount: pendingAmount,
    month_revenue: 0, // TODO: Calculate from sessions/sales
    month_appointments: 0, // TODO: Calculate from appointments
  }
}
