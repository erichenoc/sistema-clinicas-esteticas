'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  Users,
  Calendar,
  Search,
  Plus,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Calculator,
  CheckCircle,
  Briefcase,
  FileText,
  Printer,
  Loader2,
  Percent,
  Lock,
  Unlock,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  getProfessionals,
  updateProfessionalSalary,
  updatePayrollDeductions,
  type ProfessionalSummaryData,
} from '@/actions/professionals'
import {
  getPayrollPeriod,
  getPayrollHistory,
  closePayrollPeriod,
  markPayrollAsPaid,
  reopenPayrollPeriod,
  type PayrollPeriodData,
  type PayrollHistoryEntry,
  type PayrollAdjustment,
  type PayrollLine,
} from '@/actions/payroll'
import { formatPeriodLabel } from '@/lib/payroll/calculations'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useUser } from '@/contexts/user-context'
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
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
  /** false = se le paga el bruto sin AFP, ARS ni ISR */
  applyDeductions: boolean
}

// Ultimos 12 meses, del mas reciente al mas antiguo
function buildPeriodOptions(): { value: string; label: string }[] {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { value, label: formatPeriodLabel(value) }
  })
}

export default function NominaPage() {
  const { hasPermission } = useUser()
  const canManageSalaries = hasPermission('professionals:manage')
  const periodOptions = buildPeriodOptions()
  const [selectedPeriod, setSelectedPeriod] = useState(periodOptions[0].value)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('nomina')
  const [empleados, setEmpleados] = useState<EmpleadoData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Nomina del periodo: la guardada si el mes ya se cerro, o el calculo al vuelo
  const [payroll, setPayroll] = useState<PayrollPeriodData | null>(null)
  const [history, setHistory] = useState<PayrollHistoryEntry[]>([])
  const [adjustments, setAdjustments] = useState<Record<string, PayrollAdjustment>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [accessError, setAccessError] = useState<string | null>(null)

  // Ajustes del mes (comisiones, bonos, descuentos) antes de cerrar
  const [adjustingLine, setAdjustingLine] = useState<PayrollLine | null>(null)
  const [adjCommissions, setAdjCommissions] = useState('')
  const [adjBonuses, setAdjBonuses] = useState('')
  const [adjOvertime, setAdjOvertime] = useState('')
  const [adjOther, setAdjOther] = useState('')

  // Volante de pago del empleado
  const [receiptLine, setReceiptLine] = useState<PayrollLine | null>(null)

  // Edicion de sueldo (solo admin/dueno)
  const [editingEmp, setEditingEmp] = useState<EmpleadoData | null>(null)
  const [editSalary, setEditSalary] = useState('')
  const [editSalaryType, setEditSalaryType] = useState('monthly')
  const [isSavingSalary, setIsSavingSalary] = useState(false)

  // Descuentos de ley por empleado (solo admin/dueno)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Cargar profesionales como empleados
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
        type: p.salary_type || 'monthly',
        salary: p.base_salary ?? 0, // Sueldo real (0 = sin definir)
        startDate: p.hire_date || '2024-01-01',
        status: p.status || 'active',
        bankAccount: '****0000',
        afp: 'AFP Popular',
        ars: 'Humano',
        avatar: p.profile_image_url || null,
        applyDeductions: p.apply_payroll_deductions !== false,
      }))

      setEmpleados(employeesList)

      // Nomina y historial reales desde la base de datos
      const adjustmentList = Object.values(adjustments)
      const [payrollRes, historyRes] = await Promise.all([
        getPayrollPeriod(selectedPeriod, adjustmentList),
        getPayrollHistory(),
      ])

      if (payrollRes.error) {
        setAccessError(payrollRes.error)
      } else {
        setAccessError(null)
        setPayroll(payrollRes.data)
        setHistory(historyRes.data)
      }
    } catch (error) {
      console.error('Error loading employees:', error)
      toast.error('Error al cargar los empleados')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod])

  const openAdjustments = (line: PayrollLine) => {
    setAdjustingLine(line)
    setAdjCommissions(line.commissions ? String(line.commissions) : '')
    setAdjBonuses(line.bonuses ? String(line.bonuses) : '')
    setAdjOvertime(line.overtime ? String(line.overtime) : '')
    setAdjOther(line.otherDeductions ? String(line.otherDeductions) : '')
  }

  // Los ajustes viven en pantalla hasta que se cierra el mes; ahi se guardan
  const handleSaveAdjustments = async () => {
    if (!adjustingLine?.userId) return
    const next: Record<string, PayrollAdjustment> = {
      ...adjustments,
      [adjustingLine.userId]: {
        userId: adjustingLine.userId,
        commissions: parseFloat(adjCommissions) || 0,
        bonuses: parseFloat(adjBonuses) || 0,
        overtime: parseFloat(adjOvertime) || 0,
        otherDeductions: parseFloat(adjOther) || 0,
      },
    }
    setAdjustments(next)
    setAdjustingLine(null)

    const { data } = await getPayrollPeriod(selectedPeriod, Object.values(next))
    if (data) setPayroll(data)
    toast.success('Ajuste aplicado. Se guardará al cerrar la nómina.')
  }

  // Cerrar el mes: congela el calculo actual como documento historico
  const handleClosePayroll = async () => {
    if (!payroll) return
    const label = payroll.periodLabel
    if (
      !confirm(
        `Cerrar la nómina de ${label}?\n\n` +
          `${payroll.employeeCount} empleados · Total a pagar ${formatPrice(payroll.totalNet)}\n\n` +
          'Los montos quedan congelados. Podrás reabrirla mientras no la marques como pagada.'
      )
    ) {
      return
    }

    setIsProcessing(true)
    try {
      const { error } = await closePayrollPeriod(selectedPeriod, Object.values(adjustments))
      if (error) {
        toast.error(error)
        return
      }
      toast.success(`Nómina de ${label} cerrada`)
      setAdjustments({})
      await loadEmployees()
    } finally {
      setIsProcessing(false)
    }
  }

  // Marcar como pagada: genera el gasto para que salga en el flujo de caja
  const handleMarkPaid = async () => {
    if (!payroll?.id) return
    if (
      !confirm(
        `Marcar como pagada la nómina de ${payroll.periodLabel}?\n\n` +
          `Se registrará un gasto de ${formatPrice(payroll.totalNet)} en la categoría Nómina, ` +
          'para que aparezca en el flujo de caja.'
      )
    ) {
      return
    }

    setIsProcessing(true)
    try {
      const { error, expenseError } = await markPayrollAsPaid(payroll.id)
      if (error) {
        toast.error(error)
        return
      }
      if (expenseError) {
        toast.warning(`Nómina marcada como pagada, pero el gasto no se registró: ${expenseError}`)
      } else {
        toast.success('Nómina pagada y registrada en el flujo de caja')
      }
      await loadEmployees()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReopenPayroll = async () => {
    if (!payroll?.id) return
    if (!confirm(`Reabrir la nómina de ${payroll.periodLabel}? Se borrará el cierre y volverá a calcularse.`)) {
      return
    }

    setIsProcessing(true)
    try {
      const { error } = await reopenPayrollPeriod(payroll.id)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Nómina reabierta')
      await loadEmployees()
    } finally {
      setIsProcessing(false)
    }
  }

  // Decidir si a este empleado se le aplican AFP, ARS e ISR
  const handleToggleDeductions = async (emp: EmpleadoData) => {
    const next = !emp.applyDeductions
    setTogglingId(emp.id)
    try {
      const result = await updatePayrollDeductions(emp.id, next)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(
        next
          ? `A ${emp.name} se le aplicarán los descuentos de ley`
          : `A ${emp.name} se le pagará el bruto sin descuentos`
      )
      await loadEmployees()
    } finally {
      setTogglingId(null)
    }
  }

  const openEditSalary = (emp: EmpleadoData) => {
    setEditingEmp(emp)
    setEditSalary(emp.salary > 0 ? String(emp.salary) : '')
    setEditSalaryType(emp.type || 'monthly')
  }

  const handleSaveSalary = async () => {
    if (!editingEmp) return
    const amount = parseFloat(editSalary)
    if (isNaN(amount) || amount < 0) {
      toast.error('Ingrese un sueldo valido')
      return
    }
    setIsSavingSalary(true)
    try {
      const result = await updateProfessionalSalary(editingEmp.id, {
        baseSalary: amount,
        salaryType: editSalaryType,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Sueldo de ${editingEmp.name} actualizado`)
      setEditingEmp(null)
      await loadEmployees()
    } catch (error) {
      console.error('Error saving salary:', error)
      toast.error('Error al guardar el sueldo')
    } finally {
      setIsSavingSalary(false)
    }
  }

  const filteredEmpleados = empleados.filter((emp) => {
    if (searchTerm && !emp.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  // La busqueda solo filtra la tabla; los totales son del periodo completo
  const filteredNomina = (payroll?.lines || []).filter((line) => {
    if (searchTerm && !line.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(price)
  }

  // Totales del periodo, calculados en el servidor
  const totalGross = payroll?.totalGross ?? 0
  const totalDeductions = payroll?.totalDeductions ?? 0
  const totalNet = payroll?.totalNet ?? 0
  const employeeCount = payroll?.employeeCount ?? 0
  const employerCost = payroll?.employerCost ?? 0

  const isClosed = payroll?.status === 'closed' || payroll?.status === 'paid'
  const isPaid = payroll?.status === 'paid'

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
              {periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            {canManageSalaries && !isClosed && (
              <Button
                className="flex-1 sm:flex-none"
                onClick={handleClosePayroll}
                disabled={isProcessing || isLoading || employeeCount === 0}
              >
                <Lock className="mr-2 h-4 w-4" />
                {isProcessing ? 'Procesando...' : 'Cerrar Nómina'}
              </Button>
            )}
            {canManageSalaries && isClosed && !isPaid && (
              <>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={handleReopenPayroll}
                  disabled={isProcessing}
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  Reabrir
                </Button>
                <Button
                  className="flex-1 sm:flex-none"
                  onClick={handleMarkPaid}
                  disabled={isProcessing}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {isProcessing ? 'Procesando...' : 'Marcar Pagada'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {accessError && (
        <Alert variant="destructive">
          <AlertTitle>Acceso restringido</AlertTitle>
          <AlertDescription>{accessError}</AlertDescription>
        </Alert>
      )}

      {/* Estado del periodo */}
      {payroll && (
        <Alert
          className={
            isPaid
              ? 'border-green-300 bg-green-50 dark:bg-green-950'
              : isClosed
                ? 'border-blue-300 bg-blue-50 dark:bg-blue-950'
                : 'border-amber-300 bg-amber-50 dark:bg-amber-950'
          }
        >
          <AlertTitle>
            {isPaid
              ? `Nómina de ${payroll.periodLabel} pagada`
              : isClosed
                ? `Nómina de ${payroll.periodLabel} cerrada`
                : `Nómina de ${payroll.periodLabel} sin cerrar`}
          </AlertTitle>
          <AlertDescription>
            {isPaid
              ? `Pagada el ${payroll.paidAt ? new Date(payroll.paidAt).toLocaleDateString('es-DO') : '—'}. Los montos quedaron congelados y el pago aparece en el flujo de caja.`
              : isClosed
                ? `Cerrada${payroll.closedByName ? ` por ${payroll.closedByName}` : ''}${payroll.closedAt ? ` el ${new Date(payroll.closedAt).toLocaleDateString('es-DO')}` : ''}. Marcala como pagada cuando entregues el dinero.`
                : 'Estos montos se calculan al momento y cambian si editas sueldos. Cierra el mes para dejarlos fijos como documento histórico.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Salario Bruto
            </CardDescription>
            <CardTitle className="text-lg sm:text-xl break-words">{formatPrice(totalGross)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              Deducciones
            </CardDescription>
            <CardTitle className="text-lg sm:text-xl text-red-600 break-words">{formatPrice(totalDeductions)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Salario Neto
            </CardDescription>
            <CardTitle className="text-lg sm:text-xl text-primary break-words">{formatPrice(totalNet)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-500" />
              Costo Patronal
            </CardDescription>
            <CardTitle className="text-lg sm:text-xl break-words">{formatPrice(employerCost)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Empleados
            </CardDescription>
            <CardTitle className="text-lg sm:text-xl">{employeeCount}</CardTitle>
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
                <CardTitle>Nómina {payroll?.periodLabel || ''}</CardTitle>
                <CardDescription>
                  {isClosed
                    ? 'Detalle congelado al momento del cierre'
                    : 'Detalle calculado con los sueldos actuales'}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
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
                  {filteredNomina.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        {isLoading
                          ? 'Cargando...'
                          : 'No hay empleados con sueldo definido para este período'}
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredNomina.map((nomina) => (
                    <TableRow key={nomina.id || nomina.userId}>
                      <TableCell className="font-medium">
                        {nomina.employeeName}
                        {!nomina.applyDeductions && (
                          <Badge className="ml-2 bg-amber-500 text-xs">Sin descuentos</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatPrice(nomina.baseSalary)}</TableCell>
                      <TableCell className="text-right">
                        {nomina.commissions > 0 ? formatPrice(nomina.commissions) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {nomina.overtime > 0 ? formatPrice(nomina.overtime) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(nomina.grossSalary)}</TableCell>
                      <TableCell className="text-right text-red-600">
                        {nomina.totalDeductions > 0 ? (
                          `-${formatPrice(nomina.totalDeductions)}`
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">{formatPrice(nomina.netSalary)}</TableCell>
                      <TableCell>
                        {isPaid ? (
                          <Badge className="bg-green-500">Pagado</Badge>
                        ) : isClosed ? (
                          <Badge className="bg-blue-500">Cerrado</Badge>
                        ) : (
                          <Badge variant="secondary">Borrador</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setReceiptLine(nomina)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Ver volante de pago
                            </DropdownMenuItem>
                            {canManageSalaries && !isClosed && nomina.userId && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => openAdjustments(nomina)}>
                                  <Calculator className="mr-2 h-4 w-4" />
                                  Ajustar comisiones y bonos
                                </DropdownMenuItem>
                              </>
                            )}
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
                    <p className="text-xl font-bold text-primary">{formatPrice(totalNet)}</p>
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
              <Button asChild>
                <Link href="/profesionales/nuevo">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Empleado
                </Link>
              </Button>
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
                    <TableHead>Descuentos</TableHead>
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
                      <TableCell className="text-right font-medium">
                        {emp.salary > 0 ? (
                          formatPrice(emp.salary)
                        ) : (
                          <span className="text-muted-foreground font-normal">Sin definir</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p>{emp.afp}</p>
                          <p className="text-muted-foreground">{emp.ars}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {emp.applyDeductions ? (
                          <Badge variant="outline">De ley</Badge>
                        ) : (
                          <Badge className="bg-amber-500">Sin descuentos</Badge>
                        )}
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
                            {canManageSalaries && (
                              <DropdownMenuItem onSelect={() => openEditSalary(emp)}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Editar sueldo
                              </DropdownMenuItem>
                            )}
                            {canManageSalaries && (
                              <DropdownMenuItem
                                onSelect={() => handleToggleDeductions(emp)}
                                disabled={togglingId === emp.id}
                              >
                                <Percent className="mr-2 h-4 w-4" />
                                {emp.applyDeductions
                                  ? 'Pagar sin descuentos'
                                  : 'Aplicar descuentos de ley'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href={`/profesionales/${emp.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver perfil
                              </Link>
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
                  {history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Aún no hay nóminas cerradas. Cierra el mes actual para que quede registrado.
                      </TableCell>
                    </TableRow>
                  )}
                  {history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.periodLabel}</TableCell>
                      <TableCell>{entry.employeeCount}</TableCell>
                      <TableCell className="text-right">{formatPrice(entry.totalGross)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatPrice(entry.totalNet)}
                      </TableCell>
                      <TableCell>
                        {entry.status === 'paid' ? (
                          <Badge className="bg-green-500">Pagado</Badge>
                        ) : entry.status === 'cancelled' ? (
                          <Badge variant="outline">Anulado</Badge>
                        ) : (
                          <Badge className="bg-blue-500">Cerrado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.paidAt ? new Date(entry.paidAt).toLocaleDateString('es-DO') : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPeriod(entry.period)
                            setActiveTab('nomina')
                          }}
                        >
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

      {/* Editar sueldo (solo admin/dueno) */}
      <Dialog open={!!editingEmp} onOpenChange={(open) => !open && setEditingEmp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sueldo</DialogTitle>
            <DialogDescription>
              {editingEmp && `Sueldo base de ${editingEmp.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-salary">Sueldo Base (RD$)</Label>
              <Input
                id="edit-salary"
                type="number"
                min="0"
                placeholder="0.00"
                value={editSalary}
                onChange={(e) => setEditSalary(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-salary-type">Tipo de Sueldo</Label>
              <Select value={editSalaryType} onValueChange={setEditSalaryType}>
                <SelectTrigger id="edit-salary-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="biweekly">Quincenal</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="hourly">Por hora</SelectItem>
                  <SelectItem value="commission_only">Solo comisiones</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEmp(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSalary} disabled={isSavingSalary}>
              {isSavingSalary && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Sueldo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ajustes del mes: comisiones, bonos, horas extra y otros descuentos */}
      <Dialog open={!!adjustingLine} onOpenChange={(open) => !open && setAdjustingLine(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Ajustar {adjustingLine?.employeeName}</DialogTitle>
            <DialogDescription>
              Sueldo base {formatPrice(adjustingLine?.baseSalary || 0)}. Los ajustes se guardan al
              cerrar la nómina.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adj-com">Comisiones (RD$)</Label>
              <Input id="adj-com" type="number" min="0" step="0.01" value={adjCommissions}
                onChange={(e) => setAdjCommissions(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adj-bon">Bonificaciones (RD$)</Label>
              <Input id="adj-bon" type="number" min="0" step="0.01" value={adjBonuses}
                onChange={(e) => setAdjBonuses(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adj-ext">Horas extra (RD$)</Label>
              <Input id="adj-ext" type="number" min="0" step="0.01" value={adjOvertime}
                onChange={(e) => setAdjOvertime(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adj-oth">Otros descuentos (RD$)</Label>
              <Input id="adj-oth" type="number" min="0" step="0.01" value={adjOther}
                onChange={(e) => setAdjOther(e.target.value)} placeholder="0.00" />
              <p className="text-xs text-muted-foreground">Adelantos, préstamos</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustingLine(null)}>Cancelar</Button>
            <Button onClick={handleSaveAdjustments}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Volante de pago */}
      <Dialog open={!!receiptLine} onOpenChange={(open) => !open && setReceiptLine(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Volante de pago</DialogTitle>
            <DialogDescription>
              {receiptLine?.employeeName} — {payroll?.periodLabel}
            </DialogDescription>
          </DialogHeader>
          {receiptLine && (
            <div className="space-y-3 text-sm">
              <div className="rounded-md border p-3 space-y-2">
                <p className="font-medium">Ingresos</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sueldo base</span>
                  <span>{formatPrice(receiptLine.baseSalary)}</span>
                </div>
                {receiptLine.commissions > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comisiones</span>
                    <span>{formatPrice(receiptLine.commissions)}</span>
                  </div>
                )}
                {receiptLine.bonuses > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bonificaciones</span>
                    <span>{formatPrice(receiptLine.bonuses)}</span>
                  </div>
                )}
                {receiptLine.overtime > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas extra</span>
                    <span>{formatPrice(receiptLine.overtime)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>Total bruto</span>
                  <span>{formatPrice(receiptLine.grossSalary)}</span>
                </div>
              </div>

              <div className="rounded-md border p-3 space-y-2">
                <p className="font-medium">Deducciones</p>
                {receiptLine.applyDeductions ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AFP (2.87%)</span>
                      <span className="text-red-600">-{formatPrice(receiptLine.afpEmployee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ARS (3.04%)</span>
                      <span className="text-red-600">-{formatPrice(receiptLine.arsEmployee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ISR</span>
                      <span className="text-red-600">-{formatPrice(receiptLine.isrWithholding)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Se paga el bruto completo, sin descuentos de ley
                  </p>
                )}
                {receiptLine.otherDeductions > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Otros descuentos</span>
                    <span className="text-red-600">-{formatPrice(receiptLine.otherDeductions)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>Total deducciones</span>
                  <span className="text-red-600">
                    {receiptLine.totalDeductions > 0
                      ? `-${formatPrice(receiptLine.totalDeductions)}`
                      : formatPrice(0)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between rounded-md bg-muted p-3 text-base font-bold">
                <span>Neto a recibir</span>
                <span className="text-green-600">{formatPrice(receiptLine.netSalary)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptLine(null)}>Cerrar</Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
