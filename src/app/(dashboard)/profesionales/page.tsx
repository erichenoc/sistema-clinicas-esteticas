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
  Clock,
  Mail,
  Phone,
  Briefcase,
  Award,
  TrendingUp,
  UserCheck,
  UserX,
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
  COMMISSION_STATUS_OPTIONS,
  ATTENDANCE_STATUS_OPTIONS,
  formatCurrency,
  getProfessionalStatusConfig,
  getCommissionStatusConfig,
  getAttendanceStatusConfig,
  getFullName,
} from '@/types/professionals'

// Mock data
const mockProfessionals: ProfessionalSummary[] = [
  {
    id: '1',
    clinicId: 'clinic-1',
    userId: 'user-1',
    firstName: 'María',
    lastName: 'García López',
    email: 'maria.garcia@clinica.com',
    phone: '+52 55 1234 5678',
    fullName: 'Dra. María García López',
    professionalCode: 'MED-001',
    licenseNumber: '12345678',
    licenseExpiry: '2026-12-31',
    specialties: ['Medicina Estética', 'Dermatología'],
    title: 'Dra.',
    bio: 'Especialista en medicina estética con más de 10 años de experiencia.',
    employmentType: 'employee',
    hireDate: '2020-03-15',
    terminationDate: null,
    baseSalary: 45000,
    salaryType: 'monthly',
    defaultCommissionRate: 15,
    commissionType: 'percentage',
    maxDailyAppointments: 20,
    appointmentBufferMinutes: 15,
    acceptsWalkIns: true,
    canViewAllPatients: true,
    canModifyPrices: false,
    canGiveDiscounts: true,
    maxDiscountPercent: 10,
    status: 'active',
    profileImageUrl: null,
    signatureImageUrl: null,
    displayOrder: 1,
    showOnBooking: true,
    appointmentsThisMonth: 78,
    revenueThisMonth: 125000,
    averageRating: 4.8,
    totalRatings: 156,
    treatmentsCount: 12,
    createdAt: '2020-03-15',
    updatedAt: '2024-01-15',
  },
  {
    id: '2',
    clinicId: 'clinic-1',
    userId: 'user-2',
    firstName: 'Carlos',
    lastName: 'Rodríguez Pérez',
    email: 'carlos.rodriguez@clinica.com',
    phone: '+52 55 9876 5432',
    fullName: 'Dr. Carlos Rodríguez Pérez',
    professionalCode: 'MED-002',
    licenseNumber: '87654321',
    licenseExpiry: '2025-06-30',
    specialties: ['Cirugía Plástica'],
    title: 'Dr.',
    bio: 'Cirujano plástico certificado.',
    employmentType: 'contractor',
    hireDate: '2021-08-01',
    terminationDate: null,
    baseSalary: null,
    salaryType: 'monthly',
    defaultCommissionRate: 25,
    commissionType: 'percentage',
    maxDailyAppointments: 10,
    appointmentBufferMinutes: 30,
    acceptsWalkIns: false,
    canViewAllPatients: false,
    canModifyPrices: false,
    canGiveDiscounts: false,
    maxDiscountPercent: 0,
    status: 'active',
    profileImageUrl: null,
    signatureImageUrl: null,
    displayOrder: 2,
    showOnBooking: true,
    appointmentsThisMonth: 32,
    revenueThisMonth: 280000,
    averageRating: 4.9,
    totalRatings: 89,
    treatmentsCount: 5,
    createdAt: '2021-08-01',
    updatedAt: '2024-01-10',
  },
  {
    id: '3',
    clinicId: 'clinic-1',
    userId: 'user-3',
    firstName: 'Ana',
    lastName: 'Martínez Silva',
    email: 'ana.martinez@clinica.com',
    phone: '+52 55 5555 1234',
    fullName: 'Lic. Ana Martínez Silva',
    professionalCode: 'COS-001',
    licenseNumber: null,
    licenseExpiry: null,
    specialties: ['Cosmetología', 'Estética Facial'],
    title: 'Lic.',
    bio: 'Cosmetóloga especializada en tratamientos faciales.',
    employmentType: 'employee',
    hireDate: '2022-01-15',
    terminationDate: null,
    baseSalary: 18000,
    salaryType: 'monthly',
    defaultCommissionRate: 10,
    commissionType: 'percentage',
    maxDailyAppointments: 25,
    appointmentBufferMinutes: 10,
    acceptsWalkIns: true,
    canViewAllPatients: false,
    canModifyPrices: false,
    canGiveDiscounts: false,
    maxDiscountPercent: 0,
    status: 'vacation',
    profileImageUrl: null,
    signatureImageUrl: null,
    displayOrder: 3,
    showOnBooking: true,
    appointmentsThisMonth: 0,
    revenueThisMonth: 0,
    averageRating: 4.6,
    totalRatings: 72,
    treatmentsCount: 8,
    createdAt: '2022-01-15',
    updatedAt: '2024-01-12',
  },
]

const mockCommissions: CommissionWithDetails[] = [
  {
    id: '1',
    clinicId: 'clinic-1',
    professionalId: '1',
    professionalName: 'Dra. María García López',
    referenceType: 'session',
    referenceId: 'session-1',
    referenceDescription: 'Botox facial - María Hernández',
    commissionRuleId: 'rule-1',
    baseAmount: 5500,
    commissionRate: 15,
    commissionAmount: 825,
    status: 'pending',
    periodStart: '2024-01-01',
    periodEnd: '2024-01-31',
    paymentDate: null,
    paymentReference: null,
    notes: null,
    createdAt: '2024-01-15T10:30:00Z',
    approvedAt: null,
    approvedBy: null,
    paidAt: null,
    paidBy: null,
  },
  {
    id: '2',
    clinicId: 'clinic-1',
    professionalId: '1',
    professionalName: 'Dra. María García López',
    referenceType: 'session',
    referenceId: 'session-2',
    referenceDescription: 'Ácido Hialurónico - Laura Sánchez',
    commissionRuleId: 'rule-1',
    baseAmount: 4500,
    commissionRate: 15,
    commissionAmount: 675,
    status: 'approved',
    periodStart: '2024-01-01',
    periodEnd: '2024-01-31',
    paymentDate: null,
    paymentReference: null,
    notes: null,
    createdAt: '2024-01-14T14:00:00Z',
    approvedAt: '2024-01-15T09:00:00Z',
    approvedBy: 'admin-1',
    paidAt: null,
    paidBy: null,
  },
]

const mockAttendance: AttendanceLogWithDetails[] = [
  {
    id: '1',
    clinicId: 'clinic-1',
    professionalId: '1',
    professionalName: 'Dra. María García López',
    branchId: null,
    branchName: 'Sucursal Principal',
    date: '2024-01-15',
    clockIn: '2024-01-15T08:55:00Z',
    clockInMethod: 'app',
    clockInNotes: null,
    clockOut: '2024-01-15T18:05:00Z',
    clockOutMethod: 'app',
    clockOutNotes: null,
    breakMinutes: 60,
    scheduledHours: 8,
    workedHours: 8.17,
    overtimeHours: 0.17,
    status: 'present',
    notes: null,
    createdAt: '2024-01-15T08:55:00Z',
    updatedAt: '2024-01-15T18:05:00Z',
    approvedBy: null,
  },
  {
    id: '2',
    clinicId: 'clinic-1',
    professionalId: '2',
    professionalName: 'Dr. Carlos Rodríguez Pérez',
    branchId: null,
    branchName: 'Sucursal Principal',
    date: '2024-01-15',
    clockIn: '2024-01-15T09:15:00Z',
    clockInMethod: 'app',
    clockInNotes: 'Tráfico',
    clockOut: null,
    clockOutMethod: null,
    clockOutNotes: null,
    breakMinutes: 0,
    scheduledHours: 6,
    workedHours: null,
    overtimeHours: 0,
    status: 'late',
    notes: 'Llegó 15 min tarde',
    createdAt: '2024-01-15T09:15:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
    approvedBy: null,
  },
]

export default function ProfesionalesPage() {
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

  // Stats
  const totalProfessionals = mockProfessionals.length
  const activeProfessionals = mockProfessionals.filter(p => p.status === 'active').length
  const pendingCommissions = mockCommissions.filter(c => c.status === 'pending').length
  const totalPendingAmount = mockCommissions
    .filter(c => c.status === 'pending' || c.status === 'approved')
    .reduce((acc, c) => acc + c.commissionAmount, 0)

  const filteredProfessionals = mockProfessionals.filter((professional) => {
    const matchesSearch =
      professional.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || professional.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profesionales</h1>
          <p className="text-gray-600 mt-1">Gestión del equipo, comisiones y asistencia</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/profesionales/comisiones">
              <DollarSign className="h-4 w-4 mr-2" />
              Ver Comisiones
            </Link>
          </Button>
          <Button asChild>
            <Link href="/profesionales/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Profesional
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
            <div className="text-2xl font-bold">{totalProfessionals}</div>
            <p className="text-xs text-gray-500 mt-1">
              {activeProfessionals} activos
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
              {formatCurrency(mockProfessionals.reduce((acc, p) => acc + p.revenueThisMonth, 0))}
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
              {formatCurrency(totalPendingAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {pendingCommissions} por aprobar
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
              {mockProfessionals.reduce((acc, p) => acc + p.appointmentsThisMonth, 0)}
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
            {pendingCommissions > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingCommissions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="asistencia" className="gap-2">
            <Clock className="h-4 w-4" />
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
                              {professional.specialties.slice(0, 2).join(', ')}
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
                          <p className="text-xs text-gray-500">Comisión</p>
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
                Comisiones generadas pendientes de aprobación o pago
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
                    <TableHead className="text-right">Comisión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCommissions.map((commission) => {
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
                  })}
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
                  {mockAttendance.map((attendance) => {
                    const statusConfig = getAttendanceStatusConfig(attendance.status)
                    return (
                      <TableRow key={attendance.id}>
                        <TableCell className="font-medium">
                          {attendance.professionalName}
                        </TableCell>
                        <TableCell>
                          {attendance.clockIn
                            ? new Date(attendance.clockIn).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {attendance.clockOut
                            ? new Date(attendance.clockOut).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {attendance.workedHours
                            ? `${attendance.workedHours.toFixed(1)}h`
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
                          {attendance.notes || '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
