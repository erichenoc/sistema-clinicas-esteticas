'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipos de Alertas
export type AlertType =
  | 'stock_low'
  | 'stock_critical'
  | 'product_expiring'
  | 'product_expired'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'payment_pending'
  | 'payment_overdue'
  | 'commission_pending'
  | 'document_expiring'
  | 'consent_expiring'
  | 'goal_achieved'
  | 'system'

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical'
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed'

export interface Alert {
  id: string
  clinicId: string
  type: AlertType
  priority: AlertPriority
  status: AlertStatus
  title: string
  message: string
  referenceType: string | null
  referenceId: string | null
  link: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  acknowledgedAt: string | null
  acknowledgedBy: string | null
  resolvedAt: string | null
  expiresAt: string | null
}

export interface CreateAlertInput {
  type: AlertType
  priority: AlertPriority
  title: string
  message: string
  referenceType?: string
  referenceId?: string
  link?: string
  metadata?: Record<string, unknown>
  expiresAt?: string
}

const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001'

// =============================================
// OBTENER ALERTAS
// =============================================

export async function getAlerts(options?: {
  type?: AlertType
  priority?: AlertPriority
  status?: AlertStatus
  limit?: number
}): Promise<Alert[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('system_alerts')
    .select('*')
    .eq('clinic_id', DEFAULT_CLINIC_ID)
    .order('created_at', { ascending: false })

  if (options?.type) {
    query = query.eq('type', options.type)
  }
  if (options?.priority) {
    query = query.eq('priority', options.priority)
  }
  if (options?.status) {
    query = query.eq('status', options.status)
  } else {
    // Por defecto solo mostrar alertas activas
    query = query.in('status', ['active', 'acknowledged'])
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching alerts:', error)
    // Si la tabla no existe, retornar array vacio
    return []
  }

  return (data || []).map(transformAlert)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformAlert(data: any): Alert {
  return {
    id: data.id,
    clinicId: data.clinic_id,
    type: data.type,
    priority: data.priority,
    status: data.status,
    title: data.title,
    message: data.message,
    referenceType: data.reference_type,
    referenceId: data.reference_id,
    link: data.link,
    metadata: data.metadata,
    createdAt: data.created_at,
    acknowledgedAt: data.acknowledged_at,
    acknowledgedBy: data.acknowledged_by,
    resolvedAt: data.resolved_at,
    expiresAt: data.expires_at,
  }
}

// =============================================
// CREAR ALERTA
// =============================================

export async function createAlert(
  input: CreateAlertInput
): Promise<{ data: Alert | null; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('system_alerts')
    .insert({
      clinic_id: DEFAULT_CLINIC_ID,
      type: input.type,
      priority: input.priority,
      status: 'active',
      title: input.title,
      message: input.message,
      reference_type: input.referenceType || null,
      reference_id: input.referenceId || null,
      link: input.link || null,
      metadata: input.metadata || null,
      expires_at: input.expiresAt || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating alert:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/')
  return { data: transformAlert(data), error: null }
}

// =============================================
// ACCIONES DE ALERTAS
// =============================================

export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('system_alerts')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
    })
    .eq('id', alertId)

  if (error) {
    console.error('Error acknowledging alert:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  return { success: true, error: null }
}

export async function resolveAlert(
  alertId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('system_alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', alertId)

  if (error) {
    console.error('Error resolving alert:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  return { success: true, error: null }
}

export async function dismissAlert(
  alertId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('system_alerts')
    .update({
      status: 'dismissed',
    })
    .eq('id', alertId)

  if (error) {
    console.error('Error dismissing alert:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  return { success: true, error: null }
}

// =============================================
// GENERAR ALERTAS AUTOMÁTICAS
// =============================================

export async function generateInventoryAlerts(): Promise<number> {
  const supabase = createAdminClient()
  let alertsCreated = 0

  // Obtener productos con stock bajo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products } = await (supabase as any)
    .from('products')
    .select('id, name, current_stock, min_stock')
    .eq('is_active', true)

  for (const product of products || []) {
    if (product.current_stock <= 0) {
      // Stock agotado - crítico
      await createAlert({
        type: 'stock_critical',
        priority: 'critical',
        title: 'Stock agotado',
        message: `${product.name} no tiene stock disponible`,
        referenceType: 'product',
        referenceId: product.id,
        link: '/inventario',
      })
      alertsCreated++
    } else if (product.current_stock <= product.min_stock) {
      // Stock bajo
      await createAlert({
        type: 'stock_low',
        priority: 'high',
        title: 'Stock bajo',
        message: `${product.name} tiene ${product.current_stock} unidades (minimo: ${product.min_stock})`,
        referenceType: 'product',
        referenceId: product.id,
        link: '/inventario',
      })
      alertsCreated++
    }
  }

  // Obtener lotes por vencer
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lots } = await (supabase as any)
    .from('product_lots')
    .select(`
      id,
      lot_number,
      expiry_date,
      current_quantity,
      products (name)
    `)
    .gt('current_quantity', 0)
    .lte('expiry_date', thirtyDaysFromNow.toISOString())

  for (const lot of lots || []) {
    const expiryDate = new Date(lot.expiry_date)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry <= 0) {
      await createAlert({
        type: 'product_expired',
        priority: 'critical',
        title: 'Producto vencido',
        message: `Lote ${lot.lot_number} de ${lot.products?.name} ha vencido`,
        referenceType: 'lot',
        referenceId: lot.id,
        link: '/inventario/lotes',
      })
    } else {
      await createAlert({
        type: 'product_expiring',
        priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
        title: 'Producto por vencer',
        message: `Lote ${lot.lot_number} de ${lot.products?.name} vence en ${daysUntilExpiry} dias`,
        referenceType: 'lot',
        referenceId: lot.id,
        link: '/inventario/lotes',
      })
    }
    alertsCreated++
  }

  return alertsCreated
}

export async function generateCommissionAlerts(): Promise<number> {
  const supabase = createAdminClient()
  let alertsCreated = 0

  // Obtener comisiones pendientes por mas de 30 dias
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pendingCommissions } = await (supabase as any)
    .from('commissions')
    .select('id, professional_id, commission_amount, created_at')
    .eq('status', 'pending')
    .lte('created_at', thirtyDaysAgo.toISOString())

  if ((pendingCommissions || []).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalAmount = pendingCommissions.reduce((sum: number, c: any) => sum + c.commission_amount, 0)

    await createAlert({
      type: 'commission_pending',
      priority: 'medium',
      title: 'Comisiones pendientes',
      message: `Hay ${pendingCommissions.length} comisiones pendientes por un total de RD$${totalAmount.toLocaleString()}`,
      link: '/profesionales/comisiones',
    })
    alertsCreated++
  }

  return alertsCreated
}

// =============================================
// ESTADÍSTICAS DE ALERTAS
// =============================================

export async function getAlertStats(): Promise<{
  total: number
  byPriority: Record<string, number>
  byType: Record<string, number>
  critical: number
  high: number
}> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('system_alerts')
    .select('id, type, priority')
    .eq('clinic_id', DEFAULT_CLINIC_ID)
    .in('status', ['active', 'acknowledged'])

  const alerts = data || []
  const byPriority: Record<string, number> = {}
  const byType: Record<string, number> = {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  alerts.forEach((a: any) => {
    byPriority[a.priority] = (byPriority[a.priority] || 0) + 1
    byType[a.type] = (byType[a.type] || 0) + 1
  })

  return {
    total: alerts.length,
    byPriority,
    byType,
    critical: byPriority['critical'] || 0,
    high: byPriority['high'] || 0,
  }
}
