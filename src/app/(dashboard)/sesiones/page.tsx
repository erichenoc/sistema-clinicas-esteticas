'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  Clock,
  User,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Play,
  FileText,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SessionListItem } from '@/types/sessions'
import { SESSION_STATUS_OPTIONS, formatSessionDuration } from '@/types/sessions'

// Mock data
const today = new Date()
const mockSessions: SessionListItem[] = [
  {
    id: '1',
    clinicId: '1',
    branchId: null,
    appointmentId: '1',
    patientId: '1',
    professionalId: '1',
    treatmentId: '1',
    treatmentName: 'Limpieza Facial Profunda',
    packageSessionId: null,
    startedAt: new Date(today.setHours(9, 0)).toISOString(),
    endedAt: new Date(today.setHours(10, 0)).toISOString(),
    durationMinutes: 60,
    status: 'completed',
    treatedZones: [{ zone: 'face_full' }],
    technicalParameters: {},
    productsUsed: [],
    observations: 'Piel sensible, se aplicó protocolo suave',
    patientFeedback: 'Muy satisfecha con el resultado',
    adverseReactions: null,
    resultRating: 5,
    resultNotes: null,
    patientSignatureUrl: null,
    professionalSignatureUrl: null,
    signedAt: null,
    followUpRequired: false,
    followUpNotes: null,
    nextSessionRecommendedAt: null,
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
    createdBy: '1',
    patientName: 'María García López',
    patientPhone: '5512345678',
    patientAvatar: null,
    professionalName: 'Dra. María García',
    treatmentDisplayName: 'Limpieza Facial Profunda',
    treatmentPrice: 80,
    categoryName: 'Facial',
    categoryColor: '#ec4899',
    appointmentScheduledAt: today.toISOString(),
    imageCount: 3,
    totalProductCost: 25,
  },
  {
    id: '2',
    clinicId: '1',
    branchId: null,
    appointmentId: '2',
    patientId: '2',
    professionalId: '2',
    treatmentId: '2',
    treatmentName: 'Botox - Frente',
    packageSessionId: null,
    startedAt: new Date(today.setHours(10, 30)).toISOString(),
    endedAt: null,
    durationMinutes: null,
    status: 'in_progress',
    treatedZones: [{ zone: 'face_forehead' }],
    technicalParameters: { product: 'Botox', units: 20 },
    productsUsed: [],
    observations: null,
    patientFeedback: null,
    adverseReactions: null,
    resultRating: null,
    resultNotes: null,
    patientSignatureUrl: null,
    professionalSignatureUrl: null,
    signedAt: null,
    followUpRequired: false,
    followUpNotes: null,
    nextSessionRecommendedAt: null,
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
    createdBy: '2',
    patientName: 'Ana Martínez Ruiz',
    patientPhone: '5598765432',
    patientAvatar: null,
    professionalName: 'Dr. Carlos López',
    treatmentDisplayName: 'Botox - Frente',
    treatmentPrice: 350,
    categoryName: 'Inyectables',
    categoryColor: '#06b6d4',
    appointmentScheduledAt: today.toISOString(),
    imageCount: 2,
    totalProductCost: 150,
  },
  {
    id: '3',
    clinicId: '1',
    branchId: null,
    appointmentId: '3',
    patientId: '3',
    professionalId: '3',
    treatmentId: '3',
    treatmentName: 'Depilación Láser - Axilas',
    packageSessionId: null,
    startedAt: new Date(today.setHours(12, 0)).toISOString(),
    endedAt: new Date(today.setHours(12, 20)).toISOString(),
    durationMinutes: 20,
    status: 'completed',
    treatedZones: [{ zone: 'underarms' }],
    technicalParameters: { wavelength: 1064, fluence: 15 },
    productsUsed: [],
    observations: 'Sesión 3 de 6',
    patientFeedback: null,
    adverseReactions: null,
    resultRating: 4,
    resultNotes: null,
    patientSignatureUrl: null,
    professionalSignatureUrl: null,
    signedAt: null,
    followUpRequired: true,
    followUpNotes: 'Próxima sesión en 4 semanas',
    nextSessionRecommendedAt: '2024-02-15',
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
    createdBy: '3',
    patientName: 'Laura Hernández',
    patientPhone: '5511223344',
    patientAvatar: null,
    professionalName: 'Lic. Ana Martínez',
    treatmentDisplayName: 'Depilación Láser - Axilas',
    treatmentPrice: 120,
    categoryName: 'Láser',
    categoryColor: '#ef4444',
    appointmentScheduledAt: today.toISOString(),
    imageCount: 0,
    totalProductCost: 0,
  },
]

const mockProfessionals = [
  { id: '1', name: 'Dra. María García' },
  { id: '2', name: 'Dr. Carlos López' },
  { id: '3', name: 'Lic. Ana Martínez' },
]

export default function SesionesPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [professionalFilter, setProfessionalFilter] = useState('all')
  const [cancellingSessionId, setCancellingSessionId] = useState<string | null>(null)

  const handleCancelSession = async (sessionId: string, patientName: string) => {
    setCancellingSessionId(sessionId)
    toast.loading('Cancelando sesion...', { id: 'cancel-session' })
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.dismiss('cancel-session')
    toast.success(`Sesion de ${patientName} cancelada`)
    setCancellingSessionId(null)
  }

  const filteredSessions = mockSessions.filter((session) => {
    if (statusFilter !== 'all' && session.status !== statusFilter) return false
    if (professionalFilter !== 'all' && session.professionalId !== professionalFilter) return false
    return true
  })

  const inProgressCount = mockSessions.filter((s) => s.status === 'in_progress').length
  const completedTodayCount = mockSessions.filter((s) => s.status === 'completed').length

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(price)
  }

  const getStatusBadge = (status: string) => {
    const config = SESSION_STATUS_OPTIONS.find((s) => s.value === status)
    if (!config) return null
    return (
      <Badge style={{ backgroundColor: config.color }}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sesiones Clínicas</h1>
          <p className="text-muted-foreground">
            Registro de tratamientos realizados
          </p>
        </div>
        <Button asChild>
          <Link href="/sesiones/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Sesión
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En progreso</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {inProgressCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Sesiones activas ahora
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completadas hoy</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {completedTodayCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              De {mockSessions.length} programadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ingresos del día</CardDescription>
            <CardTitle className="text-3xl">
              {formatPrice(
                mockSessions
                  .filter((s) => s.status === 'completed')
                  .reduce((acc, s) => acc + (s.treatmentPrice || 0), 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Costo productos: {formatPrice(
                mockSessions
                  .filter((s) => s.status === 'completed')
                  .reduce((acc, s) => acc + s.totalProductCost, 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por paciente o tratamiento..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {SESSION_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Profesional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los profesionales</SelectItem>
            {mockProfessionals.map((prof) => (
              <SelectItem key={prof.id} value={prof.id}>
                {prof.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs: Hoy / Historial */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList>
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tratamiento</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {formatTime(session.startedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={session.patientAvatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {session.patientName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{session.patientName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: session.categoryColor || '#6366f1' }}
                          />
                          {session.treatmentDisplayName}
                        </div>
                      </TableCell>
                      <TableCell>{session.professionalName}</TableCell>
                      <TableCell>
                        {session.status === 'in_progress' ? (
                          <Badge variant="outline" className="animate-pulse">
                            <Clock className="mr-1 h-3 w-3" />
                            En curso
                          </Badge>
                        ) : (
                          formatSessionDuration(session.durationMinutes)
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/sesiones/${session.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalles
                              </Link>
                            </DropdownMenuItem>
                            {session.status === 'in_progress' && (
                              <DropdownMenuItem asChild>
                                <Link href={`/sesiones/${session.id}/completar`}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Completar sesión
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href={`/sesiones/${session.id}/notas`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Agregar nota
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {session.status === 'in_progress' && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleCancelSession(session.id, session.patientName)}
                                disabled={cancellingSessionId === session.id}
                              >
                                {cancellingSessionId === session.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="mr-2 h-4 w-4" />
                                )}
                                Cancelar sesión
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Sesiones</CardTitle>
              <CardDescription>
                Todas las sesiones registradas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Usa los filtros para buscar sesiones anteriores
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
