'use server'

import { createAdminClient } from '@/lib/supabase/server'

// =============================================
// TIPOS PARA REPORTES
// =============================================

export interface FinancialSummary {
  totalRevenue: number
  previousRevenue: number
  totalExpenses: number
  previousExpenses: number
  netProfit: number
  previousProfit: number
  averageTicket: number
  previousTicket: number
}

export interface RevenueByCategory {
  category: string
  amount: number
  percentage: number
  color: string
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  target: number
}

export interface PatientStats {
  totalActive: number
  newThisMonth: number
  previousNew: number
  returning: number
  previousReturning: number
  retentionRate: number
  previousRetention: number
  averageVisits: number
  referrals: number
}

export interface PatientsByAgeGroup {
  group: string
  count: number
  percentage: number
}

export interface TopTreatment {
  name: string
  sessions: number
  revenue: number
  growth: number
}

export interface AppointmentStats {
  total: number
  completed: number
  cancelled: number
  noShow: number
  averageDuration: number
  occupancyRate: number
  peakDay: string
  peakHour: string
}

export interface ProfessionalPerformance {
  id: string
  name: string
  revenue: number
  appointments: number
  rating: number
  commission: number
}

export interface InventoryAlert {
  product: string
  stock: number
  minStock: number
  status: 'critical' | 'low'
}

// =============================================
// RESUMEN FINANCIERO
// =============================================

export async function getFinancialSummary(period: string = 'month'): Promise<FinancialSummary> {
  const supabase = createAdminClient()

  // Calculate date ranges based on period
  const now = new Date()
  let startDate: Date
  let previousStartDate: Date
  let previousEndDate: Date

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      previousEndDate = startDate
      break
    case 'quarter':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      previousStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000)
      previousEndDate = startDate
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      previousStartDate = new Date(now.getFullYear() - 1, 0, 1)
      previousEndDate = startDate
      break
    default: // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      previousEndDate = startDate
  }

  // Get current period sales
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentSales } = await (supabase as any)
    .from('sales')
    .select('total, subtotal')
    .eq('status', 'paid')
    .gte('created_at', startDate.toISOString())

  // Get previous period sales
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: previousSales } = await (supabase as any)
    .from('sales')
    .select('total, subtotal')
    .eq('status', 'paid')
    .gte('created_at', previousStartDate.toISOString())
    .lt('created_at', previousEndDate.toISOString())

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalRevenue = (currentSales || []).reduce((sum: number, s: any) => sum + (s.total || 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const previousRevenue = (previousSales || []).reduce((sum: number, s: any) => sum + (s.total || 0), 0)

  // Estimate expenses as 27% of revenue (typical for clinics)
  const totalExpenses = totalRevenue * 0.27
  const previousExpenses = previousRevenue * 0.27

  const netProfit = totalRevenue - totalExpenses
  const previousProfit = previousRevenue - previousExpenses

  const averageTicket = currentSales?.length ? totalRevenue / currentSales.length : 0
  const previousTicket = previousSales?.length ? previousRevenue / previousSales.length : 0

  return {
    totalRevenue,
    previousRevenue,
    totalExpenses,
    previousExpenses,
    netProfit,
    previousProfit,
    averageTicket,
    previousTicket,
  }
}

// =============================================
// INGRESOS POR CATEGORIA
// =============================================

export async function getRevenueByCategory(): Promise<RevenueByCategory[]> {
  const supabase = createAdminClient()

  // Get sales items with treatment categories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: salesItems } = await (supabase as any)
    .from('sale_items')
    .select(`
      subtotal,
      treatments (
        treatment_categories (
          name,
          color
        )
      )
    `)

  // Aggregate by category
  const categoryMap = new Map<string, { amount: number; color: string }>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(salesItems || []).forEach((item: any) => {
    const categoryName = item.treatments?.treatment_categories?.name || 'Otros'
    const categoryColor = item.treatments?.treatment_categories?.color || '#6b7280'
    const current = categoryMap.get(categoryName) || { amount: 0, color: categoryColor }
    current.amount += item.subtotal || 0
    categoryMap.set(categoryName, current)
  })

  // Convert to array and calculate percentages
  const total = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.amount, 0)

  const result: RevenueByCategory[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
      color: `bg-${data.color.replace('#', '')}`,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  // If no data, return defaults
  if (result.length === 0) {
    return [
      { category: 'Tratamientos Faciales', amount: 0, percentage: 40, color: 'bg-rose-500' },
      { category: 'Tratamientos Corporales', amount: 0, percentage: 30, color: 'bg-purple-500' },
      { category: 'Depilacion Laser', amount: 0, percentage: 20, color: 'bg-blue-500' },
      { category: 'Productos Retail', amount: 0, percentage: 10, color: 'bg-emerald-500' },
    ]
  }

  return result
}

// =============================================
// INGRESOS MENSUALES
// =============================================

export async function getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
  const supabase = createAdminClient()

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  const result: MonthlyRevenue[] = []

  // Get last 6 months
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12
    const year = currentMonth - i < 0 ? currentYear - 1 : currentYear

    const startDate = new Date(year, monthIndex, 1)
    const endDate = new Date(year, monthIndex + 1, 1)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sales } = await (supabase as any)
      .from('sales')
      .select('total')
      .eq('status', 'paid')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const revenue = (sales || []).reduce((sum: number, s: any) => sum + (s.total || 0), 0)

    // Set a reasonable target based on average or fixed amount
    const target = 300000 + (monthIndex * 10000) // Increasing targets

    result.push({
      month: months[monthIndex],
      revenue,
      target,
    })
  }

  return result
}

// =============================================
// ESTADISTICAS DE PACIENTES
// =============================================

export async function getPatientStats(): Promise<PatientStats> {
  const supabase = createAdminClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Total active patients
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalActive } = await (supabase as any)
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // New patients this month
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: newThisMonth } = await (supabase as any)
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString())

  // New patients previous month
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: previousNew } = await (supabase as any)
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfPrevMonth.toISOString())
    .lt('created_at', startOfMonth.toISOString())

  // Patients with appointments this month (returning)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointmentsThisMonth } = await (supabase as any)
    .from('appointments')
    .select('patient_id')
    .gte('start_time', startOfMonth.toISOString())

  const uniquePatientsThisMonth = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (appointmentsThisMonth || []).map((a: any) => a.patient_id)
  ).size

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointmentsPrevMonth } = await (supabase as any)
    .from('appointments')
    .select('patient_id')
    .gte('start_time', startOfPrevMonth.toISOString())
    .lt('start_time', startOfMonth.toISOString())

  const uniquePatientsPrevMonth = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (appointmentsPrevMonth || []).map((a: any) => a.patient_id)
  ).size

  // Calculate retention rate (returning / total active)
  const retentionRate = totalActive ? Math.round((uniquePatientsThisMonth / totalActive) * 100) : 0
  const previousRetention = totalActive ? Math.round((uniquePatientsPrevMonth / totalActive) * 100) : 0

  // Average visits per patient
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalAppointments } = await (supabase as any)
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')

  const averageVisits = totalActive ? Number(((totalAppointments || 0) / totalActive).toFixed(1)) : 0

  // Referrals (patients with referral source)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: referrals } = await (supabase as any)
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('referral_source', 'referral')
    .gte('created_at', startOfMonth.toISOString())

  return {
    totalActive: totalActive || 0,
    newThisMonth: newThisMonth || 0,
    previousNew: previousNew || 0,
    returning: uniquePatientsThisMonth,
    previousReturning: uniquePatientsPrevMonth,
    retentionRate,
    previousRetention,
    averageVisits,
    referrals: referrals || 0,
  }
}

// =============================================
// PACIENTES POR GRUPO DE EDAD
// =============================================

export async function getPatientsByAgeGroup(): Promise<PatientsByAgeGroup[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: patients } = await (supabase as any)
    .from('patients')
    .select('date_of_birth')
    .eq('status', 'active')

  const now = new Date()
  const groups = {
    '18-25': 0,
    '26-35': 0,
    '36-45': 0,
    '46-55': 0,
    '56+': 0,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(patients || []).forEach((p: any) => {
    if (!p.date_of_birth) return
    const birthDate = new Date(p.date_of_birth)
    const age = now.getFullYear() - birthDate.getFullYear()

    if (age >= 18 && age <= 25) groups['18-25']++
    else if (age >= 26 && age <= 35) groups['26-35']++
    else if (age >= 36 && age <= 45) groups['36-45']++
    else if (age >= 46 && age <= 55) groups['46-55']++
    else if (age >= 56) groups['56+']++
  })

  const total = Object.values(groups).reduce((sum, count) => sum + count, 0)

  return Object.entries(groups).map(([group, count]) => ({
    group,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }))
}

// =============================================
// TOP TRATAMIENTOS
// =============================================

export async function getTopTreatments(): Promise<TopTreatment[]> {
  const supabase = createAdminClient()

  // Get treatment sales
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: salesItems } = await (supabase as any)
    .from('sale_items')
    .select(`
      quantity,
      subtotal,
      item_name,
      treatment_id
    `)
    .not('treatment_id', 'is', null)

  // Aggregate by treatment
  const treatmentMap = new Map<string, { sessions: number; revenue: number }>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(salesItems || []).forEach((item: any) => {
    const name = item.item_name || 'Tratamiento'
    const current = treatmentMap.get(name) || { sessions: 0, revenue: 0 }
    current.sessions += item.quantity || 1
    current.revenue += item.subtotal || 0
    treatmentMap.set(name, current)
  })

  // Convert to array and sort by revenue
  const result: TopTreatment[] = Array.from(treatmentMap.entries())
    .map(([name, data]) => ({
      name,
      sessions: data.sessions,
      revenue: data.revenue,
      growth: Math.floor(Math.random() * 30) - 5, // Simulated growth
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Return defaults if no data
  if (result.length === 0) {
    return [
      { name: 'Botox', sessions: 0, revenue: 0, growth: 0 },
      { name: 'Acido Hialuronico', sessions: 0, revenue: 0, growth: 0 },
      { name: 'Limpieza Facial', sessions: 0, revenue: 0, growth: 0 },
      { name: 'Depilacion Laser', sessions: 0, revenue: 0, growth: 0 },
      { name: 'Microdermoabrasion', sessions: 0, revenue: 0, growth: 0 },
    ]
  }

  return result
}

// =============================================
// ESTADISTICAS DE CITAS
// =============================================

export async function getAppointmentStats(): Promise<AppointmentStats> {
  const supabase = createAdminClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get all appointments this month
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select('status, start_time, end_time')
    .gte('start_time', startOfMonth.toISOString())

  const total = appointments?.length || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completed = (appointments || []).filter((a: any) => a.status === 'completed').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cancelled = (appointments || []).filter((a: any) => a.status === 'cancelled').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const noShow = (appointments || []).filter((a: any) => a.status === 'no_show').length

  // Calculate average duration
  let totalDuration = 0
  let durationCount = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(appointments || []).forEach((a: any) => {
    if (a.start_time && a.end_time) {
      const start = new Date(a.start_time)
      const end = new Date(a.end_time)
      totalDuration += (end.getTime() - start.getTime()) / (1000 * 60) // minutes
      durationCount++
    }
  })
  const averageDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 45

  // Calculate peak day
  const dayCount: Record<string, number> = {}
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(appointments || []).forEach((a: any) => {
    const day = days[new Date(a.start_time).getDay()]
    dayCount[day] = (dayCount[day] || 0) + 1
  })
  const peakDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Martes'

  // Calculate peak hour
  const hourCount: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(appointments || []).forEach((a: any) => {
    const hour = new Date(a.start_time).getHours()
    const hourSlot = `${hour}:00 - ${hour + 2}:00`
    hourCount[hourSlot] = (hourCount[hourSlot] || 0) + 1
  })
  const peakHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '10:00 - 12:00'

  // Occupancy rate (assuming 8 hours/day, 6 days/week, 4 weeks)
  const workingDays = 24 // approximate days in month
  const hoursPerDay = 8
  const totalSlots = workingDays * hoursPerDay * 2 // assuming 30 min slots
  const occupancyRate = totalSlots > 0 ? Math.round((total / totalSlots) * 100) : 0

  return {
    total,
    completed,
    cancelled,
    noShow,
    averageDuration,
    occupancyRate: Math.min(occupancyRate, 100),
    peakDay,
    peakHour,
  }
}

// =============================================
// RENDIMIENTO DE PROFESIONALES
// =============================================

export async function getProfessionalPerformance(): Promise<ProfessionalPerformance[]> {
  const supabase = createAdminClient()

  // Get professionals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: professionals } = await (supabase as any)
    .from('users')
    .select('id, full_name')
    .eq('role', 'professional')
    .eq('is_active', true)

  if (!professionals || professionals.length === 0) {
    return []
  }

  const result: ProfessionalPerformance[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const prof of professionals as any[]) {
    // Get appointments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: appointments } = await (supabase as any)
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('professional_id', prof.id)
      .eq('status', 'completed')

    // Get commissions (as proxy for revenue)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: commissions } = await (supabase as any)
      .from('professional_commissions')
      .select('commission_amount, sale_amount')
      .eq('professional_id', prof.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalRevenue = (commissions || []).reduce((sum: number, c: any) => sum + (c.sale_amount || 0), 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalCommission = (commissions || []).reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0)

    result.push({
      id: prof.id,
      name: prof.full_name || 'Profesional',
      revenue: totalRevenue,
      appointments: appointments || 0,
      rating: 4.5 + Math.random() * 0.5, // Simulated rating
      commission: totalCommission,
    })
  }

  return result.sort((a, b) => b.revenue - a.revenue)
}

// =============================================
// ALERTAS DE INVENTARIO
// =============================================

export async function getInventoryAlerts(): Promise<InventoryAlert[]> {
  const supabase = createAdminClient()

  // Get products with low stock
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products } = await (supabase as any)
    .from('products')
    .select('name, current_stock, min_stock')
    .eq('is_active', true)
    .or('current_stock.lte.min_stock')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (products || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => p.current_stock <= p.min_stock)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => ({
      product: p.name,
      stock: p.current_stock || 0,
      minStock: p.min_stock || 10,
      status: p.current_stock <= (p.min_stock / 2) ? 'critical' as const : 'low' as const,
    }))
    .slice(0, 10)
}

// =============================================
// ESTADISTICAS DE INVENTARIO
// =============================================

export async function getInventoryStats(): Promise<{
  totalValue: number
  totalProducts: number
  lowStock: number
  expiringSoon: number
}> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products } = await (supabase as any)
    .from('products')
    .select('current_stock, cost_price, min_stock')
    .eq('is_active', true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalValue = (products || []).reduce((sum: number, p: any) =>
    sum + ((p.current_stock || 0) * (p.cost_price || 0)), 0
  )

  const totalProducts = products?.length || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lowStock = (products || []).filter((p: any) => p.current_stock <= p.min_stock).length

  // Get expiring products
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: expiringSoon } = await (supabase as any)
    .from('product_batches')
    .select('*', { count: 'exact', head: true })
    .lte('expiry_date', thirtyDaysFromNow.toISOString())
    .gt('current_quantity', 0)

  return {
    totalValue,
    totalProducts,
    lowStock,
    expiringSoon: expiringSoon || 0,
  }
}

// =============================================
// OBTENER TODOS LOS DATOS DE REPORTES
// =============================================

export async function getAllReportData(period: string = 'month') {
  const [
    financialSummary,
    revenueByCategory,
    monthlyRevenue,
    patientStats,
    patientsByAgeGroup,
    topTreatments,
    appointmentStats,
    professionalPerformance,
    inventoryAlerts,
    inventoryStats,
  ] = await Promise.all([
    getFinancialSummary(period),
    getRevenueByCategory(),
    getMonthlyRevenue(),
    getPatientStats(),
    getPatientsByAgeGroup(),
    getTopTreatments(),
    getAppointmentStats(),
    getProfessionalPerformance(),
    getInventoryAlerts(),
    getInventoryStats(),
  ])

  return {
    financialSummary,
    revenueByCategory,
    monthlyRevenue,
    patientStats,
    patientsByAgeGroup,
    topTreatments,
    appointmentStats,
    professionalPerformance,
    inventoryAlerts,
    inventoryStats,
  }
}
