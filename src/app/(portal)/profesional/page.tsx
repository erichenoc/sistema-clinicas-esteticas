'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  LogOut,
  Bell,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Star,
  ChevronRight,
  BarChart3,
  CalendarDays,
  Wallet,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

// Datos de ejemplo del profesional
const professionalData = {
  id: '1',
  name: 'Dra. Pamela Moquete',
  email: 'pamela@medluxe.com',
  specialty: 'Medicina Estetica',
  avatarUrl: null,
  rating: 4.8,
  totalRatings: 127,
  todayAppointments: [
    { id: '1', time: '09:00', patient: 'Maria Garcia', treatment: 'Limpieza Facial', status: 'completed', duration: 60 },
    { id: '2', time: '10:30', patient: 'Ana Rodriguez', treatment: 'Botox Frontal', status: 'in_progress', duration: 45 },
    { id: '3', time: '12:00', patient: 'Laura Martinez', treatment: 'Acido Hialuronico', status: 'scheduled', duration: 60 },
    { id: '4', time: '14:00', patient: 'Carmen Diaz', treatment: 'Peeling Quimico', status: 'scheduled', duration: 45 },
    { id: '5', time: '15:30', patient: 'Sofia Lopez', treatment: 'Microdermoabrasion', status: 'scheduled', duration: 30 },
  ],
  weekStats: {
    completedAppointments: 28,
    cancelledAppointments: 2,
    newPatients: 5,
    revenue: 185000,
    occupancyRate: 87,
  },
  monthlyCommissions: {
    pending: 45000,
    approved: 32000,
    paid: 120000,
  },
  goals: [
    { id: '1', name: 'Citas Mensuales', target: 100, current: 78, unit: 'citas' },
    { id: '2', name: 'Ingresos', target: 500000, current: 385000, unit: 'RD$' },
    { id: '3', name: 'Rating Promedio', target: 5.0, current: 4.8, unit: 'estrellas' },
  ],
  recentPatients: [
    { id: '1', name: 'Maria Garcia', lastVisit: '2024-12-13', treatments: 4 },
    { id: '2', name: 'Ana Rodriguez', lastVisit: '2024-12-13', treatments: 2 },
    { id: '3', name: 'Laura Martinez', lastVisit: '2024-12-10', treatments: 6 },
  ],
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  completed: 'Completada',
  in_progress: 'En Curso',
  scheduled: 'Programada',
  cancelled: 'Cancelada',
}

export default function ProfessionalPortalPage() {
  const [activeTab, setActiveTab] = useState('hoy')
  const professional = professionalData

  const completedToday = professional.todayAppointments.filter(a => a.status === 'completed').length
  const totalToday = professional.todayAppointments.length

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#A67C52] flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Med Luxe Pro</span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </Button>

            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={professional.avatarUrl || undefined} />
                <AvatarFallback className="bg-[#A67C52] text-white">
                  {professional.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{professional.name}</p>
                <p className="text-xs text-muted-foreground">{professional.specialty}</p>
              </div>
            </div>

            <Button variant="ghost" size="icon">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 space-y-6">
        {/* Welcome & Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-2 bg-gradient-to-r from-[#A67C52] to-[#8a6543] text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80">Buenos dias,</p>
                  <h1 className="text-2xl font-bold">{professional.name.split(' ')[0]}!</h1>
                  <p className="text-white/80 mt-2">
                    Tienes {totalToday} citas programadas hoy
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl font-bold">{professional.rating}</span>
                  </div>
                  <p className="text-sm text-white/80">{professional.totalRatings} reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedToday}/{totalToday}</p>
                  <p className="text-sm text-muted-foreground">Citas Hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">RD${(professional.monthlyCommissions.pending / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-muted-foreground">Comisiones Pend.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="hoy" className="py-2">
              <CalendarDays className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Hoy</span>
            </TabsTrigger>
            <TabsTrigger value="agenda" className="py-2">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="comisiones" className="py-2">
              <DollarSign className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Comisiones</span>
            </TabsTrigger>
            <TabsTrigger value="estadisticas" className="py-2">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Hoy */}
          <TabsContent value="hoy" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Agenda del Día */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Agenda de Hoy</span>
                    <Badge variant="outline">{new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {professional.todayAppointments.map((apt, index) => (
                      <div
                        key={apt.id}
                        className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                          apt.status === 'in_progress' ? 'border-blue-300 bg-blue-50' : ''
                        }`}
                      >
                        <div className="text-center min-w-[60px]">
                          <p className="font-bold text-lg">{apt.time}</p>
                          <p className="text-xs text-muted-foreground">{apt.duration} min</p>
                        </div>

                        <Separator orientation="vertical" className="h-12" />

                        <div className="flex-1">
                          <p className="font-medium">{apt.patient}</p>
                          <p className="text-sm text-muted-foreground">{apt.treatment}</p>
                        </div>

                        <Badge className={statusColors[apt.status]}>
                          {statusLabels[apt.status]}
                        </Badge>

                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Metas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Metas del Mes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {professional.goals.map(goal => {
                    const percentage = (goal.current / goal.target) * 100

                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{goal.name}</span>
                          <span className="text-muted-foreground">
                            {goal.unit === 'RD$'
                              ? `RD$${(goal.current / 1000).toFixed(0)}K / ${(goal.target / 1000).toFixed(0)}K`
                              : `${goal.current} / ${goal.target}`
                            }
                          </span>
                        </div>
                        <Progress value={Math.min(percentage, 100)} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                          {percentage.toFixed(0)}% completado
                        </p>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Agenda */}
          <TabsContent value="agenda" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mi Agenda</CardTitle>
                <CardDescription>Vista semanal de tus citas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Calendario completo disponible en la version desktop</p>
                  <Button className="mt-4" variant="outline">
                    Abrir Agenda Completa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Comisiones */}
          <TabsContent value="comisiones" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pendientes</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        RD${professional.monthlyCommissions.pending.toLocaleString()}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Aprobadas</p>
                      <p className="text-2xl font-bold text-blue-600">
                        RD${professional.monthlyCommissions.approved.toLocaleString()}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pagadas (Mes)</p>
                      <p className="text-2xl font-bold text-green-600">
                        RD${professional.monthlyCommissions.paid.toLocaleString()}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detalle de Comisiones</CardTitle>
                <CardDescription>Historial de comisiones del mes actual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay comisiones pendientes de revision</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Estadísticas */}
          <TabsContent value="estadisticas" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{professional.weekStats.completedAppointments}</p>
                      <p className="text-sm text-muted-foreground">Citas Completadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{professional.weekStats.cancelledAppointments}</p>
                      <p className="text-sm text-muted-foreground">Canceladas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{professional.weekStats.newPatients}</p>
                      <p className="text-sm text-muted-foreground">Nuevos Pacientes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{professional.weekStats.occupancyRate}%</p>
                      <p className="text-sm text-muted-foreground">Ocupacion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resumen Semanal</CardTitle>
                <CardDescription>Estadisticas de los ultimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Ingresos Generados</p>
                      <p className="text-sm text-muted-foreground">Esta semana</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      RD${professional.weekStats.revenue.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Tasa de Cumplimiento</p>
                      <p className="text-sm text-muted-foreground">Citas completadas vs programadas</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {((professional.weekStats.completedAppointments /
                        (professional.weekStats.completedAppointments + professional.weekStats.cancelledAppointments)) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>Med Luxe Pro - Portal del Profesional</p>
          <p className="mt-1">Soporte: soporte@medluxe.com</p>
        </div>
      </footer>
    </div>
  )
}
