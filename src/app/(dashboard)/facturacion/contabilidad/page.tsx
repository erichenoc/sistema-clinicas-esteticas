'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Settings,
  FileText,
  Calculator,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  NCF_TYPE_OPTIONS,
  PAYMENT_TYPE_606_OPTIONS,
  type NCFType,
  type NCFSequence,
  type DGIIReport,
  getPeriodLabel,
  formatRNC,
} from '@/types/accounting'
import { formatCurrency } from '@/types/billing'

// Mock data
const mockNCFSequences: NCFSequence[] = [
  {
    id: '1',
    clinicId: 'clinic-1',
    ncfType: 'B01',
    prefix: 'E31',
    currentNumber: 156,
    startNumber: 1,
    endNumber: 500,
    expirationDate: '2025-12-31',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-12-06',
  },
  {
    id: '2',
    clinicId: 'clinic-1',
    ncfType: 'B02',
    prefix: 'E32',
    currentNumber: 1892,
    startNumber: 1,
    endNumber: 5000,
    expirationDate: '2025-12-31',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-12-06',
  },
  {
    id: '3',
    clinicId: 'clinic-1',
    ncfType: 'B04',
    prefix: 'E34',
    currentNumber: 23,
    startNumber: 1,
    endNumber: 100,
    expirationDate: '2025-12-31',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-12-06',
  },
]

const mockReports: DGIIReport[] = [
  {
    id: '1',
    clinicId: 'clinic-1',
    period: '202412',
    reportType: '607',
    status: 'draft',
    totalRecords: 145,
    totalAmount: 2850000,
    totalTax: 513000,
    createdAt: '2024-12-01',
    updatedAt: '2024-12-06',
  },
  {
    id: '2',
    clinicId: 'clinic-1',
    period: '202412',
    reportType: '606',
    status: 'draft',
    totalRecords: 28,
    totalAmount: 485000,
    totalTax: 87300,
    createdAt: '2024-12-01',
    updatedAt: '2024-12-06',
  },
  {
    id: '3',
    clinicId: 'clinic-1',
    period: '202411',
    reportType: '607',
    status: 'submitted',
    totalRecords: 132,
    totalAmount: 2650000,
    totalTax: 477000,
    submittedAt: '2024-12-05',
    dgiiReference: 'DGII-2024-607-001234',
    createdAt: '2024-11-01',
    updatedAt: '2024-12-05',
  },
  {
    id: '4',
    clinicId: 'clinic-1',
    period: '202411',
    reportType: '606',
    status: 'submitted',
    totalRecords: 25,
    totalAmount: 420000,
    totalTax: 75600,
    submittedAt: '2024-12-05',
    dgiiReference: 'DGII-2024-606-001234',
    createdAt: '2024-11-01',
    updatedAt: '2024-12-05',
  },
]

const mockITBISSummary = {
  period: '202412',
  salesB01Total: 850000,
  salesB02Total: 2000000,
  salesTaxableAmount: 2850000,
  salesItbisCollected: 513000,
  purchasesTotal: 485000,
  purchasesItbisPaid: 87300,
  itbisToPayOrCredit: 425700,
}

export default function ContabilidadPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('202412')
  const [isGenerating, setIsGenerating] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Borrador</Badge>
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-600"><AlertCircle className="mr-1 h-3 w-3" />Pendiente</Badge>
      case 'submitted':
        return <Badge variant="default" className="bg-blue-500"><RefreshCw className="mr-1 h-3 w-3" />Enviado</Badge>
      case 'accepted':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" />Aceptado</Badge>
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Rechazado</Badge>
      default:
        return null
    }
  }

  const getNCFTypeLabel = (type: NCFType) => {
    return NCF_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type
  }

  const getSequenceUsagePercent = (seq: NCFSequence) => {
    const used = seq.currentNumber - seq.startNumber
    const total = seq.endNumber - seq.startNumber
    return Math.round((used / total) * 100)
  }

  const handleGenerateReport = async (reportType: '606' | '607') => {
    setIsGenerating(true)
    // Simular generacion
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(false)
    toast.success(`Reporte ${reportType} generado exitosamente`)
  }

  const handleDownloadReport = (report: DGIIReport) => {
    toast.success(`Descargando reporte ${report.reportType} - ${getPeriodLabel(report.period)}`)
  }

  // Generate period options (last 12 months)
  const periodOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const period = `${year}${month.toString().padStart(2, '0')}`
    return { value: period, label: getPeriodLabel(period) }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/facturacion">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Contabilidad DGII</h1>
            <p className="text-muted-foreground">
              Gestion de comprobantes fiscales y reportes para la DGII
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ITBIS Cobrado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockITBISSummary.salesItbisCollected)}</div>
            <p className="text-xs text-muted-foreground">En ventas del periodo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ITBIS Pagado</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockITBISSummary.purchasesItbisPaid)}</div>
            <p className="text-xs text-muted-foreground">En compras del periodo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ITBIS a Pagar</CardTitle>
            <Calculator className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(mockITBISSummary.itbisToPayOrCredit)}
            </div>
            <p className="text-xs text-muted-foreground">Balance del periodo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comprobantes Emitidos</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockReports.find(r => r.period === selectedPeriod && r.reportType === '607')?.totalRecords || 0}
            </div>
            <p className="text-xs text-muted-foreground">Facturas del periodo</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reportes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reportes">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Reportes DGII
          </TabsTrigger>
          <TabsTrigger value="secuencias">
            <Settings className="mr-2 h-4 w-4" />
            Secuencias NCF
          </TabsTrigger>
          <TabsTrigger value="resumen">
            <BarChart3 className="mr-2 h-4 w-4" />
            Resumen Fiscal
          </TabsTrigger>
        </TabsList>

        {/* Tab: Reportes DGII */}
        <TabsContent value="reportes" className="space-y-4">
          {/* Generate Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Generar Reportes</CardTitle>
              <CardDescription>
                Genera los formatos 606 y 607 para enviar a la DGII
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Formato 607 - Ventas</CardTitle>
                    <CardDescription>
                      Reporte de ventas de bienes y servicios con comprobantes fiscales
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Periodo:</span>
                      <span className="font-medium">{getPeriodLabel(selectedPeriod)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Registros estimados:</span>
                      <span className="font-medium">~145</span>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleGenerateReport('607')}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                      )}
                      Generar 607
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Formato 606 - Compras</CardTitle>
                    <CardDescription>
                      Reporte de compras y gastos con comprobantes fiscales
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Periodo:</span>
                      <span className="font-medium">{getPeriodLabel(selectedPeriod)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Registros estimados:</span>
                      <span className="font-medium">~28</span>
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleGenerateReport('606')}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                      )}
                      Generar 606
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Report History */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Reportes</CardTitle>
              <CardDescription>
                Reportes generados y enviados a la DGII
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>ITBIS</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {getPeriodLabel(report.period)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {report.reportType === '606' ? 'Compras' : 'Ventas'}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.totalRecords}</TableCell>
                      <TableCell>{formatCurrency(report.totalAmount)}</TableCell>
                      <TableCell>{formatCurrency(report.totalTax)}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReport(report)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Secuencias NCF */}
        <TabsContent value="secuencias" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Secuencias de Comprobantes Fiscales</CardTitle>
                <CardDescription>
                  Administra las secuencias de NCF autorizadas por la DGII
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Secuencia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Secuencia NCF</DialogTitle>
                    <DialogDescription>
                      Registra una nueva secuencia de comprobantes autorizada por la DGII
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de Comprobante</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {NCF_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Numero Inicial</Label>
                        <Input type="number" placeholder="1" />
                      </div>
                      <div className="space-y-2">
                        <Label>Numero Final</Label>
                        <Input type="number" placeholder="500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Vencimiento</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancelar</Button>
                    <Button onClick={() => toast.success('Secuencia registrada')}>
                      Guardar Secuencia
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockNCFSequences.map((seq) => {
                  const usagePercent = getSequenceUsagePercent(seq)
                  const isLowStock = usagePercent > 80
                  const isExpiringSoon = new Date(seq.expirationDate) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days

                  return (
                    <Card key={seq.id} className={isLowStock || isExpiringSoon ? 'border-amber-200 bg-amber-50/50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{getNCFTypeLabel(seq.ncfType)}</h3>
                            <p className="text-sm text-muted-foreground">
                              Prefijo: {seq.prefix}
                            </p>
                          </div>
                          <Badge variant={seq.isActive ? 'default' : 'secondary'}>
                            {seq.isActive ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Uso: {seq.currentNumber - seq.startNumber} de {seq.endNumber - seq.startNumber}</span>
                            <span className={usagePercent > 80 ? 'text-amber-600 font-medium' : ''}>
                              {usagePercent}%
                            </span>
                          </div>
                          <Progress value={usagePercent} className={usagePercent > 80 ? '[&>div]:bg-amber-500' : ''} />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Actual: {seq.prefix}{seq.currentNumber.toString().padStart(8, '0')}</span>
                            <span className={isExpiringSoon ? 'text-amber-600' : ''}>
                              Vence: {new Date(seq.expirationDate).toLocaleDateString('es-DO')}
                            </span>
                          </div>
                        </div>
                        {(isLowStock || isExpiringSoon) && (
                          <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {isLowStock ? 'Stock bajo - Solicitar mas comprobantes' :
                             'Proxima a vencer - Renovar secuencia'}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Resumen Fiscal */}
        <TabsContent value="resumen" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Ventas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Ventas del Periodo
                </CardTitle>
                <CardDescription>{getPeriodLabel(selectedPeriod)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Facturas B01 (Credito Fiscal)</span>
                    <span className="font-medium">{formatCurrency(mockITBISSummary.salesB01Total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Facturas B02 (Consumo)</span>
                    <span className="font-medium">{formatCurrency(mockITBISSummary.salesB02Total)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Total Gravado</span>
                    <span className="font-bold">{formatCurrency(mockITBISSummary.salesTaxableAmount)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span className="font-medium">ITBIS Cobrado (18%)</span>
                    <span className="font-bold">{formatCurrency(mockITBISSummary.salesItbisCollected)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Compras del Periodo
                </CardTitle>
                <CardDescription>{getPeriodLabel(selectedPeriod)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Compras</span>
                    <span className="font-medium">{formatCurrency(mockITBISSummary.purchasesTotal)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-red-600">
                    <span className="font-medium">ITBIS Pagado (18%)</span>
                    <span className="font-bold">{formatCurrency(mockITBISSummary.purchasesItbisPaid)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Balance ITBIS */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Balance de ITBIS - {getPeriodLabel(selectedPeriod)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-white/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">ITBIS Cobrado</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(mockITBISSummary.salesItbisCollected)}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">ITBIS Pagado (Credito)</p>
                  <p className="text-2xl font-bold text-red-600">
                    -{formatCurrency(mockITBISSummary.purchasesItbisPaid)}
                  </p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                  <p className="text-sm font-medium">ITBIS a Pagar</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(mockITBISSummary.itbisToPayOrCredit)}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Resumen para IT-1
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
