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

  // Query from users table where is_professional = true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('users')
    .select('*')
    .eq('is_professional', true)
    .order('first_name', { ascending: true })

  // Filter by is_active if status is provided
  if (options?.status === 'active') {
    query = query.eq('is_active', true)
  } else if (options?.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching professionals:', error)
    return []
  }

  // Transform users data to ProfessionalSummaryData format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((user: any) => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
    return {
      id: user.id,
      clinic_id: user.clinic_id,
      user_id: user.id,
      professional_code: null,
      license_number: user.license_number,
      license_expiry: null,
      specialties: user.specialty ? user.specialty.split(', ') : [],
      title: null,
      bio: null,
      employment_type: 'employee',
      hire_date: null,
      termination_date: null,
      base_salary: null,
      salary_type: 'monthly',
      default_commission_rate: 15,
      commission_type: 'percentage',
      max_daily_appointments: 20,
      appointment_buffer_minutes: 15,
      accepts_walk_ins: true,
      can_view_all_patients: false,
      can_modify_prices: false,
      can_give_discounts: false,
      max_discount_percent: 0,
      status: user.is_active ? 'active' as ProfessionalStatus : 'inactive' as ProfessionalStatus,
      profile_image_url: user.avatar_url,
      signature_image_url: null,
      display_order: 0,
      show_on_booking: true,
      created_at: user.created_at,
      updated_at: user.updated_at,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || null,
      full_name: fullName || 'Profesional',
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

  // Query from users table where is_professional = true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: user, error } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', id)
    .eq('is_professional', true)
    .single()

  if (error) {
    console.error('Error fetching professional:', error)
    return null
  }

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  return {
    id: user.id,
    clinic_id: user.clinic_id,
    user_id: user.id,
    professional_code: null,
    license_number: user.license_number,
    license_expiry: null,
    specialties: user.specialty ? user.specialty.split(', ') : [],
    title: null,
    bio: null,
    employment_type: 'employee',
    hire_date: null,
    termination_date: null,
    base_salary: null,
    salary_type: 'monthly',
    default_commission_rate: 15,
    commission_type: 'percentage',
    max_daily_appointments: 20,
    appointment_buffer_minutes: 15,
    accepts_walk_ins: true,
    can_view_all_patients: false,
    can_modify_prices: false,
    can_give_discounts: false,
    max_discount_percent: 0,
    status: user.is_active ? 'active' as ProfessionalStatus : 'inactive' as ProfessionalStatus,
    profile_image_url: user.avatar_url,
    signature_image_url: null,
    display_order: 0,
    show_on_booking: true,
    created_at: user.created_at,
    updated_at: user.updated_at,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: user.phone || null,
    full_name: fullName || 'Profesional',
    appointments_this_month: 0,
    revenue_this_month: 0,
    average_rating: 0,
    total_ratings: 0,
    treatments_count: 0,
  }
}

// =============================================
// CREAR/ACTUALIZAR PROFESIONAL
// =============================================

export interface CreateProfessionalInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  title?: string
  licenseNumber?: string
  specialties?: string[]
  bio?: string
  employmentType?: string
  hireDate?: string
  baseSalary?: number
  salaryType?: string
  commissionRate?: number
  commissionType?: string
  maxDailyAppointments?: number
  appointmentBufferMinutes?: number
  acceptsWalkIns?: boolean
  canViewAllPatients?: boolean
  canModifyPrices?: boolean
  canGiveDiscounts?: boolean
  maxDiscountPercent?: number
  showOnBooking?: boolean
}

const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001'

export async function createProfessional(
  input: CreateProfessionalInput
): Promise<{ data: ProfessionalSummaryData | null; error: string | null }> {
  const supabase = createAdminClient()

  try {
    // Crear el usuario como profesional en la tabla users
    const userId = crypto.randomUUID()
    const fullName = `${input.firstName} ${input.lastName}`.trim()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user, error: userError } = await (supabase as any)
      .from('users')
      .insert({
        id: userId,
        clinic_id: DEFAULT_CLINIC_ID,
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone || null,
        role: 'professional',
        is_professional: true,
        is_active: true,
        specialty: input.specialties?.join(', ') || null,
        license_number: input.licenseNumber || null,
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating professional:', userError)
      return { data: null, error: 'Error al crear el profesional' }
    }

    revalidatePath('/profesionales')

    // Return a simplified professional data object
    return {
      data: {
        id: user.id,
        clinic_id: user.clinic_id,
        user_id: user.id,
        professional_code: null,
        license_number: user.license_number,
        license_expiry: null,
        specialties: input.specialties || [],
        title: input.title || null,
        bio: input.bio || null,
        employment_type: input.employmentType || 'employee',
        hire_date: null,
        termination_date: null,
        base_salary: null,
        salary_type: 'monthly',
        default_commission_rate: 15,
        commission_type: 'percentage',
        max_daily_appointments: 20,
        appointment_buffer_minutes: 15,
        accepts_walk_ins: true,
        can_view_all_patients: false,
        can_modify_prices: false,
        can_give_discounts: false,
        max_discount_percent: 0,
        status: 'active' as ProfessionalStatus,
        profile_image_url: null,
        signature_image_url: null,
        display_order: 0,
        show_on_booking: true,
        created_at: user.created_at,
        updated_at: user.updated_at,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone || null,
        full_name: input.title
          ? `${input.title} ${fullName}`
          : fullName,
        appointments_this_month: 0,
        revenue_this_month: 0,
        average_rating: 0,
        total_ratings: 0,
        treatments_count: 0,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error in createProfessional:', error)
    return { data: null, error: 'Error inesperado al crear el profesional' }
  }
}

export async function updateProfessional(
  id: string,
  input: Partial<CreateProfessionalInput>
): Promise<{ data: ProfessionalSummaryData | null; error: string | null }> {
  const supabase = createAdminClient()

  try {
    // Build update data for users table
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.firstName !== undefined) updateData.first_name = input.firstName
    if (input.lastName !== undefined) updateData.last_name = input.lastName
    if (input.email !== undefined) updateData.email = input.email
    if (input.phone !== undefined) updateData.phone = input.phone || null
    if (input.licenseNumber !== undefined) updateData.license_number = input.licenseNumber || null
    if (input.specialties !== undefined) updateData.specialty = input.specialties?.join(', ') || null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('is_professional', true)

    if (updateError) {
      console.error('Error updating professional:', updateError)
      return { data: null, error: 'Error al actualizar el profesional' }
    }

    // Obtener el profesional actualizado
    const updatedProfessional = await getProfessionalById(id)

    revalidatePath('/profesionales')
    revalidatePath(`/profesionales/${id}`)

    return { data: updatedProfessional, error: null }
  } catch (error) {
    console.error('Error in updateProfessional:', error)
    return { data: null, error: 'Error inesperado al actualizar el profesional' }
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

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('professional_commissions')
      .select('*')
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
    return (data || []).map((c: any) => ({
      ...c,
      professional_name: 'Profesional',
      reference_description: `${c.reference_type || 'N/A'} - ${c.reference_id || 'N/A'}`,
    }))
  } catch {
    // Table doesn't exist
    return []
  }
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

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('attendance_logs')
      .select('*')
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
    return (data || []).map((a: any) => ({
      ...a,
      professional_name: 'Profesional',
      branch_name: 'Sucursal Principal',
    }))
  } catch {
    // Table doesn't exist
    return []
  }
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

  // Query professionals from users table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: professionals } = await (supabase as any)
    .from('users')
    .select('id, is_active')
    .eq('is_professional', true)

  // Note: professional_commissions table may not exist, handle gracefully
  let commissions: { id: string; status: string; commission_amount: number }[] = []
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('professional_commissions')
      .select('id, status, commission_amount')
      .in('status', ['pending', 'approved'])
    commissions = data || []
  } catch {
    // Table doesn't exist, use empty array
  }

  const total = professionals?.length || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const active = professionals?.filter((p: any) => p.is_active === true).length || 0

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
