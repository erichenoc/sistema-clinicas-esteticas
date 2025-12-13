'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types
export type NotificationType =
  | 'appointment_new'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'stock_low'
  | 'quotation_sent'
  | 'quotation_accepted'
  | 'quotation_rejected'
  | 'quotation_expiring'
  | 'invoice_created'
  | 'payment_received'
  | 'system'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Notification {
  id: string
  clinic_id: string
  user_id?: string
  type: NotificationType
  title: string
  message: string
  link?: string
  reference_id?: string
  reference_type?: string
  is_read: boolean
  priority: NotificationPriority
  created_at: string
  read_at?: string
}

export interface CreateNotificationInput {
  user_id?: string
  type: NotificationType
  title: string
  message: string
  link?: string
  reference_id?: string
  reference_type?: string
  priority?: NotificationPriority
}

// Get notifications for the current clinic
export async function getNotifications(options?: {
  limit?: number
  unreadOnly?: boolean
  userId?: string
}): Promise<Notification[]> {
  const supabase = await createAdminClient()
  const clinicId = '00000000-0000-0000-0000-000000000001'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('notifications')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })

  if (options?.unreadOnly) {
    query = query.eq('is_read', false)
  }

  if (options?.userId) {
    query = query.or(`user_id.eq.${options.userId},user_id.is.null`)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('[Notifications] Error fetching:', error)
    return []
  }

  return data || []
}

// Get unread notification count
export async function getUnreadNotificationCount(userId?: string): Promise<number> {
  const supabase = await createAdminClient()
  const clinicId = '00000000-0000-0000-0000-000000000001'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .eq('is_read', false)

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`)
  }

  const { count, error } = await query

  if (error) {
    console.error('[Notifications] Error counting:', error)
    return 0
  }

  return count || 0
}

// Create a new notification
export async function createNotification(
  input: CreateNotificationInput
): Promise<{ success: boolean; notification?: Notification; error?: string }> {
  const supabase = await createAdminClient()
  const clinicId = '00000000-0000-0000-0000-000000000001'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('notifications')
    .insert({
      clinic_id: clinicId,
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      reference_id: input.reference_id,
      reference_type: input.reference_type,
      priority: input.priority || 'normal',
    })
    .select()
    .single()

  if (error) {
    console.error('[Notifications] Error creating:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true, notification: data }
}

// Mark notification as read
export async function markNotificationAsRead(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[Notifications] Error marking as read:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient()
  const clinicId = '00000000-0000-0000-0000-000000000001'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('clinic_id', clinicId)
    .eq('is_read', false)

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`)
  }

  const { error } = await query

  if (error) {
    console.error('[Notifications] Error marking all as read:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// Delete a notification
export async function deleteNotification(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Notifications] Error deleting:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// Delete old notifications (cleanup)
export async function deleteOldNotifications(
  daysOld: number = 30
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  const supabase = await createAdminClient()
  const clinicId = '00000000-0000-0000-0000-000000000001'

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('notifications')
    .delete()
    .eq('clinic_id', clinicId)
    .eq('is_read', true)
    .lt('created_at', cutoffDate.toISOString())
    .select('id')

  if (error) {
    console.error('[Notifications] Error deleting old:', error)
    return { success: false, error: error.message }
  }

  return { success: true, deletedCount: data?.length || 0 }
}

// Helper functions to create specific notification types
export async function notifyNewAppointment(
  patientName: string,
  appointmentId: string,
  dateTime: string,
  service: string
): Promise<void> {
  await createNotification({
    type: 'appointment_new',
    title: 'Nueva cita programada',
    message: `${patientName} - ${service} - ${dateTime}`,
    link: `/agenda/${appointmentId}`,
    reference_id: appointmentId,
    reference_type: 'appointment',
    priority: 'normal',
  })
}

export async function notifyLowStock(
  productName: string,
  productId: string,
  currentStock: number
): Promise<void> {
  await createNotification({
    type: 'stock_low',
    title: 'Stock bajo',
    message: `${productName} - Quedan ${currentStock} unidades`,
    link: `/inventario`,
    reference_id: productId,
    reference_type: 'product',
    priority: 'high',
  })
}

export async function notifyQuotationSent(
  quoteNumber: string,
  quotationId: string,
  clientName: string
): Promise<void> {
  await createNotification({
    type: 'quotation_sent',
    title: 'Cotizacion enviada',
    message: `${quoteNumber} enviada a ${clientName}`,
    link: `/facturacion/cotizaciones/${quotationId}`,
    reference_id: quotationId,
    reference_type: 'quotation',
    priority: 'normal',
  })
}

export async function notifyQuotationExpiring(
  quoteNumber: string,
  quotationId: string,
  clientName: string,
  daysLeft: number
): Promise<void> {
  await createNotification({
    type: 'quotation_expiring',
    title: 'Cotizacion proxima a vencer',
    message: `${quoteNumber} de ${clientName} vence en ${daysLeft} dias`,
    link: `/facturacion/cotizaciones/${quotationId}`,
    reference_id: quotationId,
    reference_type: 'quotation',
    priority: daysLeft <= 3 ? 'high' : 'normal',
  })
}

export async function notifyPaymentReceived(
  invoiceNumber: string,
  invoiceId: string,
  amount: number,
  currency: string
): Promise<void> {
  const currencySymbol = currency === 'DOP' ? 'RD$' : 'US$'
  await createNotification({
    type: 'payment_received',
    title: 'Pago recibido',
    message: `${invoiceNumber} - ${currencySymbol}${amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    link: `/facturacion/facturas/${invoiceId}`,
    reference_id: invoiceId,
    reference_type: 'invoice',
    priority: 'normal',
  })
}
