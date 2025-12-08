'use client'

import { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Download,
  FileText,
  Filter,
  Package,
  UserCheck,
  Clock,
  Target,
  PieChart,
  Activity,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

// Mock data - en producción vendría de Supabase
const financialSummary = {
  totalRevenue: 458750,
  previousRevenue: 385200,
  totalExpenses: 125430,
  previousExpenses: 112800,
  netProfit: 333320,
  previousProfit: 272400,
  averageTicket: 2850,
  previousTicket: 2650,
}

const revenueByCategory = [
  { category: 'Tratamientos Faciales', amount: 185400, percentage: 40, color: 'bg-rose-500' },
  { category: 'Tratamientos Corporales', amount: 138200, percentage: 30, color: 'bg-purple-500' },
  { category: 'Depilación Láser', amount: 92000, percentage: 20, color: 'bg-blue-500' },
  { category: 'Productos Retail', amount: 43150, percentage: 10, color: 'bg-emerald-500' },
]

const monthlyRevenue = [
  { month: 'Ene', revenue: 320000, target: 300000 },
  { month: 'Feb', revenue: 285000, target: 310000 },
  { month: 'Mar', revenue: 365000, target: 320000 },
  { month: 'Abr', revenue: 410000, target: 350000 },
  { month: 'May', revenue: 385000, target: 380000 },
  { month: 'Jun', revenue: 458750, target: 400000 },
]

const patientStats = {
  totalActive: 1250,
  newThisMonth: 85,
  previousNew: 62,
  returning: 342,
  previousReturning: 298,
  retentionRate: 78,
  previousRetention: 72,
  averageVisits: 3.2,
  referrals: 28,
}

const patientsByAgeGroup = [
  { group: '18-25', count: 125, percentage: 10 },
  { group: '26-35', count: 438, percentage: 35 },
  { group: '36-45', count: 375, percentage: 30 },
  { group: '46-55', count: 212, percentage: 17 },
  { group: '56+', count: 100, percentage: 8 },
]

const topTreatments = [
  { name: 'Botox', sessions: 145, revenue: 797500, growth: 15 },
  { name: 'Ácido Hialurónico', sessions: 98, revenue: 441000, growth: 22 },
  { name: 'Limpieza Facial Profunda', sessions: 210, revenue: 252000, growth: 8 },
  { name: 'Depilación Láser', sessions: 175, revenue: 490000, growth: -3 },
  { name: 'Microdermoabrasión', sessions: 85, revenue: 127500, growth: 12 },
]

const appointmentStats = {
  total: 485,
  completed: 412,
  cancelled: 38,
  noShow: 35,
  averageDuration: 52,
  occupancyRate: 78,
  peakDay: 'Martes',
  peakHour: '10:00 - 12:00',
}

const professionalPerformance = [
  { name: 'Dra. Ana López', revenue: 185000, appointments: 95, rating: 4.9, commission: 27750 },
  { name: 'Dr. Carlos Méndez', revenue: 142000, appointments: 72, rating: 4.8, commission: 21300 },
  { name: 'Lic. Carmen Ruiz', revenue: 98000, appointments: 125, rating: 4.7, commission: 14700 },
  { name: 'Lic. María Torres', revenue: 75000, appointments: 88, rating: 4.6, commission: 11250 },
]

const inventoryAlerts = [
  { product: 'Ácido Hialurónico 1ml', stock: 8, minStock: 15, status: 'critical' },
  { product: 'Botox 50U', stock: 12, minStock: 20, status: 'low' },
  { product: 'Crema Hidratante Pro', stock: 5, minStock: 10, status: 'critical' },
  { product: 'Suero Vitamina C', stock: 18, minStock: 25, status: 'low' },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function calculateChange(current: number, previous: number): { value: number; isPositive: boolean } {
  const change = ((current - previous) / previous) * 100
  return { value: Math.abs(change), isPositive: change >= 0 }
}

export default function ReportesPage() {
  const [period, setPeriod] = useState('month')
  const [activeTab, setActiveTab] = useState('financiero')
  const [isExporting, setIsExporting] = useState(false)
  const [exportingReport, setExportingReport] = useState<string | null>(null)

  const revenueChange = calculateChange(financialSummary.totalRevenue, financialSummary.previousRevenue)
  const profitChange = calculateChange(financialSummary.netProfit, financialSummary.previousProfit)
  const ticketChange = calculateChange(financialSummary.averageTicket, financialSummary.previousTicket)
  const newPatientsChange = calculateChange(patientStats.newThisMonth, patientStats.previousNew)

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return 'Esta Semana'
      case 'month': return 'Este Mes'
      case 'quarter': return 'Este Trimestre'
      case 'year': return 'Este Ano'
      default: return 'Periodo Seleccionado'
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    toast.loading('Generando PDF...', { id: 'export-pdf' })

    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 1500))

    // In production, this would call a server action or API to generate PDF
    // For now, we'll use window.print() as a fallback
    toast.dismiss('export-pdf')
    toast.success('Abriendo vista de impresion para guardar como PDF')

    // Apply print styles and trigger print
    const printContent = document.querySelector('main')
    if (printContent) {
      window.print()
    }

    setIsExporting(false)
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    toast.loading('Generando archivo Excel...', { id: 'export-excel' })

    await new Promise(resolve => setTimeout(resolve, 1500))

    // In production, this would generate a real Excel file
    // For demo, we'll create a CSV
    const csvContent = generateCSVContent()
    downloadFile(csvContent, `reporte-${activeTab}-${period}.csv`, 'text/csv')

    toast.dismiss('export-excel')
    toast.success('Archivo descargado exitosamente')
    setIsExporting(false)
  }

  const generateCSVContent = () => {
    // Generate CSV based on active tab
    let headers = ''
    let rows = ''

    switch (activeTab) {
      case 'financiero':
        headers = 'Categoria,Monto,Porcentaje\n'
        rows = revenueByCategory.map(r => `${r.category},${r.amount},${r.percentage}%`).join('\n')
        break
      case 'pacientes':
        headers = 'Grupo de Edad,Cantidad,Porcentaje\n'
        rows = patientsByAgeGroup.map(g => `${g.group} anos,${g.count},${g.percentage}%`).join('\n')
        break
      case 'operativo':
        headers = 'Metrica,Valor\n'
        rows = `Total Citas,${appointmentStats.total}\nCompletadas,${appointmentStats.completed}\nCanceladas,${appointmentStats.cancelled}\nNo-Show,${appointmentStats.noShow}`
        break
      case 'equipo':
        headers = 'Profesional,Ingresos,Citas,Rating,Comision\n'
        rows = professionalPerformance.map(p => `${p.name},${p.revenue},${p.appointments},${p.rating},${p.commission}`).join('\n')
        break
      case 'inventario':
        headers = 'Producto,Stock Actual,Stock Minimo,Estado\n'
        rows = inventoryAlerts.map(a => `${a.product},${a.stock},${a.minStock},${a.status}`).join('\n')
        break
      default:
        headers = 'Data\n'
        rows = 'Sin datos'
    }

    return headers + rows
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleGenerateReport = async (reportName: string) => {
    setExportingReport(reportName)
    toast.loading(`Generando ${reportName}...`, { id: `report-${reportName}` })

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Generate appropriate content based on report type
    let content = ''
    const date = new Date().toLocaleDateString('es-DO')

    switch (reportName) {
      case 'Reporte de Ventas':
        content = `REPORTE DE VENTAS - ${getPeriodLabel()}\nFecha: ${date}\n\nIngresos Totales: ${formatCurrency(financialSummary.totalRevenue)}\nGastos: ${formatCurrency(financialSummary.totalExpenses)}\nUtilidad Neta: ${formatCurrency(financialSummary.netProfit)}\n\nDETALLE POR CATEGORIA:\n${revenueByCategory.map(r => `- ${r.category}: ${formatCurrency(r.amount)} (${r.percentage}%)`).join('\n')}`
        break
      case 'Reporte de Pacientes':
        content = `REPORTE DE PACIENTES - ${getPeriodLabel()}\nFecha: ${date}\n\nPacientes Activos: ${patientStats.totalActive}\nNuevos Este Mes: ${patientStats.newThisMonth}\nTasa de Retencion: ${patientStats.retentionRate}%\n\nDISTRIBUCION POR EDAD:\n${patientsByAgeGroup.map(g => `- ${g.group} anos: ${g.count} pacientes (${g.percentage}%)`).join('\n')}`
        break
      case 'Reporte de Citas':
        content = `REPORTE DE CITAS - ${getPeriodLabel()}\nFecha: ${date}\n\nTotal Citas: ${appointmentStats.total}\nCompletadas: ${appointmentStats.completed}\nCanceladas: ${appointmentStats.cancelled}\nNo-Shows: ${appointmentStats.noShow}\nOcupacion: ${appointmentStats.occupancyRate}%\nDia Pico: ${appointmentStats.peakDay}\nHorario Pico: ${appointmentStats.peakHour}`
        break
      case 'Reporte de Inventario':
        content = `REPORTE DE INVENTARIO - ${getPeriodLabel()}\nFecha: ${date}\n\nValor Total: ${formatCurrency(485000)}\nSKUs Activos: 156\nStock Bajo: 12 productos\nPor Vencer: 5 productos\n\nALERTAS:\n${inventoryAlerts.map(a => `- ${a.product}: ${a.stock} unidades (min: ${a.minStock}) - ${a.status.toUpperCase()}`).join('\n')}`
        break
      case 'Reporte de Comisiones':
        const totalComm = professionalPerformance.reduce((sum, p) => sum + p.commission, 0)
        content = `REPORTE DE COMISIONES - ${getPeriodLabel()}\nFecha: ${date}\n\nTotal Comisiones: ${formatCurrency(totalComm)}\n\nDETALLE POR PROFESIONAL:\n${professionalPerformance.map(p => `- ${p.name}: ${formatCurrency(p.commission)} (${p.appointments} citas)`).join('\n')}`
        break
      case 'Reporte de Tratamientos':
        content = `REPORTE DE TRATAMIENTOS - ${getPeriodLabel()}\nFecha: ${date}\n\nTOP TRATAMIENTOS:\n${topTreatments.map((t, i) => `${i+1}. ${t.name}: ${t.sessions} sesiones - ${formatCurrency(t.revenue)} (${t.growth >= 0 ? '+' : ''}${t.growth}%)`).join('\n')}`
        break
      case 'Reporte de Productividad':
        content = `REPORTE DE PRODUCTIVIDAD - ${getPeriodLabel()}\nFecha: ${date}\n\nRENDIMIENTO DEL EQUIPO:\n${professionalPerformance.map(p => `- ${p.name}:\n  Ingresos: ${formatCurrency(p.revenue)}\n  Citas: ${p.appointments}\n  Rating: ${p.rating}/5`).join('\n\n')}`
        break
      case 'Reporte Fiscal':
        content = `REPORTE FISCAL - ${getPeriodLabel()}\nFecha: ${date}\n\nRESUMEN FISCAL:\nIngresos Brutos: ${formatCurrency(financialSummary.totalRevenue)}\nGastos Deducibles: ${formatCurrency(financialSummary.totalExpenses)}\nBase Imponible: ${formatCurrency(financialSummary.netProfit)}\n\nNota: Este reporte es informativo. Consulte con su contador para declaraciones oficiales.`
        break
      default:
        content = `REPORTE - ${getPeriodLabel()}\nFecha: ${date}\n\nContenido del reporte...`
    }

    downloadFile(content, `${reportName.toLowerCase().replace(/ /g, '-')}-${date}.txt`, 'text/plain')

    toast.dismiss(`report-${reportName}`)
    toast.success(`${reportName} descargado exitosamente`)
    setExportingReport(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">Análisis detallado del rendimiento de la clínica</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar como PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Exportar como Excel (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialSummary.totalRevenue)}</div>
            <div className="flex items-center text-xs">
              {revenueChange.isPositive ? (
                <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={revenueChange.isPositive ? 'text-emerald-500' : 'text-red-500'}>
                {revenueChange.value.toFixed(1)}%
              </span>
              <span className="ml-1 text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilidad Neta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialSummary.netProfit)}</div>
            <div className="flex items-center text-xs">
              {profitChange.isPositive ? (
                <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={profitChange.isPositive ? 'text-emerald-500' : 'text-red-500'}>
                {profitChange.value.toFixed(1)}%
              </span>
              <span className="ml-1 text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialSummary.averageTicket)}</div>
            <div className="flex items-center text-xs">
              {ticketChange.isPositive ? (
                <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={ticketChange.isPositive ? 'text-emerald-500' : 'text-red-500'}>
                {ticketChange.value.toFixed(1)}%
              </span>
              <span className="ml-1 text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Nuevos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientStats.newThisMonth}</div>
            <div className="flex items-center text-xs">
              {newPatientsChange.isPositive ? (
                <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={newPatientsChange.isPositive ? 'text-emerald-500' : 'text-red-500'}>
                {newPatientsChange.value.toFixed(1)}%
              </span>
              <span className="ml-1 text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Reportes */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="financiero" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Financiero</span>
          </TabsTrigger>
          <TabsTrigger value="pacientes" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Pacientes</span>
          </TabsTrigger>
          <TabsTrigger value="operativo" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Operativo</span>
          </TabsTrigger>
          <TabsTrigger value="equipo" className="gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Equipo</span>
          </TabsTrigger>
          <TabsTrigger value="inventario" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Inventario</span>
          </TabsTrigger>
        </TabsList>

        {/* Reporte Financiero */}
        <TabsContent value="financiero" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Ingresos por Categoría */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Ingresos por Categoría
                </CardTitle>
                <CardDescription>Distribución de ingresos del período</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {revenueByCategory.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.category}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={item.percentage} className="h-2" />
                      <span className="text-xs text-muted-foreground w-10">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tendencia Mensual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Tendencia de Ingresos
                </CardTitle>
                <CardDescription>Comparativa mensual vs objetivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyRevenue.map((item) => {
                    const achievement = (item.revenue / item.target) * 100
                    const isAboveTarget = item.revenue >= item.target
                    return (
                      <div key={item.month} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.month}</span>
                          <div className="flex items-center gap-2">
                            <span>{formatCurrency(item.revenue)}</span>
                            <Badge variant={isAboveTarget ? 'default' : 'secondary'} className="text-xs">
                              {achievement.toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`absolute h-full ${isAboveTarget ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(achievement, 100)}%` }}
                          />
                          <div
                            className="absolute h-full w-0.5 bg-gray-400"
                            style={{ left: '100%', transform: 'translateX(-100%)' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Tratamientos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Top Tratamientos
              </CardTitle>
              <CardDescription>Tratamientos más rentables del período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-sm text-muted-foreground">
                      <th className="pb-3 text-left font-medium">Tratamiento</th>
                      <th className="pb-3 text-right font-medium">Sesiones</th>
                      <th className="pb-3 text-right font-medium">Ingresos</th>
                      <th className="pb-3 text-right font-medium">Crecimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {topTreatments.map((treatment, index) => (
                      <tr key={treatment.name} className="text-sm">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                              {index + 1}
                            </span>
                            {treatment.name}
                          </div>
                        </td>
                        <td className="py-3 text-right">{treatment.sessions}</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(treatment.revenue)}</td>
                        <td className="py-3 text-right">
                          <span className={`flex items-center justify-end gap-1 ${treatment.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {treatment.growth >= 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {Math.abs(treatment.growth)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporte de Pacientes */}
        <TabsContent value="pacientes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pacientes Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patientStats.totalActive.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total en la base de datos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pacientes Recurrentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patientStats.returning}</div>
                <p className="text-xs text-muted-foreground">
                  +{patientStats.returning - patientStats.previousReturning} vs mes anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Retención</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patientStats.retentionRate}%</div>
                <p className="text-xs text-emerald-500">
                  +{patientStats.retentionRate - patientStats.previousRetention}% vs mes anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Referidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patientStats.referrals}</div>
                <p className="text-xs text-muted-foreground">Nuevos por recomendación</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Edad</CardTitle>
                <CardDescription>Segmentación demográfica de pacientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {patientsByAgeGroup.map((group) => (
                  <div key={group.group} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{group.group} años</span>
                      <span className="font-medium">{group.count} pacientes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={group.percentage} className="h-2" />
                      <span className="text-xs text-muted-foreground w-10">{group.percentage}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fuentes de Captación</CardTitle>
                <CardDescription>Cómo nos encuentran los pacientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { source: 'Redes Sociales', count: 35, percentage: 41 },
                  { source: 'Referidos', count: 28, percentage: 33 },
                  { source: 'Google', count: 12, percentage: 14 },
                  { source: 'Publicidad', count: 7, percentage: 8 },
                  { source: 'Otros', count: 3, percentage: 4 },
                ].map((item) => (
                  <div key={item.source} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.source}</span>
                      <span className="font-medium">{item.count} pacientes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={item.percentage} className="h-2" />
                      <span className="text-xs text-muted-foreground w-10">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reporte Operativo */}
        <TabsContent value="operativo" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Citas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{appointmentStats.total}</div>
                <p className="text-xs text-muted-foreground">En el período seleccionado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Completadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((appointmentStats.completed / appointmentStats.total) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">{appointmentStats.completed} completadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{appointmentStats.occupancyRate}%</div>
                <p className="text-xs text-muted-foreground">Capacidad utilizada</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">No-Shows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{appointmentStats.noShow}</div>
                <p className="text-xs text-muted-foreground">
                  {((appointmentStats.noShow / appointmentStats.total) * 100).toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horarios Pico
                </CardTitle>
                <CardDescription>Momentos de mayor demanda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Día más ocupado</p>
                    <p className="text-sm text-muted-foreground">Mayor volumen de citas</p>
                  </div>
                  <Badge variant="secondary" className="text-lg">{appointmentStats.peakDay}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Horario pico</p>
                    <p className="text-sm text-muted-foreground">Franja de mayor demanda</p>
                  </div>
                  <Badge variant="secondary" className="text-lg">{appointmentStats.peakHour}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Duración promedio</p>
                    <p className="text-sm text-muted-foreground">Por cita</p>
                  </div>
                  <Badge variant="secondary" className="text-lg">{appointmentStats.averageDuration} min</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado de Citas</CardTitle>
                <CardDescription>Distribución por estado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { status: 'Completadas', count: appointmentStats.completed, color: 'bg-emerald-500', percentage: (appointmentStats.completed / appointmentStats.total) * 100 },
                  { status: 'Canceladas', count: appointmentStats.cancelled, color: 'bg-amber-500', percentage: (appointmentStats.cancelled / appointmentStats.total) * 100 },
                  { status: 'No-Show', count: appointmentStats.noShow, color: 'bg-red-500', percentage: (appointmentStats.noShow / appointmentStats.total) * 100 },
                ].map((item) => (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${item.color}`} />
                        <span>{item.status}</span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reporte de Equipo */}
        <TabsContent value="equipo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Rendimiento del Equipo
              </CardTitle>
              <CardDescription>Métricas de productividad por profesional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-sm text-muted-foreground">
                      <th className="pb-3 text-left font-medium">Profesional</th>
                      <th className="pb-3 text-right font-medium">Ingresos</th>
                      <th className="pb-3 text-right font-medium">Citas</th>
                      <th className="pb-3 text-right font-medium">Rating</th>
                      <th className="pb-3 text-right font-medium">Comisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {professionalPerformance.map((prof, index) => (
                      <tr key={prof.name} className="text-sm">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium">
                              {prof.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium">{prof.name}</p>
                              {index === 0 && <Badge className="text-xs">Top Performer</Badge>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right font-medium">{formatCurrency(prof.revenue)}</td>
                        <td className="py-4 text-right">{prof.appointments}</td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-amber-500">★</span>
                            {prof.rating}
                          </div>
                        </td>
                        <td className="py-4 text-right text-emerald-600 font-medium">
                          {formatCurrency(prof.commission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/50">
                      <td className="py-3 font-medium">Total</td>
                      <td className="py-3 text-right font-bold">
                        {formatCurrency(professionalPerformance.reduce((sum, p) => sum + p.revenue, 0))}
                      </td>
                      <td className="py-3 text-right font-bold">
                        {professionalPerformance.reduce((sum, p) => sum + p.appointments, 0)}
                      </td>
                      <td className="py-3 text-right">-</td>
                      <td className="py-3 text-right font-bold text-emerald-600">
                        {formatCurrency(professionalPerformance.reduce((sum, p) => sum + p.commission, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporte de Inventario */}
        <TabsContent value="inventario" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor del Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(485000)}</div>
                <p className="text-xs text-muted-foreground">Total en existencia</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">SKUs activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">12</div>
                <p className="text-xs text-muted-foreground">Productos por reabastecer</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">5</div>
                <p className="text-xs text-muted-foreground">En los próximos 30 días</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Alertas de Inventario
              </CardTitle>
              <CardDescription>Productos que requieren atención</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryAlerts.map((alert) => (
                  <div
                    key={alert.product}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      alert.status === 'critical' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        alert.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <div>
                        <p className="font-medium">{alert.product}</p>
                        <p className="text-sm text-muted-foreground">
                          Stock actual: {alert.stock} | Mínimo: {alert.minStock}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.status === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.status === 'critical' ? 'Crítico' : 'Bajo'}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Ordenar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Accesos Rápidos a Reportes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reportes Disponibles
          </CardTitle>
          <CardDescription>Genera y descarga reportes detallados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Reporte de Ventas', description: 'Detalle de todas las transacciones', icon: DollarSign },
              { name: 'Reporte de Pacientes', description: 'Lista completa con historial', icon: Users },
              { name: 'Reporte de Citas', description: 'Estadisticas de agenda', icon: Calendar },
              { name: 'Reporte de Inventario', description: 'Stock y movimientos', icon: Package },
              { name: 'Reporte de Comisiones', description: 'Pagos a profesionales', icon: Percent },
              { name: 'Reporte de Tratamientos', description: 'Servicios mas solicitados', icon: Activity },
              { name: 'Reporte de Productividad', description: 'Metricas del equipo', icon: Target },
              { name: 'Reporte Fiscal', description: 'Para declaraciones', icon: FileText },
            ].map((report) => (
              <button
                key={report.name}
                onClick={() => handleGenerateReport(report.name)}
                disabled={exportingReport === report.name}
                className="flex flex-col items-start gap-2 p-4 rounded-lg border hover:bg-muted transition-colors text-left disabled:opacity-50 disabled:cursor-wait"
              >
                {exportingReport === report.name ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <report.icon className="h-5 w-5 text-primary" />
                )}
                <div>
                  <p className="font-medium text-sm">{report.name}</p>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
