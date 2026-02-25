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
  job_title: string | null
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
    .limit(500)

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
      job_title: user.job_title || null,
      bio: null,
      employment_type: 'employee',
      hire_date: null,
      termination_date: null,
      base_salary: user.base_salary || null,
      salary_type: user.salary_type || 'monthly',
      default_commission_rate: user.commission_rate ?? 15,
      commission_type: user.commission_type || 'percentage',
      max_daily_appointments: user.max_daily_appointments || 20,
      appointment_buffer_minutes: user.appointment_buffer_minutes || 15,
      accepts_walk_ins: user.accepts_walk_ins ?? true,
      can_view_all_patients: user.can_view_all_patients ?? false,
      can_modify_prices: user.can_modify_prices ?? false,
      can_give_discounts: user.can_give_discounts ?? false,
      max_discount_percent: user.max_discount_percent || 0,
      status: user.is_active ? 'active' as ProfessionalStatus : 'inactive' as ProfessionalStatus,
      profile_image_url: user.avatar_url,
      signature_image_url: null,
      display_order: 0,
      show_on_booking: user.show_on_booking ?? true,
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
    title: user.title || null,
    job_title: user.job_title || null,
    bio: user.bio || null,
    employment_type: user.employment_type || 'employee',
    hire_date: user.hire_date || null,
    termination_date: null,
    base_salary: user.base_salary || null,
    salary_type: user.salary_type || 'monthly',
    default_commission_rate: user.commission_rate || 15,
    commission_type: user.commission_type || 'percentage',
    max_daily_appointments: user.max_daily_appointments || 20,
    appointment_buffer_minutes: user.appointment_buffer_minutes || 15,
    accepts_walk_ins: user.accepts_walk_ins ?? true,
    can_view_all_patients: user.can_view_all_patients ?? false,
    can_modify_prices: user.can_modify_prices ?? false,
    can_give_discounts: user.can_give_discounts ?? false,
    max_discount_percent: user.max_discount_percent || 0,
    status: user.is_active ? 'active' as ProfessionalStatus : 'inactive' as ProfessionalStatus,
    profile_image_url: user.avatar_url,
    signature_image_url: null,
    display_order: 0,
    show_on_booking: user.show_on_booking ?? true,
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
  jobTitle?: string
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
        job_title: input.jobTitle || null,
        base_salary: input.baseSalary || null,
        salary_type: input.salaryType || 'monthly',
        commission_rate: input.commissionRate ?? 15,
        commission_type: input.commissionType || 'percentage',
        employment_type: input.employmentType || 'employee',
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
        job_title: input.jobTitle || null,
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

export async function deleteProfessional(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const { isProtectedAccount } = await import('@/lib/auth/roles')

  // Protect system accounts from deletion/deactivation
  if (isProtectedAccount(id)) {
    return { success: false, error: 'Esta cuenta esta protegida y no puede ser eliminada' }
  }

  const supabase = createAdminClient()

  try {
    // Verify the account is not protected by email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: targetUser } = await (supabase as any)
      .from('users')
      .select('email')
      .eq('id', id)
      .single()

    if (targetUser && isProtectedAccount(targetUser.email)) {
      return { success: false, error: 'Esta cuenta esta protegida y no puede ser eliminada' }
    }

    // Soft delete: mark as not professional and inactive
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('users')
      .update({
        is_professional: false,
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('is_professional', true)

    if (error) {
      console.error('Error deleting professional:', error)
      return { success: false, error: 'Error al eliminar el profesional' }
    }

    revalidatePath('/profesionales')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error in deleteProfessional:', error)
    return { success: false, error: 'Error inesperado al eliminar el profesional' }
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

    // Datos personales
    if (input.firstName !== undefined) updateData.first_name = input.firstName
    if (input.lastName !== undefined) updateData.last_name = input.lastName
    if (input.email !== undefined) updateData.email = input.email
    if (input.phone !== undefined) updateData.phone = input.phone || null
    if (input.licenseNumber !== undefined) updateData.license_number = input.licenseNumber || null
    if (input.specialties !== undefined) updateData.specialty = input.specialties?.join(', ') || null
    if (input.bio !== undefined) updateData.bio = input.bio || null
    if (input.title !== undefined) updateData.title = input.title || null
    if (input.jobTitle !== undefined) updateData.job_title = input.jobTitle || null

    // Datos de empleo
    if (input.employmentType !== undefined) updateData.employment_type = input.employmentType
    if (input.hireDate !== undefined) updateData.hire_date = input.hireDate || null
    if (input.baseSalary !== undefined) updateData.base_salary = input.baseSalary || null
    if (input.salaryType !== undefined) updateData.salary_type = input.salaryType

    // Datos de comisión
    if (input.commissionRate !== undefined) updateData.commission_rate = input.commissionRate
    if (input.commissionType !== undefined) updateData.commission_type = input.commissionType

    // Configuración de citas
    if (input.maxDailyAppointments !== undefined) updateData.max_daily_appointments = input.maxDailyAppointments
    if (input.appointmentBufferMinutes !== undefined) updateData.appointment_buffer_minutes = input.appointmentBufferMinutes
    if (input.acceptsWalkIns !== undefined) updateData.accepts_walk_ins = input.acceptsWalkIns
    if (input.showOnBooking !== undefined) updateData.show_on_booking = input.showOnBooking

    // Permisos
    if (input.canViewAllPatients !== undefined) updateData.can_view_all_patients = input.canViewAllPatients
    if (input.canModifyPrices !== undefined) updateData.can_modify_prices = input.canModifyPrices
    if (input.canGiveDiscounts !== undefined) updateData.can_give_discounts = input.canGiveDiscounts
    if (input.maxDiscountPercent !== undefined) updateData.max_discount_percent = input.maxDiscountPercent

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

export interface CreateCommissionInput {
  professionalId: string
  referenceType?: string
  referenceId?: string
  baseAmount: number
  commissionRate: number
  periodStart?: string
  periodEnd?: string
  notes?: string
}

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
      .from('commissions')
      .select(`
        *,
        professional:professional_id (
          user_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(500)

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

export async function getAllCommissionsWithProfessionals(): Promise<{
  commissions: CommissionData[]
  professionals: { id: string; name: string; defaultRate: number }[]
}> {
  const supabase = createAdminClient()

  try {
    // Get all professionals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: users } = await (supabase as any)
      .from('users')
      .select('id, first_name, last_name, commission_rate')
      .eq('is_professional', true)
      .eq('is_active', true)
      .order('first_name', { ascending: true })
      .limit(500)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const professionals = (users || []).map((u: any) => ({
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Profesional',
      defaultRate: u.commission_rate || 15,
    }))

    // Get all commissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: commissions } = await (supabase as any)
      .from('commissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    // Map professional names to commissions
    const professionalMap = new Map(professionals.map((p: { id: string; name: string }) => [p.id, p.name]))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedCommissions = (commissions || []).map((c: any) => ({
      ...c,
      professional_name: professionalMap.get(c.professional_id) || 'Profesional',
      reference_description: `${c.reference_type || 'Manual'} - ${c.period_start || 'Sin período'}`,
    }))

    return { commissions: mappedCommissions, professionals }
  } catch (error) {
    console.error('Error fetching commissions with professionals:', error)
    return { commissions: [], professionals: [] }
  }
}

export async function createCommission(
  input: CreateCommissionInput
): Promise<{ data: CommissionData | null; error: string | null }> {
  const supabase = createAdminClient()

  try {
    const commissionAmount = input.baseAmount * (input.commissionRate / 100)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('commissions')
      .insert({
        clinic_id: DEFAULT_CLINIC_ID,
        professional_id: input.professionalId,
        reference_type: input.referenceType || 'manual',
        reference_id: input.referenceId || crypto.randomUUID(),
        base_amount: input.baseAmount,
        commission_rate: input.commissionRate,
        commission_amount: commissionAmount,
        status: 'pending',
        period_start: input.periodStart || null,
        period_end: input.periodEnd || null,
        notes: input.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating commission:', error)
      return { data: null, error: 'Error al crear la comisión' }
    }

    revalidatePath('/profesionales/comisiones')
    return {
      data: {
        ...data,
        professional_name: 'Profesional',
        reference_description: `${data.reference_type} - ${data.period_start || 'Sin período'}`,
      },
      error: null
    }
  } catch (error) {
    console.error('Error in createCommission:', error)
    return { data: null, error: 'Error inesperado al crear la comisión' }
  }
}

export async function updateCommission(
  id: string,
  input: Partial<CreateCommissionInput> & { status?: CommissionStatus }
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  try {
    const updateData: Record<string, unknown> = {}

    if (input.baseAmount !== undefined) updateData.base_amount = input.baseAmount
    if (input.commissionRate !== undefined) updateData.commission_rate = input.commissionRate
    if (input.baseAmount !== undefined && input.commissionRate !== undefined) {
      updateData.commission_amount = input.baseAmount * (input.commissionRate / 100)
    }
    if (input.periodStart !== undefined) updateData.period_start = input.periodStart
    if (input.periodEnd !== undefined) updateData.period_end = input.periodEnd
    if (input.notes !== undefined) updateData.notes = input.notes
    if (input.status !== undefined) {
      updateData.status = input.status
      if (input.status === 'paid') {
        updateData.paid_at = new Date().toISOString()
      } else if (input.status === 'approved') {
        updateData.approved_at = new Date().toISOString()
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('commissions')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating commission:', error)
      return { success: false, error: 'Error al actualizar la comisión' }
    }

    revalidatePath('/profesionales/comisiones')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error in updateCommission:', error)
    return { success: false, error: 'Error inesperado al actualizar la comisión' }
  }
}

export async function deleteCommission(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('commissions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting commission:', error)
      return { success: false, error: 'Error al eliminar la comisión' }
    }

    revalidatePath('/profesionales/comisiones')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error in deleteCommission:', error)
    return { success: false, error: 'Error inesperado al eliminar la comisión' }
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
    .from('commissions')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating commission:', error)
    return { success: false, error: 'Error al actualizar la comision' }
  }

  revalidatePath('/profesionales')
  revalidatePath('/profesionales/comisiones')
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
      .limit(500)

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
    .limit(500)

  // Note: commissions table may not exist, handle gracefully
  let commissions: { id: string; status: string; commission_amount: number }[] = []
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('commissions')
      .select('id, status, commission_amount')
      .in('status', ['pending', 'approved'])
      .limit(500)
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

// =============================================
// HORARIOS
// =============================================

export interface DaySchedule {
  enabled: boolean
  start: string
  end: string
  breaks: { start: string; end: string }[]
}

export interface WeekSchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

export async function getProfessionalSchedule(professionalId: string): Promise<WeekSchedule | null> {
  const supabase = createAdminClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('professional_schedules')
      .select('*')
      .eq('professional_id', professionalId)
      .limit(7)

    if (error) {
      console.error('Error fetching schedule:', error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    // Convert database records to WeekSchedule format
    const dayMap: Record<number, keyof WeekSchedule> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    }

    const defaultDaySchedule: DaySchedule = {
      enabled: false,
      start: '09:00',
      end: '18:00',
      breaks: [],
    }

    const schedule: WeekSchedule = {
      monday: { ...defaultDaySchedule },
      tuesday: { ...defaultDaySchedule },
      wednesday: { ...defaultDaySchedule },
      thursday: { ...defaultDaySchedule },
      friday: { ...defaultDaySchedule },
      saturday: { ...defaultDaySchedule },
      sunday: { ...defaultDaySchedule },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((record: any) => {
      const dayName = dayMap[record.day_of_week]
      if (dayName) {
        schedule[dayName] = {
          enabled: record.is_active,
          start: record.start_time?.substring(0, 5) || '09:00',
          end: record.end_time?.substring(0, 5) || '18:00',
          breaks: record.break_start && record.break_end
            ? [{ start: record.break_start.substring(0, 5), end: record.break_end.substring(0, 5) }]
            : [],
        }
      }
    })

    return schedule
  } catch {
    return null
  }
}

export async function saveProfessionalSchedule(
  professionalId: string,
  schedule: WeekSchedule
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  const dayMap: Record<keyof WeekSchedule, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }

  try {
    // Delete existing schedules for this professional
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('professional_schedules')
      .delete()
      .eq('professional_id', professionalId)

    // Insert new schedules
    const records = Object.entries(schedule).map(([day, daySchedule]) => ({
      clinic_id: '00000000-0000-0000-0000-000000000001',
      professional_id: professionalId,
      day_of_week: dayMap[day as keyof WeekSchedule],
      start_time: daySchedule.start + ':00',
      end_time: daySchedule.end + ':00',
      break_start: daySchedule.breaks[0]?.start ? daySchedule.breaks[0].start + ':00' : null,
      break_end: daySchedule.breaks[0]?.end ? daySchedule.breaks[0].end + ':00' : null,
      is_active: daySchedule.enabled,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('professional_schedules')
      .insert(records)

    if (error) {
      console.error('Error saving schedule:', error)
      return { success: false, error: 'Error al guardar los horarios' }
    }

    revalidatePath(`/profesionales/${professionalId}/horarios`)
    return { success: true, error: null }
  } catch (error) {
    console.error('Error in saveProfessionalSchedule:', error)
    return { success: false, error: 'Error inesperado al guardar los horarios' }
  }
}
