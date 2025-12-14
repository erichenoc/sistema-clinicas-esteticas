'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  FileText,
  User,
  LogOut,
  Bell,
  ChevronRight,
  CalendarDays,
  ClipboardList,
  Heart,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

// Datos de ejemplo del paciente
const patientData = {
  id: '1',
  name: 'Maria Garcia',
  email: 'maria.garcia@email.com',
  phone: '+1 809-555-0123',
  avatarUrl: null,
  memberSince: '2023-06-15',
  nextAppointment: {
    date: '2024-12-20',
    time: '10:00',
    treatment: 'Limpieza Facial Profunda',
    professional: 'Dra. Pamela Moquete',
  },
  upcomingAppointments: [
    {
      id: '1',
      date: '2024-12-20',
      time: '10:00',
      treatment: 'Limpieza Facial Profunda',
      professional: 'Dra. Pamela Moquete',
      status: 'confirmed',
    },
    {
      id: '2',
      date: '2024-12-28',
      time: '14:30',
      treatment: 'Botox - Zona Frontal',
      professional: 'Dr. Carlos Rodriguez',
      status: 'pending',
    },
  ],
  pastAppointments: [
    {
      id: '3',
      date: '2024-11-15',
      time: '11:00',
      treatment: 'Limpieza Facial',
      professional: 'Dra. Pamela Moquete',
      status: 'completed',
    },
    {
      id: '4',
      date: '2024-10-20',
      time: '09:30',
      treatment: 'Acido Hialuronico',
      professional: 'Dr. Carlos Rodriguez',
      status: 'completed',
    },
  ],
  documents: [
    { id: '1', name: 'Consentimiento Botox', date: '2024-11-01', type: 'consent' },
    { id: '2', name: 'Historia Clinica', date: '2024-06-15', type: 'medical' },
    { id: '3', name: 'Receta Medica', date: '2024-11-15', type: 'prescription' },
  ],
  packages: [
    {
      id: '1',
      name: 'Paquete Facial Premium',
      sessionsTotal: 6,
      sessionsUsed: 2,
      expiresAt: '2025-06-15',
    },
  ],
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

export default function PatientPortalPage() {
  const [activeTab, setActiveTab] = useState('inicio')
  const patient = patientData

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#A67C52] flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Med Luxe</span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                2
              </span>
            </Button>

            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={patient.avatarUrl || undefined} />
                <AvatarFallback className="bg-[#A67C52] text-white">
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{patient.name}</p>
                <p className="text-xs text-muted-foreground">Paciente</p>
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
        {/* Welcome Banner */}
        <Card className="bg-gradient-to-r from-[#A67C52] to-[#8a6543] text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Bienvenida, {patient.name.split(' ')[0]}!</h1>
                <p className="text-white/80 mt-1">
                  Tu proxima cita es el {new Date(patient.nextAppointment.date).toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <Button className="bg-white text-[#A67C52] hover:bg-white/90">
                <Calendar className="mr-2 h-4 w-4" />
                Agendar Nueva Cita
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patient.upcomingAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Citas Proximas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patient.packages[0]?.sessionsTotal - patient.packages[0]?.sessionsUsed || 0}</p>
                <p className="text-sm text-muted-foreground">Sesiones Disponibles</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patient.documents.length}</p>
                <p className="text-sm text-muted-foreground">Documentos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="inicio" className="py-2">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Inicio</span>
            </TabsTrigger>
            <TabsTrigger value="citas" className="py-2">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Citas</span>
            </TabsTrigger>
            <TabsTrigger value="documentos" className="py-2">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
            <TabsTrigger value="perfil" className="py-2">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Inicio */}
          <TabsContent value="inicio" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Próxima Cita */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Proxima Cita</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-lg bg-[#A67C52]/10 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-[#A67C52]">
                        {new Date(patient.nextAppointment.date).getDate()}
                      </span>
                      <span className="text-xs text-[#A67C52] uppercase">
                        {new Date(patient.nextAppointment.date).toLocaleDateString('es-DO', { month: 'short' })}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{patient.nextAppointment.treatment}</h3>
                      <p className="text-sm text-muted-foreground">{patient.nextAppointment.professional}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {patient.nextAppointment.time}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Paquetes Activos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mis Paquetes</CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.packages.map(pkg => (
                    <div key={pkg.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{pkg.name}</h3>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Activo
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Sesiones utilizadas</span>
                          <span className="font-medium">{pkg.sessionsUsed} de {pkg.sessionsTotal}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#A67C52] transition-all"
                            style={{ width: `${(pkg.sessionsUsed / pkg.sessionsTotal) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Vence: {new Date(pkg.expiresAt).toLocaleDateString('es-DO')}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Citas */}
          <TabsContent value="citas" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mis Citas</CardTitle>
                  <CardDescription>Historial y proximas citas</CardDescription>
                </div>
                <Button>
                  <Calendar className="mr-2 h-4 w-4" />
                  Nueva Cita
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Proximas Citas</h3>
                  <div className="space-y-3">
                    {patient.upcomingAppointments.map(apt => (
                      <div key={apt.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="h-12 w-12 rounded-lg bg-[#A67C52]/10 flex flex-col items-center justify-center">
                          <span className="text-sm font-bold text-[#A67C52]">
                            {new Date(apt.date).getDate()}
                          </span>
                          <span className="text-[10px] text-[#A67C52] uppercase">
                            {new Date(apt.date).toLocaleDateString('es-DO', { month: 'short' })}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{apt.treatment}</p>
                          <p className="text-sm text-muted-foreground">{apt.professional}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={statusColors[apt.status]}>
                            {statusLabels[apt.status]}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">{apt.time}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Historial</h3>
                  <div className="space-y-3">
                    {patient.pastAppointments.map(apt => (
                      <div key={apt.id} className="flex items-center gap-4 p-4 border rounded-lg opacity-75">
                        <div className="h-12 w-12 rounded-lg bg-muted flex flex-col items-center justify-center">
                          <span className="text-sm font-bold">
                            {new Date(apt.date).getDate()}
                          </span>
                          <span className="text-[10px] uppercase">
                            {new Date(apt.date).toLocaleDateString('es-DO', { month: 'short' })}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{apt.treatment}</p>
                          <p className="text-sm text-muted-foreground">{apt.professional}</p>
                        </div>
                        <Badge className={statusColors[apt.status]}>
                          {statusLabels[apt.status]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Documentos */}
          <TabsContent value="documentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mis Documentos</CardTitle>
                <CardDescription>Consentimientos, recetas y documentos medicos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patient.documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(doc.date).toLocaleDateString('es-DO')}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Descargar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Perfil */}
          <TabsContent value="perfil" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mi Perfil</CardTitle>
                <CardDescription>Informacion personal y de contacto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={patient.avatarUrl || undefined} />
                    <AvatarFallback className="bg-[#A67C52] text-white text-xl">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">{patient.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Paciente desde {new Date(patient.memberSince).toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{patient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefono</p>
                      <p className="font-medium">{patient.phone}</p>
                    </div>
                  </div>
                </div>

                <Button variant="outline">
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>Med Luxe - Centro de Medicina Estetica</p>
          <p className="mt-1">Contacto: +1 809-555-0100 | info@medluxe.com</p>
        </div>
      </footer>
    </div>
  )
}
