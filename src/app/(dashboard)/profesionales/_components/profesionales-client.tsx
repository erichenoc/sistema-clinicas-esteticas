'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Eye,
  Calendar,
  DollarSign,
  Star,
  Mail,
  Phone,
  Briefcase,
  TrendingUp,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ProfessionalSummary,
  CommissionWithDetails,
  AttendanceLogWithDetails,
  PROFESSIONAL_STATUS_OPTIONS,
  formatCurrency,
  getProfessionalStatusConfig,
  getCommissionStatusConfig,
  getAttendanceStatusConfig,
} from '@/types/professionals'

interface ProfesionalesClientProps {
  professionals: ProfessionalSummary[]
  commissions: CommissionWithDetails[]
  attendance: AttendanceLogWithDetails[]
  stats: {
    total: number
    active: number
    pendingCommissions: number
    pendingAmount: number
    monthRevenue: number
    monthAppointments: number
  }
}

export function ProfesionalesClient({
  professionals,
  commissions,
  attendance,
  stats,
}: ProfesionalesClientProps) {
  const [activeTab, setActiveTab] = useState('equipo')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [todayDate, setTodayDate] = useState('')

  useEffect(() => {
    setTodayDate(new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }))
  }, [])

  const filteredProfessionals = professionals.filter((professional) => {
    const matchesSearch =
      professional.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || professional.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'P'
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profesionales</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Gestion del equipo, comisiones y asistencia</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/profesionales/comisiones">
              <DollarSign className="h-4 w-4 mr-2" />
              <span className="sm:inline">Ver Comisiones</span>
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/profesionales/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:inline">Nuevo Profesional</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Profesionales
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.active} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ingresos del Mes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              generados por el equipo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Comisiones Pendientes
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(stats.pendingAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.pendingCommissions} por aprobar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Citas del Mes
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.monthAppointments}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              completadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="equipo" className="gap-2">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
          <TabsTrigger value="comisiones" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Comisiones
            {stats.pendingCommissions > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.pendingCommissions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="asistencia" className="gap-2">
            <Calendar className="h-4 w-4" />
            Asistencia
          </TabsTrigger>
        </TabsList>

        {/* Equipo Tab */}
        <TabsContent value="equipo" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, email o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {PROFESSIONAL_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfessionals.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No se encontraron profesionales</p>
              </div>
            ) : (
              filteredProfessionals.map((professional) => {
                const statusConfig = getProfessionalStatusConfig(professional.status)
                return (
                  <Card key={professional.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={professional.profileImageUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {getInitials(professional.firstName, professional.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {professional.fullName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {professional.specialties.slice(0, 2).join(', ') || 'Sin especialidad'}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/profesionales/${professional.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver perfil
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/profesionales/${professional.id}/editar`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/profesionales/${professional.id}/horarios`}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Horarios
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/profesionales/${professional.id}/comisiones`}>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Comisiones
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-4">
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: `${statusConfig?.color}15`,
                            borderColor: statusConfig?.color,
                            color: statusConfig?.color,
                          }}
                        >
                          {statusConfig?.label}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          {professional.email}
                        </div>
                        {professional.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            {professional.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Briefcase className="h-4 w-4" />
                          {professional.employmentType === 'employee' ? 'Empleado' :
                           professional.employmentType === 'contractor' ? 'Contratista' :
                           professional.employmentType === 'partner' ? 'Socio' : 'Propietario'}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-semibold">{professional.appointmentsThisMonth}</p>
                          <p className="text-xs text-gray-500">Citas</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            {professional.averageRating.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500">Rating</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{professional.defaultCommissionRate}%</p>
                          <p className="text-xs text-gray-500">Comision</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* Comisiones Tab */}
        <TabsContent value="comisiones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comisiones Recientes</CardTitle>
              <CardDescription>
                Comisiones generadas pendientes de aprobacion o pago
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Tasa</TableHead>
                    <TableHead className="text-right">Comision</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay comisiones registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    commissions.map((commission) => {
                      const statusConfig = getCommissionStatusConfig(commission.status)
                      return (
                        <TableRow key={commission.id}>
                          <TableCell className="font-medium">
                            {commission.professionalName}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {commission.referenceDescription}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(commission.createdAt).toLocaleDateString('es-MX')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(commission.baseAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {commission.commissionRate}%
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(commission.commissionAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor: `${statusConfig?.color}15`,
                                borderColor: statusConfig?.color,
                                color: statusConfig?.color,
                              }}
                            >
                              {statusConfig?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {commission.status === 'pending' && (
                                  <DropdownMenuItem>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Aprobar
                                  </DropdownMenuItem>
                                )}
                                {commission.status === 'approved' && (
                                  <DropdownMenuItem>
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Marcar pagada
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalles
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Asistencia Tab */}
        <TabsContent value="asistencia" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Asistencia de Hoy</CardTitle>
                <CardDescription>
                  {todayDate || 'Cargando fecha...'}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Ver historial
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Salida</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay registros de asistencia para hoy
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendance.map((log) => {
                      const statusConfig = getAttendanceStatusConfig(log.status)
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {log.professionalName}
                          </TableCell>
                          <TableCell>
                            {log.clockIn
                              ? new Date(log.clockIn).toLocaleTimeString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {log.clockOut
                              ? new Date(log.clockOut).toLocaleTimeString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {log.workedHours
                              ? `${log.workedHours.toFixed(1)}h`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor: `${statusConfig?.color}15`,
                                borderColor: statusConfig?.color,
                                color: statusConfig?.color,
                              }}
                            >
                              {statusConfig?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {log.notes || '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
