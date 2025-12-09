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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Package,
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

// Mock data - KPIs principales
const mainStats = [
  {
    name: 'Ingresos del Mes',
    value: '$125,450.00',
    previousValue: '$98,200.00',
    change: '+27.7%',
    changeType: 'positive' as const,
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    name: 'Citas Hoy',
    value: '18',
    subtext: '5 pendientes, 3 en espera',
    change: null,
    changeType: 'neutral' as const,
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    name: 'Pacientes Nuevos',
    value: '32',
    previousValue: '24',
    change: '+33%',
    changeType: 'positive' as const,
    icon: UserPlus,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    name: 'Tasa de Retención',
    value: '78%',
    previousValue: '72%',
    change: '+6%',
    changeType: 'positive' as const,
    icon: Repeat,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
]

// Citas del día
const todayAppointments = [
  {
    id: '1',
    patient: 'María García',
    treatment: 'Botox - Frente y Entrecejo',
    time: '09:00',
    endTime: '09:45',
    status: 'completed',
    professional: 'Dra. Ana López',
    amount: 5500,
  },
  {
    id: '2',
    patient: 'Carlos Rodríguez',
    treatment: 'Ácido Hialurónico - Labios',
    time: '10:00',
    endTime: '10:45',
    status: 'in_progress',
    professional: 'Dra. Ana López',
    amount: 4500,
  },
  {
    id: '3',
    patient: 'Laura Martínez',
    treatment: 'Limpieza Facial Profunda',
    time: '11:00',
    endTime: '12:00',
    status: 'waiting',
    professional: 'Lic. Carmen Ruiz',
    amount: 1200,
  },
  {
    id: '4',
    patient: 'Pedro Sánchez',
    treatment: 'Depilación Láser - Espalda',
    time: '12:00',
    endTime: '13:00',
    status: 'confirmed',
    professional: 'Lic. Carmen Ruiz',
    amount: 2800,
  },
  {
    id: '5',
    patient: 'Ana Fernández',
    treatment: 'Microdermoabrasión',
    time: '14:00',
    endTime: '15:00',
    status: 'scheduled',
    professional: 'Dra. Ana López',
    amount: 1500,
  },
]

// Top tratamientos
const topTreatments = [
  { name: 'Botox', sessions: 45, revenue: 247500, growth: 15 },
  { name: 'Ácido Hialurónico', sessions: 38, revenue: 171000, growth: 22 },
  { name: 'Limpieza Facial', sessions: 62, revenue: 74400, growth: 8 },
  { name: 'Depilación Láser', sessions: 55, revenue: 154000, growth: -5 },
  { name: 'Hidratación Facial', sessions: 28, revenue: 25200, growth: 12 },
]

// Alertas
const alerts = [
  {
    id: '1',
    type: 'stock',
    title: 'Stock bajo',
    message: 'Ácido Hialurónico 1ml - Solo quedan 8 unidades',
    severity: 'high',
    action: '/inventario',
  },
  {
    id: '2',
    type: 'expiry',
    title: 'Producto por vencer',
    message: 'Botox Lote #A234 vence en 25 días',
    severity: 'medium',
    action: '/inventario',
  },
  {
    id: '3',
    type: 'appointment',
    title: 'Citas sin confirmar',
    message: '5 citas de mañana pendientes de confirmación',
    severity: 'low',
    action: '/agenda',
  },
  {
    id: '4',
    type: 'commission',
    title: 'Comisiones pendientes',
    message: '$1,500 en comisiones por aprobar',
    severity: 'low',
    action: '/profesionales',
  },
]

// Ventas recientes
const recentSales = [
  { id: '1', patient: 'María García', amount: 5500, type: 'Tratamiento', time: '10:30' },
  { id: '2', patient: 'Laura Martínez', amount: 850, type: 'Producto', time: '11:15' },
  { id: '3', patient: 'Carlos Rodríguez', amount: 4500, type: 'Tratamiento', time: '11:45' },
  { id: '4', patient: 'Ana Fernández', amount: 12500, type: 'Paquete', time: '12:30' },
]

// Top profesionales del mes
const topProfessionals = [
  { name: 'Dra. Ana López', revenue: 85000, appointments: 48, rating: 4.9 },
  { name: 'Dr. Carlos Méndez', revenue: 72000, appointments: 32, rating: 4.8 },
  { name: 'Lic. Carmen Ruiz', revenue: 45000, appointments: 55, rating: 4.7 },
]

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

export default function DashboardPage() {
  const [period, setPeriod] = useState('month')
  const [todayDate, setTodayDate] = useState('')

  useEffect(() => {
    setTodayDate(new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }))
  }, [])

  const completedToday = todayAppointments.filter(a => a.status === 'completed').length
  const totalToday = todayAppointments.length
  const progressPercent = (completedToday / totalToday) * 100

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenido de vuelta. Aqui esta el resumen de hoy{todayDate && `, ${todayDate}`}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/reportes">
              <Activity className="h-4 w-4 mr-2" />
              Ver Reportes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/agenda/nueva">
              <Calendar className="h-4 w-4 mr-2" />
              Nueva Cita
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => (
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
        ))}
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
            <div className="space-y-3">
              {todayAppointments.map((appointment) => {
                const status = statusConfig[appointment.status]
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
                        value={(treatment.sessions / 70) * 100}
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
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {sale.patient.split(' ').map(n => n[0]).join('')}
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
        </CardContent>
      </Card>
    </div>
  )
}
