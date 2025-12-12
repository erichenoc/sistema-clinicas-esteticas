'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  UserPlus,
  Repeat,
  ShoppingCart,
  Eye,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getFinancialSummary,
  getPatientStats,
  getTopTreatments,
  getProfessionalPerformance,
  getInventoryAlerts,
  type FinancialSummary,
  type PatientStats,
  type TopTreatment,
  type ProfessionalPerformance,
  type InventoryAlert,
} from '@/actions/reports'
import { getTodayAppointments, type AppointmentListItemData } from '@/actions/appointments'
import { getInvoices, type InvoiceListItemData } from '@/actions/billing'

// Interfaces para datos procesados
interface MainStat {
  name: string
  value: string
  previousValue?: string
  subtext?: string
  change: string | null
  changeType: 'positive' | 'negative' | 'neutral'
  icon: typeof DollarSign
  color: string
  bgColor: string
}

interface AlertItem {
  id: string
  type: string
  title: string
  message: string
  severity: 'high' | 'medium' | 'low'
  action: string
}

interface RecentSale {
  id: string
  patient: string
  amount: number
  type: string
  time: string
}

interface AppointmentDisplay {
  id: string
  patient: string
  treatment: string
  time: string
  endTime: string
  status: string
  professional: string
  amount: number
}

interface ProfessionalDisplay {
  name: string
  revenue: number
  appointments: number
  rating: number
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  completed: { label: 'Completada', color: 'text-green-700', bgColor: 'bg-green-100' },
  in_progress: { label: 'En atención', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  waiting: { label: 'En espera', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  confirmed: { label: 'Confirmada', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  scheduled: { label: 'Programada', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  cancelled: { label: 'Cancelada', color: 'text-red-700', bgColor: 'bg-red-100' },
}

const severityConfig: Record<string, { color: string; bgColor: string }> = {
  high: { color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  medium: { color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  low: { color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
  }).format(amount)
}

// Helper para calcular cambio porcentual
function calculateChange(current: number, previous: number): { change: string; type: 'positive' | 'negative' | 'neutral' } {
  if (previous === 0) return { change: current > 0 ? '+100%' : '0%', type: current > 0 ? 'positive' : 'neutral' }
  const diff = ((current - previous) / previous) * 100
  return {
    change: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`,
    type: diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral',
  }
}

export default function DashboardPage() {
  const [todayDate, setTodayDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Data states
  const [mainStats, setMainStats] = useState<MainStat[]>([])
  const [todayAppointments, setTodayAppointments] = useState<AppointmentDisplay[]>([])
  const [topTreatments, setTopTreatments] = useState<TopTreatment[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [topProfessionals, setTopProfessionals] = useState<ProfessionalDisplay[]>([])

  useEffect(() => {
    setTodayDate(new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }))
  }, [])

  // Load dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true)
      try {
        // Load all data in parallel
        const [
          financialData,
          patientData,
          appointmentsData,
          treatmentsData,
          professionalsData,
          inventoryAlerts,
          salesData,
        ] = await Promise.all([
          getFinancialSummary('month'),
          getPatientStats(),
          getTodayAppointments(),
          getTopTreatments(),
          getProfessionalPerformance(),
          getInventoryAlerts(),
          getInvoices({ startDate: new Date().toISOString().split('T')[0] }),
        ])

        // Build main stats
        const revenueChange = calculateChange(financialData.totalRevenue, financialData.previousRevenue)
        const newPatientsChange = calculateChange(patientData.newThisMonth, patientData.previousNew)
        const retentionChange = calculateChange(patientData.retentionRate, patientData.previousRetention)

        const pendingCount = appointmentsData.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length
        const waitingCount = appointmentsData.filter(a => a.status === 'waiting').length

        setMainStats([
          {
            name: 'Ingresos del Mes',
            value: formatCurrency(financialData.totalRevenue),
            previousValue: formatCurrency(financialData.previousRevenue),
            change: revenueChange.change,
            changeType: revenueChange.type,
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
          },
          {
            name: 'Citas Hoy',
            value: String(appointmentsData.length),
            subtext: `${pendingCount} pendientes, ${waitingCount} en espera`,
            change: null,
            changeType: 'neutral',
            icon: Calendar,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
          },
          {
            name: 'Pacientes Nuevos',
            value: String(patientData.newThisMonth),
            previousValue: String(patientData.previousNew),
            change: newPatientsChange.change,
            changeType: newPatientsChange.type,
            icon: UserPlus,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
          },
          {
            name: 'Tasa de Retención',
            value: `${patientData.retentionRate}%`,
            previousValue: `${patientData.previousRetention}%`,
            change: retentionChange.change,
            changeType: retentionChange.type,
            icon: Repeat,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-100',
          },
        ])

        // Transform appointments for display
        setTodayAppointments(appointmentsData.map((apt: AppointmentListItemData) => ({
          id: apt.id,
          patient: apt.patient_name,
          treatment: apt.treatment_display_name || apt.treatment_name || 'Sin tratamiento',
          time: new Date(apt.scheduled_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          endTime: new Date(apt.end_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          status: apt.status,
          professional: apt.professional_name,
          amount: apt.treatment_price || 0,
        })))

        // Set treatments
        setTopTreatments(treatmentsData)

        // Build alerts from inventory alerts
        const alertsList: AlertItem[] = inventoryAlerts.map((alert: InventoryAlert, index: number) => ({
          id: String(index + 1),
          type: 'stock',
          title: alert.status === 'critical' ? 'Stock crítico' : 'Stock bajo',
          message: `${alert.product} - Solo quedan ${alert.stock} unidades`,
          severity: alert.status === 'critical' ? 'high' as const : 'medium' as const,
          action: '/inventario',
        }))

        // Add appointment alerts
        const unconfirmedTomorrow = appointmentsData.filter(a => a.status === 'scheduled').length
        if (unconfirmedTomorrow > 0) {
          alertsList.push({
            id: 'apt-1',
            type: 'appointment',
            title: 'Citas sin confirmar',
            message: `${unconfirmedTomorrow} citas pendientes de confirmación`,
            severity: 'low',
            action: '/agenda',
          })
        }

        setAlerts(alertsList.slice(0, 4))

        // Transform invoices for display as recent sales
        setRecentSales(salesData.slice(0, 4).map((invoice: InvoiceListItemData) => ({
          id: invoice.id,
          patient: invoice.patient_name || 'Cliente',
          amount: invoice.total,
          type: 'Factura',
          time: new Date(invoice.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        })))

        // Transform professionals
        setTopProfessionals(professionalsData.slice(0, 3).map((prof: ProfessionalPerformance) => ({
          name: prof.name,
          revenue: prof.revenue,
          appointments: prof.appointments,
          rating: Number(prof.rating.toFixed(1)),
        })))

      } catch (error) {
        console.error('Error loading dashboard data:', error)
        toast.error('Error al cargar los datos del dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const completedToday = todayAppointments.filter(a => a.status === 'completed').length
  const totalToday = todayAppointments.length || 1
  const progressPercent = (completedToday / totalToday) * 100

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bienvenido de vuelta. Aqui esta el resumen de hoy{todayDate && `, ${todayDate}`}.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" asChild className="flex-1 sm:flex-none">
            <Link href="/reportes">
              <Activity className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ver </span>Reportes
            </Link>
          </Button>
          <Button asChild className="flex-1 sm:flex-none">
            <Link href="/agenda/nueva">
              <Calendar className="h-4 w-4 mr-2" />
              Nueva Cita
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-28 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          mainStats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change ? (
                  <div className="flex items-center gap-1 mt-1">
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-xs font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">vs mes anterior</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium">Progreso del día</p>
              <p className="text-xs text-muted-foreground">{completedToday} de {totalToday} citas completadas</p>
            </div>
            <span className="text-2xl font-bold">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Calendar className="h-5 w-5" />
                Citas de Hoy
              </CardTitle>
              <CardDescription>
                {todayAppointments.length} citas programadas
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agenda">
                Ver todas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
                    <Skeleton className="h-12 w-14" />
                    <Skeleton className="h-10 w-1" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No hay citas programadas para hoy</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/agenda/nueva">Agendar cita</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => {
                  const status = statusConfig[appointment.status] || statusConfig.scheduled
                  return (
                    <div
                      key={appointment.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-4 hover:bg-muted transition-colors gap-3"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-semibold">{appointment.time}</p>
                          <p className="text-xs text-muted-foreground">{appointment.endTime}</p>
                        </div>
                        <div className="h-10 w-[2px] bg-border rounded-full" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{appointment.patient}</p>
                          <p className="text-sm text-muted-foreground truncate">{appointment.treatment}</p>
                          <p className="text-xs text-muted-foreground">{appointment.professional}</p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 ml-auto">
                        <Badge variant="secondary" className={`${status.bgColor} ${status.color} whitespace-nowrap text-xs`}>
                          {status.label}
                        </Badge>
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                          {formatCurrency(appointment.amount)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5" />
              Alertas
            </CardTitle>
            <CardDescription>
              {alerts.length} notificaciones pendientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                    <Skeleton className="h-5 w-5" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="h-10 w-10 text-green-500/50 mb-3" />
                <p className="text-sm text-muted-foreground">Sin alertas pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const severity = severityConfig[alert.severity]
                  return (
                    <Link
                      key={alert.id}
                      href={alert.action}
                      className={`flex items-start gap-3 rounded-lg border p-3 hover:shadow-sm transition-shadow ${severity.bgColor}`}
                    >
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${severity.color}`} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${severity.color}`}>{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Treatments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5" />
              Top Tratamientos del Mes
            </CardTitle>
            <CardDescription>
              Tratamientos más solicitados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-6 w-6" />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-2 flex-1" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topTreatments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">Sin datos de tratamientos este mes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topTreatments.map((treatment, index) => (
                  <div key={treatment.name} className="flex items-center gap-4">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{treatment.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{treatment.sessions} sesiones</span>
                          <span className={`text-sm font-medium flex items-center ${
                            treatment.growth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {treatment.growth >= 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {Math.abs(treatment.growth)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min((treatment.sessions / 70) * 100, 100)}
                          className="h-2 flex-1"
                        />
                        <span className="text-sm font-medium text-muted-foreground min-w-[100px] text-right">
                          {formatCurrency(treatment.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <ShoppingCart className="h-5 w-5" />
                Ventas Recientes
              </CardTitle>
              <CardDescription>Últimas transacciones</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pos">
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Sin ventas hoy</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {sale.patient.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sale.patient}</p>
                        <p className="text-xs text-muted-foreground">{sale.type} • {sale.time}</p>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatCurrency(sale.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total del día</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(recentSales.reduce((acc, s) => acc + s.amount, 0))}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Professionals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5" />
            Top Profesionales del Mes
          </CardTitle>
          <CardDescription>
            Rendimiento del equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : topProfessionals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">Sin datos de profesionales este mes</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {topProfessionals.map((professional, index) => (
                <div
                  key={professional.name}
                  className={`p-4 rounded-lg border ${
                    index === 0 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={`${
                        index === 0 ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200' : 'bg-muted-foreground/20'
                      } font-semibold`}>
                        {professional.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{professional.name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-muted-foreground">{professional.rating}</span>
                      </div>
                    </div>
                    {index === 0 && (
                      <Badge className="ml-auto bg-amber-500">Top 1</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ingresos</p>
                      <p className="font-semibold">{formatCurrency(professional.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Citas</p>
                      <p className="font-semibold">{professional.appointments}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
