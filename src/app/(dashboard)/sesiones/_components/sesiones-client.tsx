'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Clock,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
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
import { cancelSession } from '@/actions/sessions'

interface SesionesClientProps {
  sessions: SessionListItem[]
  professionals: { id: string; name: string }[]
  stats: {
    inProgress: number
    completedToday: number
    totalToday: number
    todayRevenue: number
    productCost: number
  }
}

export function SesionesClient({ sessions, professionals, stats }: SesionesClientProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [professionalFilter, setProfessionalFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cancellingSessionId, setCancellingSessionId] = useState<string | null>(null)

  const handleCancelSession = async (sessionId: string, patientName: string) => {
    setCancellingSessionId(sessionId)
    toast.loading('Cancelando sesion...', { id: 'cancel-session' })

    const result = await cancelSession(sessionId, 'Cancelada por el usuario')

    toast.dismiss('cancel-session')
    if (result.success) {
      toast.success(`Sesion de ${patientName} cancelada`)
    } else {
      toast.error(result.error || 'Error al cancelar la sesion')
    }
    setCancellingSessionId(null)
  }

  const filteredSessions = sessions.filter((session) => {
    if (statusFilter !== 'all' && session.status !== statusFilter) return false
    if (professionalFilter !== 'all' && session.professionalId !== professionalFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesPatient = session.patientName.toLowerCase().includes(query)
      const matchesTreatment = session.treatmentDisplayName?.toLowerCase().includes(query)
      if (!matchesPatient && !matchesTreatment) return false
    }
    return true
  })

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
          <h1 className="text-2xl font-bold tracking-tight">Sesiones Clinicas</h1>
          <p className="text-muted-foreground">
            Registro de tratamientos realizados
          </p>
        </div>
        <Button asChild>
          <Link href="/sesiones/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Sesion
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En progreso</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {stats.inProgress}
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
              {stats.completedToday}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              De {stats.totalToday} programadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ingresos del dia</CardDescription>
            <CardTitle className="text-3xl">
              {formatPrice(stats.todayRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Costo productos: {formatPrice(stats.productCost)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente o tratamiento..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
            {professionals.map((prof) => (
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
                    <TableHead>Duracion</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay sesiones para mostrar
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSessions.map((session) => (
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
                                    Completar sesion
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
                                  Cancelar sesion
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
