'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipos
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled' | 'disputed'

export interface CommissionSummary {
  professionalId: string
  professionalName: string
  periodMonth: string
  pendingCount: number
  approvedCount: number
  paidCount: number
  pendingAmount: number
  approvedAmount: number
  paidAmount: number
  totalAmount: number
  totalBaseAmount: number
}

export interface CommissionDetail {
  id: string
  clinicId: string
  professionalId: string
  professionalName: string
  referenceType: string
  referenceId: string
  baseAmount: number
  commissionRate: number
  commissionAmount: number
  status: CommissionStatus
  periodStart: string | null
  periodEnd: string | null
  createdAt: string
  approvedAt: string | null
  paidAt: string | null
  notes: string | null
}

export interface CommissionSettings {
  id: string
  clinicId: string
  defaultCommissionRate: number
  autoCalculate: boolean
  autoApprove: boolean
  paymentPeriod: string
  paymentDay: number
  notifyOnCreated: boolean
  notifyOnApproved: boolean
  notifyOnPaid: boolean
}

const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001'

// =============================================
// OBTENER COMISIONES
// =============================================

export async function getCommissionSummary(options?: {
  startDate?: string
  endDate?: string
}): Promise<CommissionSummary[]> {
  const supabase = createAdminClient()

  const startDate = options?.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const endDate = options?.endDate || new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('commissions')
    .select(`
      id,
      professional_id,
      base_amount,
      commission_amount,
      status,
      created_at
    `)
    .eq('clinic_id', DEFAULT_CLINIC_ID)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (error) {
    console.error('Error fetching commission summary:', error)
    return []
  }

  // Obtener nombres de profesionales
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users } = await (supabase as any)
    .from('users')
    .select('id, first_name, last_name')
    .eq('is_professional', true)

  const userMap = new Map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (users || []).map((u: any) => [u.id, `${u.first_name || ''} ${u.last_name || ''}`.trim()])
  )

  // Agrupar por profesional
  const summaryMap = new Map<string, CommissionSummary>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(data || []).forEach((c: any) => {
    const key = c.professional_id
    const existing = summaryMap.get(key) || {
      professionalId: c.professional_id,
      professionalName: userMap.get(c.professional_id) || 'Profesional',
      periodMonth: new Date(c.created_at).toISOString().substring(0, 7),
      pendingCount: 0,
      approvedCount: 0,
      paidCount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      paidAmount: 0,
      totalAmount: 0,
      totalBaseAmount: 0,
    }

    if (c.status === 'pending') {
      existing.pendingCount++
      existing.pendingAmount += c.commission_amount || 0
    } else if (c.status === 'approved') {
      existing.approvedCount++
      existing.approvedAmount += c.commission_amount || 0
    } else if (c.status === 'paid') {
      existing.paidCount++
      existing.paidAmount += c.commission_amount || 0
    }

    existing.totalAmount += c.commission_amount || 0
    existing.totalBaseAmount += c.base_amount || 0

    summaryMap.set(key, existing)
  })

  return Array.from(summaryMap.values())
}

export async function getCommissionDetails(options?: {
  professionalId?: string
  status?: CommissionStatus
  startDate?: string
  endDate?: string
  limit?: number
}): Promise<CommissionDetail[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('commissions')
    .select('*')
    .eq('clinic_id', DEFAULT_CLINIC_ID)
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
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching commission details:', error)
    return []
  }

  // Obtener nombres de profesionales
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users } = await (supabase as any)
    .from('users')
    .select('id, first_name, last_name')
    .eq('is_professional', true)

  const userMap = new Map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (users || []).map((u: any) => [u.id, `${u.first_name || ''} ${u.last_name || ''}`.trim()])
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((c: any) => ({
    id: c.id,
    clinicId: c.clinic_id,
    professionalId: c.professional_id,
    professionalName: userMap.get(c.professional_id) || 'Profesional',
    referenceType: c.reference_type,
    referenceId: c.reference_id,
    baseAmount: c.base_amount,
    commissionRate: c.commission_rate,
    commissionAmount: c.commission_amount,
    status: c.status,
    periodStart: c.period_start,
    periodEnd: c.period_end,
    createdAt: c.created_at,
    approvedAt: c.approved_at,
    paidAt: c.paid_at,
    notes: c.notes,
  }))
}

// =============================================
// ACCIONES DE COMISIONES
// =============================================

export async function approveCommissions(
  commissionIds: string[],
  approvedBy: string
): Promise<{ success: boolean; count: number; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('commissions')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    })
    .in('id', commissionIds)
    .eq('status', 'pending')
    .select('id')

  if (error) {
    console.error('Error approving commissions:', error)
    return { success: false, count: 0, error: error.message }
  }

  revalidatePath('/profesionales/comisiones')
  return { success: true, count: data?.length || 0, error: null }
}

export async function payCommissions(
  commissionIds: string[],
  paidBy: string,
  paymentReference?: string
): Promise<{ success: boolean; count: number; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('commissions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      paid_by: paidBy,
      payment_date: new Date().toISOString().split('T')[0],
      payment_reference: paymentReference || null,
    })
    .in('id', commissionIds)
    .eq('status', 'approved')
    .select('id')

  if (error) {
    console.error('Error paying commissions:', error)
    return { success: false, count: 0, error: error.message }
  }

  revalidatePath('/profesionales/comisiones')
  return { success: true, count: data?.length || 0, error: null }
}

export async function cancelCommission(
  commissionId: string,
  reason: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('commissions')
    .update({
      status: 'cancelled',
      notes: reason,
    })
    .eq('id', commissionId)

  if (error) {
    console.error('Error cancelling commission:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/profesionales/comisiones')
  return { success: true, error: null }
}

// =============================================
// CONFIGURACIÓN DE COMISIONES
// =============================================

export async function getCommissionSettings(): Promise<CommissionSettings | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('clinic_commission_settings')
    .select('*')
    .eq('clinic_id', DEFAULT_CLINIC_ID)
    .single()

  if (error) {
    // Si no existe, crear configuración por defecto
    if (error.code === 'PGRST116') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newData, error: insertError } = await (supabase as any)
        .from('clinic_commission_settings')
        .insert({
          clinic_id: DEFAULT_CLINIC_ID,
          default_commission_rate: 15,
          auto_calculate: true,
          auto_approve: false,
          payment_period: 'monthly',
          payment_day: 15,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating commission settings:', insertError)
        return null
      }

      return transformSettings(newData)
    }
    console.error('Error fetching commission settings:', error)
    return null
  }

  return transformSettings(data)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformSettings(data: any): CommissionSettings {
  return {
    id: data.id,
    clinicId: data.clinic_id,
    defaultCommissionRate: data.default_commission_rate,
    autoCalculate: data.auto_calculate,
    autoApprove: data.auto_approve,
    paymentPeriod: data.payment_period,
    paymentDay: data.payment_day,
    notifyOnCreated: data.notify_on_commission_created,
    notifyOnApproved: data.notify_on_commission_approved,
    notifyOnPaid: data.notify_on_commission_paid,
  }
}

export async function updateCommissionSettings(
  settings: Partial<CommissionSettings>
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (settings.defaultCommissionRate !== undefined) {
    updateData.default_commission_rate = settings.defaultCommissionRate
  }
  if (settings.autoCalculate !== undefined) {
    updateData.auto_calculate = settings.autoCalculate
  }
  if (settings.autoApprove !== undefined) {
    updateData.auto_approve = settings.autoApprove
  }
  if (settings.paymentPeriod !== undefined) {
    updateData.payment_period = settings.paymentPeriod
  }
  if (settings.paymentDay !== undefined) {
    updateData.payment_day = settings.paymentDay
  }
  if (settings.notifyOnCreated !== undefined) {
    updateData.notify_on_commission_created = settings.notifyOnCreated
  }
  if (settings.notifyOnApproved !== undefined) {
    updateData.notify_on_commission_approved = settings.notifyOnApproved
  }
  if (settings.notifyOnPaid !== undefined) {
    updateData.notify_on_commission_paid = settings.notifyOnPaid
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('clinic_commission_settings')
    .update(updateData)
    .eq('clinic_id', DEFAULT_CLINIC_ID)

  if (error) {
    console.error('Error updating commission settings:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/configuracion')
  return { success: true, error: null }
}

// =============================================
// CALCULAR COMISIONES MANUALMENTE
// =============================================

export async function calculateManualCommission(input: {
  professionalId: string
  baseAmount: number
  commissionRate: number
  referenceType?: string
  referenceId?: string
  notes?: string
}): Promise<{ success: boolean; commissionId?: string; error: string | null }> {
  const supabase = createAdminClient()

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
      period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
      notes: input.notes || 'Comisión manual',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating manual commission:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/profesionales/comisiones')
  return { success: true, commissionId: data.id, error: null }
}

// =============================================
// ESTADÍSTICAS DE COMISIONES
// =============================================

export async function getCommissionStats(): Promise<{
  totalPending: number
  totalApproved: number
  totalPaid: number
  pendingAmount: number
  approvedAmount: number
  paidThisMonth: number
}> {
  const supabase = createAdminClient()

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('commissions')
    .select('status, commission_amount, paid_at')
    .eq('clinic_id', DEFAULT_CLINIC_ID)

  let totalPending = 0
  let totalApproved = 0
  let totalPaid = 0
  let pendingAmount = 0
  let approvedAmount = 0
  let paidThisMonth = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(data || []).forEach((c: any) => {
    const amount = c.commission_amount || 0
    if (c.status === 'pending') {
      totalPending++
      pendingAmount += amount
    } else if (c.status === 'approved') {
      totalApproved++
      approvedAmount += amount
    } else if (c.status === 'paid') {
      totalPaid++
      if (c.paid_at && c.paid_at >= startOfMonth) {
        paidThisMonth += amount
      }
    }
  })

  return {
    totalPending,
    totalApproved,
    totalPaid,
    pendingAmount,
    approvedAmount,
    paidThisMonth,
  }
}
