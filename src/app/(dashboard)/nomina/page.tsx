'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  Users,
  Calendar,
  Download,
  Search,
  Plus,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Calculator,
  CheckCircle,
  Briefcase,
  CreditCard,
  FileText,
  Printer,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getProfessionals, type ProfessionalSummaryData } from '@/actions/professionals'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'

// Interfaces para datos
interface EmpleadoData {
  id: string
  name: string
  cedula: string
  position: string
  department: string
  type: string
  salary: number
  startDate: string
  status: string
  bankAccount: string
  afp: string
  ars: string
  avatar: string | null
}

interface NominaData {
  id: string
  employeeId: string
  employeeName: string
  period: string
  baseSalary: number
  commissions: number
  bonuses: number
  overtime: number
  grossSalary: number
  afpEmployee: number
  arsEmployee: number
  isrWithholding: number
  otherDeductions: number
  totalDeductions: number
  netSalary: number
  status: string
}

interface HistorialNominaData {
  period: string
  totalGross: number
  totalNet: number
  employeeCount: number
  status: string
  paidDate: string
}

// Función para calcular ISR según tabla DGII 2024
function calculateISR(annualSalary: number): number {
  if (annualSalary <= 416220) return 0
  if (annualSalary <= 624329) return (annualSalary - 416220) * 0.15
  if (annualSalary <= 867123) return 31216 + (annualSalary - 624329) * 0.20
  return 79776 + (annualSalary - 867123) * 0.25
}

// Función para generar nómina desde empleados
function generateNominaFromEmployees(employees: EmpleadoData[], period: string): NominaData[] {
  return employees.map(emp => {
    const baseSalary = emp.salary
    const commissions = 0 // TODO: Calcular desde comisiones reales
    const bonuses = 0
    const overtime = 0
    const grossSalary = baseSalary + commissions + bonuses + overtime

    // Deducciones
    const afpEmployee = grossSalary * 0.0287
    const arsEmployee = grossSalary * 0.0304
    const annualGross = grossSalary * 12
    const isrWithholding = calculateISR(annualGross) / 12
    const totalDeductions = afpEmployee + arsEmployee + isrWithholding
    const netSalary = grossSalary - totalDeductions

    return {
      id: `nom-${emp.id}`,
      employeeId: emp.id,
      employeeName: emp.name,
      period,
      baseSalary,
      commissions,
      bonuses,
      overtime,
      grossSalary,
      afpEmployee: Math.round(afpEmployee),
      arsEmployee: Math.round(arsEmployee),
      isrWithholding: Math.round(isrWithholding),
      otherDeductions: 0,
      totalDeductions: Math.round(totalDeductions),
      netSalary: Math.round(netSalary),
      status: 'pending',
    }
  })
}

// Historial de nóminas (mock por ahora - TODO: crear tabla en BD)
const mockHistorialNomina: HistorialNominaData[] = [
  { period: '2024-11', totalGross: 365500, totalNet: 318723, employeeCount: 5, status: 'paid', paidDate: '2024-11-30' },
  { period: '2024-10', totalGross: 358000, totalNet: 311890, employeeCount: 5, status: 'paid', paidDate: '2024-10-31' },
  { period: '2024-09', totalGross: 362000, totalNet: 315200, employeeCount: 5, status: 'paid', paidDate: '2024-09-30' },
]

export default function NominaPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2024-12')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('nomina')
  const [empleados, setEmpleados] = useState<EmpleadoData[]>([])
  const [nomina, setNomina] = useState<NominaData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cargar profesionales como empleados
  useEffect(() => {
    async function loadEmployees() {
      setIsLoading(true)
      try {
        const professionalsData = await getProfessionals({ status: 'active' })

        // Convertir profesionales a formato de empleados
        const employeesList: EmpleadoData[] = professionalsData.map((p: ProfessionalSummaryData) => ({
          id: p.id,
          name: p.full_name || `${p.first_name} ${p.last_name}`,
          cedula: p.license_number || 'Sin cédula',
          position: p.title || 'Profesional',
          department: 'Medicina Estética',
          type: p.employment_type || 'fijo',
          salary: p.base_salary || 50000, // Salario base por defecto
          startDate: p.hire_date || '2024-01-01',
          status: p.status || 'active',
          bankAccount: '****0000',
          afp: 'AFP Popular',
          ars: 'Humano',
          avatar: p.profile_image_url || null,
        }))

        setEmpleados(employeesList)

        // Generar nómina desde empleados
        const nominaList = generateNominaFromEmployees(employeesList, selectedPeriod)
        setNomina(nominaList)
      } catch (error) {
        console.error('Error loading employees:', error)
        toast.error('Error al cargar los empleados')
      } finally {
        setIsLoading(false)
      }
    }
    loadEmployees()
  }, [selectedPeriod])

  const filteredEmpleados = empleados.filter((emp) => {
    if (searchTerm && !emp.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const filteredNomina = nomina.filter((nom) => {
    if (nom.period !== selectedPeriod) return false
    if (searchTerm && !nom.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + '-01').toLocaleDateString('es-DO', {
      month: 'long',
      year: 'numeric',
    })
  }

  // Estadísticas de la nómina actual
  const totalGross = filteredNomina.reduce((acc, n) => acc + n.grossSalary, 0)
  const totalDeductions = filteredNomina.reduce((acc, n) => acc + n.totalDeductions, 0)
  const totalNet = filteredNomina.reduce((acc, n) => acc + n.netSalary, 0)
  const employeeCount = filteredNomina.length

  // Costo patronal estimado (9.97% AFP + 7.09% ARS + otros)
  const employerCost = totalGross * 0.2206

  return (
    <div className="space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Nómina</h1>
          <p className="text-muted-foreground text-sm">
            Gestión de pagos y empleados
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-12">Diciembre 2024</SelectItem>
              <SelectItem value="2024-11">Noviembre 2024</SelectItem>
              <SelectItem value="2024-10">Octubre 2024</SelectItem>
              <SelectItem value="2024-09">Septiembre 2024</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button className="flex-1 sm:flex-none">
              <Calculator className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Calcular </span>Nómina
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Salario Bruto
            </CardDescription>
            <CardTitle className="text-2xl">{formatPrice(totalGross)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              Deducciones
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">{formatPrice(totalDeductions)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Salario Neto
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">{formatPrice(totalNet)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-500" />
              Costo Patronal
            </CardDescription>
            <CardTitle className="text-2xl text-blue-600">{formatPrice(employerCost)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Empleados
            </CardDescription>
            <CardTitle className="text-2xl">{employeeCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="nomina">Nómina Actual</TabsTrigger>
          <TabsTrigger value="empleados">Empleados</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="deducciones">Deducciones</TabsTrigger>
        </TabsList>

        {/* Tab: Nómina Actual */}
        <TabsContent value="nomina" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Nómina {formatDate(selectedPeriod)}</CardTitle>
                <CardDescription>
                  Detalle de pagos para el período seleccionado
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
                <Button size="sm">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Procesar Pagos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar empleado..."
                  className="pl-9 w-full sm:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead className="text-right">Salario Base</TableHead>
                    <TableHead className="text-right">Comisiones</TableHead>
                    <TableHead className="text-right">Horas Extra</TableHead>
                    <TableHead className="text-right">Bruto</TableHead>
                    <TableHead className="text-right">Deducciones</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNomina.map((nomina) => (
                    <TableRow key={nomina.id}>
                      <TableCell className="font-medium">{nomina.employeeName}</TableCell>
                      <TableCell className="text-right">{formatPrice(nomina.baseSalary)}</TableCell>
                      <TableCell className="text-right">
                        {nomina.commissions > 0 ? formatPrice(nomina.commissions) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {nomina.overtime > 0 ? formatPrice(nomina.overtime) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(nomina.grossSalary)}</TableCell>
                      <TableCell className="text-right text-red-600">-{formatPrice(nomina.totalDeductions)}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{formatPrice(nomina.netSalary)}</TableCell>
                      <TableCell>
                        <Badge variant={nomina.status === 'paid' ? 'default' : 'secondary'}>
                          {nomina.status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Generar volante
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Procesar pago
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totales */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bruto</p>
                    <p className="text-xl font-bold">{formatPrice(totalGross)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Deducciones</p>
                    <p className="text-xl font-bold text-red-600">-{formatPrice(totalDeductions)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total a Pagar</p>
                    <p className="text-xl font-bold text-green-600">{formatPrice(totalNet)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Empleados */}
        <TabsContent value="empleados" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Empleados</CardTitle>
                <CardDescription>
                  Directorio de empleados activos
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Empleado
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Registrar Nuevo Empleado</DialogTitle>
                    <DialogDescription>
                      Ingresa los datos del nuevo empleado
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input id="name" placeholder="Nombre del empleado" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cedula">Cédula</Label>
                        <Input id="cedula" placeholder="000-0000000-0" />
                      </div>
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="position">Posición</Label>
                        <Input id="position" placeholder="Cargo del empleado" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Departamento</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medicina">Medicina Estética</SelectItem>
                            <SelectItem value="admin">Administración</SelectItem>
                            <SelectItem value="servicios">Servicios Generales</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="salary">Salario Mensual (RD$)</Label>
                        <Input id="salary" type="number" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Fecha de Ingreso</Label>
                        <Input id="startDate" type="date" />
                      </div>
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="afp">AFP</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar AFP" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="popular">AFP Popular</SelectItem>
                            <SelectItem value="reservas">AFP Reservas</SelectItem>
                            <SelectItem value="romana">AFP Romana</SelectItem>
                            <SelectItem value="siembra">AFP Siembra</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ars">ARS</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar ARS" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="humano">Humano</SelectItem>
                            <SelectItem value="senasa">Senasa</SelectItem>
                            <SelectItem value="palic">ARS Palic</SelectItem>
                            <SelectItem value="universal">Universal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Cuenta Bancaria</Label>
                      <Input id="bankAccount" placeholder="Número de cuenta para depósito" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Registrar Empleado</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="text-right">Salario Base</TableHead>
                    <TableHead>AFP/ARS</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmpleados.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={emp.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.cedula}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{emp.position}</TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(emp.salary)}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p>{emp.afp}</p>
                          <p className="text-muted-foreground">{emp.ars}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={emp.status === 'active' ? 'default' : 'secondary'}>
                          {emp.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Historial de pagos
                            </DropdownMenuItem>
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

        {/* Tab: Historial */}
        <TabsContent value="historial" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Nóminas</CardTitle>
              <CardDescription>
                Registro de nóminas procesadas anteriormente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Empleados</TableHead>
                    <TableHead className="text-right">Total Bruto</TableHead>
                    <TableHead className="text-right">Total Neto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Pago</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockHistorialNomina.map((nomina, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium capitalize">
                        {formatDate(nomina.period)}
                      </TableCell>
                      <TableCell>{nomina.employeeCount}</TableCell>
                      <TableCell className="text-right">{formatPrice(nomina.totalGross)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatPrice(nomina.totalNet)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Pagado</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(nomina.paidDate).toLocaleDateString('es-DO')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Deducciones */}
        <TabsContent value="deducciones" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Aportes del Empleado</CardTitle>
                <CardDescription>
                  Deducciones obligatorias del salario
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">AFP (Pensiones)</p>
                    <p className="text-sm text-muted-foreground">Aporte del empleado</p>
                  </div>
                  <Badge variant="outline" className="text-lg">2.87%</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">ARS (Salud)</p>
                    <p className="text-sm text-muted-foreground">Seguro de salud</p>
                  </div>
                  <Badge variant="outline" className="text-lg">3.04%</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">ISR (Impuesto)</p>
                    <p className="text-sm text-muted-foreground">Según tabla DGII</p>
                  </div>
                  <Badge variant="outline" className="text-lg">0-25%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aportes del Empleador</CardTitle>
                <CardDescription>
                  Costos patronales adicionales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">AFP Patronal</p>
                    <p className="text-sm text-muted-foreground">Aporte del empleador</p>
                  </div>
                  <Badge variant="outline" className="text-lg">7.10%</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">ARS Patronal</p>
                    <p className="text-sm text-muted-foreground">Seguro de salud</p>
                  </div>
                  <Badge variant="outline" className="text-lg">7.09%</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Riesgo Laboral</p>
                    <p className="text-sm text-muted-foreground">Seguro de riesgos</p>
                  </div>
                  <Badge variant="outline" className="text-lg">1.20%</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">INFOTEP</p>
                    <p className="text-sm text-muted-foreground">Capacitación</p>
                  </div>
                  <Badge variant="outline" className="text-lg">1.00%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Tabla de ISR 2024</CardTitle>
                <CardDescription>
                  Escala de retención de Impuesto Sobre la Renta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Renta Neta Imponible Anual</TableHead>
                      <TableHead>Tasa</TableHead>
                      <TableHead>Cálculo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Hasta RD$416,220.00</TableCell>
                      <TableCell>Exento</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>RD$416,220.01 a RD$624,329.00</TableCell>
                      <TableCell>15%</TableCell>
                      <TableCell>Del excedente de RD$416,220.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>RD$624,329.01 a RD$867,123.00</TableCell>
                      <TableCell>20%</TableCell>
                      <TableCell>RD$31,216.00 + 20% del excedente de RD$624,329.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>RD$867,123.01 en adelante</TableCell>
                      <TableCell>25%</TableCell>
                      <TableCell>RD$79,776.00 + 25% del excedente de RD$867,123.00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
