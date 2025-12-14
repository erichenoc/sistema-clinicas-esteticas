'use server'

import { createAdminClient } from '@/lib/supabase/server'

// =============================================
// TIPOS
// =============================================

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  dateRange?: {
    start: string
    end: string
  }
  filters?: Record<string, unknown>
}

export interface ReportData {
  title: string
  subtitle?: string
  generatedAt: string
  headers: string[]
  rows: (string | number)[][]
  summary?: Record<string, string | number>
}

const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001'

// =============================================
// EXPORTAR REPORTE FINANCIERO
// =============================================

export async function exportFinancialReport(options: ExportOptions): Promise<ReportData> {
  const supabase = createAdminClient()

  const startDate = options.dateRange?.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const endDate = options.dateRange?.end || new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sales } = await (supabase as any)
    .from('sales')
    .select(`
      id,
      sale_number,
      created_at,
      subtotal,
      discount_amount,
      tax_amount,
      total,
      status,
      payment_status,
      patients (first_name, last_name)
    `)
    .eq('clinic_id', DEFAULT_CLINIC_ID)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  const headers = [
    'Numero',
    'Fecha',
    'Paciente',
    'Subtotal',
    'Descuento',
    'Impuesto',
    'Total',
    'Estado',
    'Pago'
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (sales || []).map((sale: any) => [
    sale.sale_number || sale.id.substring(0, 8),
    new Date(sale.created_at).toLocaleDateString('es-DO'),
    sale.patients ? `${sale.patients.first_name} ${sale.patients.last_name}` : 'N/A',
    sale.subtotal?.toFixed(2) || '0.00',
    sale.discount_amount?.toFixed(2) || '0.00',
    sale.tax_amount?.toFixed(2) || '0.00',
    sale.total?.toFixed(2) || '0.00',
    sale.status || 'N/A',
    sale.payment_status || 'N/A'
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalRevenue = (sales || []).reduce((sum: number, s: any) => sum + (s.total || 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalDiscount = (sales || []).reduce((sum: number, s: any) => sum + (s.discount_amount || 0), 0)

  return {
    title: 'Reporte Financiero',
    subtitle: `Del ${new Date(startDate).toLocaleDateString('es-DO')} al ${new Date(endDate).toLocaleDateString('es-DO')}`,
    generatedAt: new Date().toISOString(),
    headers,
    rows,
    summary: {
      'Total Ventas': (sales || []).length,
      'Ingresos Totales': `RD$${totalRevenue.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      'Descuentos Totales': `RD$${totalDiscount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    }
  }
}

// =============================================
// EXPORTAR REPORTE DE PACIENTES
// =============================================

export async function exportPatientsReport(options: ExportOptions): Promise<ReportData> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: patients } = await (supabase as any)
    .from('patients')
    .select('*')
    .eq('clinic_id', DEFAULT_CLINIC_ID)
    .order('created_at', { ascending: false })

  const headers = [
    'Codigo',
    'Nombre',
    'Email',
    'Telefono',
    'Fecha Nacimiento',
    'Genero',
    'Estado',
    'Fecha Registro'
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (patients || []).map((p: any) => [
    p.patient_code || p.id.substring(0, 8),
    `${p.first_name} ${p.last_name}`,
    p.email || 'N/A',
    p.phone || 'N/A',
    p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('es-DO') : 'N/A',
    p.gender || 'N/A',
    p.status || 'active',
    new Date(p.created_at).toLocaleDateString('es-DO')
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeCount = (patients || []).filter((p: any) => p.status === 'active').length

  return {
    title: 'Reporte de Pacientes',
    generatedAt: new Date().toISOString(),
    headers,
    rows,
    summary: {
      'Total Pacientes': (patients || []).length,
      'Pacientes Activos': activeCount,
      'Pacientes Inactivos': (patients || []).length - activeCount,
    }
  }
}

// =============================================
// EXPORTAR REPORTE DE CITAS
// =============================================

export async function exportAppointmentsReport(options: ExportOptions): Promise<ReportData> {
  const supabase = createAdminClient()

  const startDate = options.dateRange?.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const endDate = options.dateRange?.end || new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select(`
      id,
      start_time,
      end_time,
      status,
      notes,
      patients (first_name, last_name),
      treatments (name)
    `)
    .eq('clinic_id', DEFAULT_CLINIC_ID)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .order('start_time', { ascending: false })

  const headers = [
    'Fecha',
    'Hora',
    'Paciente',
    'Tratamiento',
    'Duracion (min)',
    'Estado',
    'Notas'
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (appointments || []).map((a: any) => {
    const startTime = new Date(a.start_time)
    const endTime = new Date(a.end_time)
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

    return [
      startTime.toLocaleDateString('es-DO'),
      startTime.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : 'N/A',
      a.treatments?.name || 'N/A',
      duration,
      a.status || 'N/A',
      a.notes || ''
    ]
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completed = (appointments || []).filter((a: any) => a.status === 'completed').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cancelled = (appointments || []).filter((a: any) => a.status === 'cancelled').length

  return {
    title: 'Reporte de Citas',
    subtitle: `Del ${new Date(startDate).toLocaleDateString('es-DO')} al ${new Date(endDate).toLocaleDateString('es-DO')}`,
    generatedAt: new Date().toISOString(),
    headers,
    rows,
    summary: {
      'Total Citas': (appointments || []).length,
      'Completadas': completed,
      'Canceladas': cancelled,
      'Tasa de Cumplimiento': `${((completed / (appointments || []).length) * 100 || 0).toFixed(1)}%`,
    }
  }
}

// =============================================
// EXPORTAR REPORTE DE COMISIONES
// =============================================

export async function exportCommissionsReport(options: ExportOptions): Promise<ReportData> {
  const supabase = createAdminClient()

  const startDate = options.dateRange?.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const endDate = options.dateRange?.end || new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: commissions } = await (supabase as any)
    .from('commissions')
    .select('*')
    .eq('clinic_id', DEFAULT_CLINIC_ID)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

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

  const headers = [
    'Fecha',
    'Profesional',
    'Tipo',
    'Monto Base',
    'Tasa (%)',
    'Comision',
    'Estado'
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (commissions || []).map((c: any) => [
    new Date(c.created_at).toLocaleDateString('es-DO'),
    userMap.get(c.professional_id) || 'Profesional',
    c.reference_type || 'N/A',
    c.base_amount?.toFixed(2) || '0.00',
    c.commission_rate?.toFixed(1) || '0',
    c.commission_amount?.toFixed(2) || '0.00',
    c.status || 'pending'
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalCommission = (commissions || []).reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingAmount = (commissions || []).filter((c: any) => c.status === 'pending').reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0)

  return {
    title: 'Reporte de Comisiones',
    subtitle: `Del ${new Date(startDate).toLocaleDateString('es-DO')} al ${new Date(endDate).toLocaleDateString('es-DO')}`,
    generatedAt: new Date().toISOString(),
    headers,
    rows,
    summary: {
      'Total Comisiones': (commissions || []).length,
      'Monto Total': `RD$${totalCommission.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      'Pendiente de Pago': `RD$${pendingAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    }
  }
}

// =============================================
// EXPORTAR REPORTE DE INVENTARIO
// =============================================

export async function exportInventoryReport(options: ExportOptions): Promise<ReportData> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products } = await (supabase as any)
    .from('products')
    .select(`
      *,
      product_categories (name)
    `)
    .eq('clinic_id', DEFAULT_CLINIC_ID)
    .order('name', { ascending: true })

  const headers = [
    'SKU',
    'Nombre',
    'Categoria',
    'Stock Actual',
    'Stock Minimo',
    'Costo',
    'Precio',
    'Valor Inventario',
    'Estado'
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (products || []).map((p: any) => {
    const inventoryValue = (p.current_stock || 0) * (p.cost_price || 0)
    let status = 'OK'
    if (p.current_stock <= 0) status = 'AGOTADO'
    else if (p.current_stock <= p.min_stock) status = 'BAJO'

    return [
      p.sku || 'N/A',
      p.name,
      p.product_categories?.name || 'Sin categoria',
      p.current_stock || 0,
      p.min_stock || 0,
      p.cost_price?.toFixed(2) || '0.00',
      p.sale_price?.toFixed(2) || '0.00',
      inventoryValue.toFixed(2),
      status
    ]
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalValue = (products || []).reduce((sum: number, p: any) => sum + ((p.current_stock || 0) * (p.cost_price || 0)), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lowStock = (products || []).filter((p: any) => p.current_stock <= p.min_stock).length

  return {
    title: 'Reporte de Inventario',
    generatedAt: new Date().toISOString(),
    headers,
    rows,
    summary: {
      'Total Productos': (products || []).length,
      'Productos con Stock Bajo': lowStock,
      'Valor Total Inventario': `RD$${totalValue.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    }
  }
}

// =============================================
// EXPORTAR REPORTE DE PROFESIONALES
// =============================================

export async function exportProfessionalsReport(options: ExportOptions): Promise<ReportData> {
  const supabase = createAdminClient()

  const startDate = options.dateRange?.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const endDate = options.dateRange?.end || new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: professionals } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('clinic_id', DEFAULT_CLINIC_ID)
    .eq('is_professional', true)
    .order('first_name', { ascending: true })

  // Obtener citas por profesional
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select('professional_id, status')
    .gte('start_time', startDate)
    .lte('start_time', endDate)

  // Contar citas por profesional
  const appointmentCounts: Record<string, { total: number; completed: number }> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(appointments || []).forEach((a: any) => {
    if (!appointmentCounts[a.professional_id]) {
      appointmentCounts[a.professional_id] = { total: 0, completed: 0 }
    }
    appointmentCounts[a.professional_id].total++
    if (a.status === 'completed') {
      appointmentCounts[a.professional_id].completed++
    }
  })

  // Obtener comisiones por profesional
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: commissions } = await (supabase as any)
    .from('commissions')
    .select('professional_id, commission_amount')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  const commissionTotals: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(commissions || []).forEach((c: any) => {
    commissionTotals[c.professional_id] = (commissionTotals[c.professional_id] || 0) + (c.commission_amount || 0)
  })

  const headers = [
    'Nombre',
    'Email',
    'Especialidad',
    'Citas Totales',
    'Citas Completadas',
    'Tasa Cumplimiento',
    'Comisiones',
    'Estado'
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (professionals || []).map((p: any) => {
    const stats = appointmentCounts[p.id] || { total: 0, completed: 0 }
    const rate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0'

    return [
      `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      p.email || 'N/A',
      p.specialty || 'N/A',
      stats.total,
      stats.completed,
      `${rate}%`,
      (commissionTotals[p.id] || 0).toFixed(2),
      p.is_active ? 'Activo' : 'Inactivo'
    ]
  })

  return {
    title: 'Reporte de Profesionales',
    subtitle: `Del ${new Date(startDate).toLocaleDateString('es-DO')} al ${new Date(endDate).toLocaleDateString('es-DO')}`,
    generatedAt: new Date().toISOString(),
    headers,
    rows,
    summary: {
      'Total Profesionales': (professionals || []).length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'Profesionales Activos': (professionals || []).filter((p: any) => p.is_active).length,
    }
  }
}

// =============================================
// GENERAR CSV
// =============================================

export async function generateCSV(data: ReportData): Promise<string> {
  const lines: string[] = []

  // Título y metadata
  lines.push(`"${data.title}"`)
  if (data.subtitle) {
    lines.push(`"${data.subtitle}"`)
  }
  lines.push(`"Generado: ${new Date(data.generatedAt).toLocaleString('es-DO')}"`)
  lines.push('')

  // Headers
  lines.push(data.headers.map(h => `"${h}"`).join(','))

  // Rows
  for (const row of data.rows) {
    lines.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  }

  // Summary
  if (data.summary) {
    lines.push('')
    lines.push('"RESUMEN"')
    for (const [key, value] of Object.entries(data.summary)) {
      lines.push(`"${key}","${value}"`)
    }
  }

  return lines.join('\n')
}

// =============================================
// EXPORTAR TODOS LOS REPORTES
// =============================================

export type ReportType = 'financial' | 'patients' | 'appointments' | 'commissions' | 'inventory' | 'professionals'

export async function exportReport(
  reportType: ReportType,
  options: ExportOptions
): Promise<{ data: ReportData; csv: string }> {
  let data: ReportData

  switch (reportType) {
    case 'financial':
      data = await exportFinancialReport(options)
      break
    case 'patients':
      data = await exportPatientsReport(options)
      break
    case 'appointments':
      data = await exportAppointmentsReport(options)
      break
    case 'commissions':
      data = await exportCommissionsReport(options)
      break
    case 'inventory':
      data = await exportInventoryReport(options)
      break
    case 'professionals':
      data = await exportProfessionalsReport(options)
      break
    default:
      throw new Error(`Tipo de reporte no soportado: ${reportType}`)
  }

  const csv = await generateCSV(data)
  return { data, csv }
}
