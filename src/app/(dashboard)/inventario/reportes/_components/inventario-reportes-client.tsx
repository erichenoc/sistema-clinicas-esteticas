'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  DollarSign,
  Download,
  FileText,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  Loader2,
  ShoppingCart,
  Truck,
  ClipboardList,
  Calendar,
  Box,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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

import type { InventoryReportData, ReportPeriod } from '@/types/inventory-reports'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateString: string): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const periodLabels: Record<ReportPeriod, string> = {
  week: 'Esta Semana',
  month: 'Este Mes',
  quarter: 'Este Trimestre',
  year: 'Este Ano',
}

export function InventarioReportesClient({
  stock,
  movements,
  expirations,
  purchases,
  counts,
}: InventoryReportData) {
  const [period, setPeriod] = useState<ReportPeriod>('month')
  const [activeTab, setActiveTab] = useState('stock')
  const [isExporting, setIsExporting] = useState(false)
  const [exportingReport, setExportingReport] = useState<string | null>(null)

  const handleExportPDF = () => {
    window.print()
    toast.success('Preparando PDF para imprimir')
  }

  const handleExportCSV = () => {
    setIsExporting(true)
    let headers = ''
    let rows = ''
    let filename = ''

    switch (activeTab) {
      case 'stock':
        headers = 'Producto,SKU,Stock Actual,Unidad,Costo Unitario,Valor Total,Estado\n'
        rows = stock.topProductsByValue
          .map(
            (p) =>
              `"${p.name}","${p.sku || ''}",${p.currentStock},"${p.unit}",${p.unitCost},${p.totalValue},"${p.stockStatus}"`
          )
          .join('\n')
        filename = `reporte-stock-${period}`
        break

      case 'movimientos':
        headers = 'Fecha,Producto,SKU,Tipo,Cantidad,Costo Total,Usuario\n'
        rows = movements.recentMovements
          .map(
            (m) =>
              `"${formatDateTime(m.createdAt)}","${m.productName}","${m.productSku || ''}","${m.typeLabel}",${m.quantity},${m.totalCost},"${m.createdByName}"`
          )
          .join('\n')
        filename = `reporte-movimientos-${period}`
        break

      case 'vencimientos':
        headers = 'Producto,Lote,Cantidad,Costo Unitario,Valor Total,Fecha Vencimiento,Dias Restantes\n'
        rows = expirations.expiringProducts
          .map(
            (e) =>
              `"${e.productName}","${e.lotNumber}",${e.currentQuantity},${e.unitCost},${e.totalValue},"${formatDate(e.expiryDate)}",${e.daysUntilExpiry}`
          )
          .join('\n')
        filename = `reporte-vencimientos-${period}`
        break

      case 'compras':
        headers = 'Proveedor,Ordenes,Total Gastado,Ultima Orden,Promedio por Orden\n'
        rows = purchases.topSuppliers
          .map(
            (s) =>
              `"${s.name}",${s.ordersCount},${s.totalSpent},"${formatDate(s.lastOrderDate || '')}",${s.avgOrderValue}`
          )
          .join('\n')
        filename = `reporte-compras-${period}`
        break

      case 'conteos':
        headers = 'Numero,Tipo,Estado,Fecha Inicio,Fecha Fin,Items Contados,Discrepancias,Valor Diferencia\n'
        rows = counts.recentCounts
          .map(
            (c) =>
              `"${c.countNumber}","${c.countTypeLabel}","${c.statusLabel}","${formatDateTime(c.startedAt)}","${c.completedAt ? formatDateTime(c.completedAt) : '-'}",${c.itemsCounted},${c.itemsWithDifference},${c.totalDifferenceValue}`
          )
          .join('\n')
        filename = `reporte-conteos-${period}`
        break
    }

    const csvContent = headers + rows
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setIsExporting(false)
    toast.success('Reporte exportado exitosamente')
  }

  const handleGenerateReport = async (reportType: string) => {
    setExportingReport(reportType)

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 1000))

    let content = ''
    const now = new Date().toLocaleDateString('es-DO')

    switch (reportType) {
      case 'stock':
        content = `REPORTE DE STOCK ACTUAL\nFecha: ${now}\n\n`
        content += `Total Productos: ${stock.totalProducts}\n`
        content += `Valor Total: ${formatCurrency(stock.totalValue)}\n`
        content += `Stock Bajo: ${stock.lowStockCount}\n`
        content += `Sin Stock: ${stock.outOfStockCount}\n`
        break
      case 'movimientos':
        content = `REPORTE DE MOVIMIENTOS\nFecha: ${now}\n\n`
        content += `Total Movimientos: ${movements.totalMovements}\n`
        content += `Valor Entradas: ${formatCurrency(movements.totalEntriesValue)}\n`
        content += `Valor Salidas: ${formatCurrency(movements.totalExitsValue)}\n`
        content += `Balance Neto: ${formatCurrency(movements.netMovement)}\n`
        break
      case 'vencimientos':
        content = `REPORTE DE VENCIMIENTOS\nFecha: ${now}\n\n`
        content += `Lotes Activos: ${expirations.totalActiveLots}\n`
        content += `Vencen en 7 dias: ${expirations.expiringIn7Days}\n`
        content += `Vencen en 30 dias: ${expirations.expiringIn30Days}\n`
        content += `Valor en Riesgo: ${formatCurrency(expirations.valueAtRisk)}\n`
        break
      case 'compras':
        content = `REPORTE DE COMPRAS\nFecha: ${now}\n\n`
        content += `Total Ordenes: ${purchases.totalOrders}\n`
        content += `Total Gastado: ${formatCurrency(purchases.totalSpent)}\n`
        content += `Ordenes Pendientes: ${purchases.pendingOrders}\n`
        content += `Ordenes Recibidas: ${purchases.receivedOrders}\n`
        break
      case 'conteos':
        content = `REPORTE DE CONTEOS\nFecha: ${now}\n\n`
        content += `Total Conteos: ${counts.totalCounts}\n`
        content += `Completados: ${counts.completedCounts}\n`
        content += `Discrepancias: ${counts.totalDiscrepancies}\n`
        content += `Valor Diferencia: ${formatCurrency(counts.totalDifferenceValue)}\n`
        break
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte-${reportType}-${now.replace(/\//g, '-')}.txt`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setExportingReport(null)
    toast.success('Reporte generado exitosamente')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventario">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Reportes de Inventario</h1>
            <p className="text-muted-foreground">
              Analisis detallado del inventario y operaciones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stock" className="gap-2">
            <Package className="h-4 w-4 hidden sm:inline" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="movimientos" className="gap-2">
            <RefreshCw className="h-4 w-4 hidden sm:inline" />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="vencimientos" className="gap-2">
            <Clock className="h-4 w-4 hidden sm:inline" />
            Vencimientos
          </TabsTrigger>
          <TabsTrigger value="compras" className="gap-2">
            <ShoppingCart className="h-4 w-4 hidden sm:inline" />
            Compras
          </TabsTrigger>
          <TabsTrigger value="conteos" className="gap-2">
            <ClipboardList className="h-4 w-4 hidden sm:inline" />
            Conteos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Stock */}
        <TabsContent value="stock" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stock.totalProducts}</div>
                <p className="text-xs text-muted-foreground">productos en catalogo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valor del Inventario</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stock.totalValue)}</div>
                <p className="text-xs text-muted-foreground">a precio de costo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{stock.lowStockCount}</div>
                <p className="text-xs text-muted-foreground">productos por reabastecer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stock.outOfStockCount}</div>
                <p className="text-xs text-muted-foreground">productos agotados</p>
              </CardContent>
            </Card>
          </div>

          {/* Stock by Category */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribucion por Categoria</CardTitle>
                <CardDescription>Productos agrupados por categoria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stock.stockByCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                ) : (
                  stock.stockByCategory.map((cat) => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{cat.category}</span>
                        <span className="font-medium">
                          {cat.count} ({cat.percentage}%)
                        </span>
                      </div>
                      <Progress value={cat.percentage} className="h-2" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribucion por Tipo</CardTitle>
                <CardDescription>Productos por tipo de uso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stock.stockByType.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                ) : (
                  stock.stockByType.map((type) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-muted-foreground" />
                        <span>{type.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{type.count} productos</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(type.value)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Productos por Valor</CardTitle>
              <CardDescription>Los 10 productos con mayor valor en inventario</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Costo Unit.</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.topProductsByValue.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay productos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    stock.topProductsByValue.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku || '-'}</TableCell>
                        <TableCell className="text-right">
                          {product.currentStock} {product.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(product.unitCost)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(product.totalValue)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.stockStatus === 'out_of_stock'
                                ? 'destructive'
                                : product.stockStatus === 'low_stock'
                                  ? 'secondary'
                                  : 'default'
                            }
                          >
                            {product.stockStatus === 'out_of_stock'
                              ? 'Sin Stock'
                              : product.stockStatus === 'low_stock'
                                ? 'Stock Bajo'
                                : 'En Stock'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Movimientos */}
        <TabsContent value="movimientos" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{movements.totalMovements}</div>
                <p className="text-xs text-muted-foreground">{periodLabels[period]}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valor Entradas</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(movements.totalEntriesValue)}
                </div>
                <p className="text-xs text-muted-foreground">compras y ajustes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valor Salidas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(movements.totalExitsValue)}
                </div>
                <p className="text-xs text-muted-foreground">ventas y consumos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
                {movements.netMovement >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${movements.netMovement >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {formatCurrency(movements.netMovement)}
                </div>
                <p className="text-xs text-muted-foreground">entradas - salidas</p>
              </CardContent>
            </Card>
          </div>

          {/* Movements by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Movimientos por Tipo</CardTitle>
              <CardDescription>Distribucion de movimientos en el periodo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {movements.movementsByType.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay movimientos en el periodo</p>
              ) : (
                movements.movementsByType.map((m) => (
                  <div key={m.type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {m.direction === 'in' ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span>{m.label}</span>
                      </div>
                      <span className="font-medium">
                        {m.count} ({m.percentage}%) - {formatCurrency(m.value)}
                      </span>
                    </div>
                    <Progress value={m.percentage} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Movements Table */}
          <Card>
            <CardHeader>
              <CardTitle>Movimientos Recientes</CardTitle>
              <CardDescription>Ultimos 20 movimientos de inventario</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Costo Total</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.recentMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay movimientos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.recentMovements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{formatDateTime(m.createdAt)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{m.productName}</div>
                            <div className="text-sm text-muted-foreground">{m.productSku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{m.typeLabel}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{m.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.totalCost)}</TableCell>
                        <TableCell>{m.createdByName}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Vencimientos */}
        <TabsContent value="vencimientos" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Lotes Activos</CardTitle>
                <Box className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expirations.totalActiveLots}</div>
                <p className="text-xs text-muted-foreground">lotes en inventario</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Vencen en 7 Dias</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{expirations.expiringIn7Days}</div>
                <p className="text-xs text-muted-foreground">requieren atencion urgente</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Vencen en 30 Dias</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {expirations.expiringIn30Days}
                </div>
                <p className="text-xs text-muted-foreground">requieren planificacion</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valor en Riesgo</CardTitle>
                <DollarSign className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(expirations.valueAtRisk)}
                </div>
                <p className="text-xs text-muted-foreground">productos por vencer</p>
              </CardContent>
            </Card>
          </div>

          {/* Lots by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Lotes por Estado</CardTitle>
              <CardDescription>Distribucion de lotes segun su estado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {expirations.lotsByStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay lotes registrados</p>
              ) : (
                expirations.lotsByStatus.map((lot) => (
                  <div key={lot.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          lot.color === 'red'
                            ? 'destructive'
                            : lot.color === 'amber'
                              ? 'secondary'
                              : 'default'
                        }
                      >
                        {lot.label}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{lot.count} lotes</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(lot.value)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Expiring Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Productos por Vencer</CardTitle>
              <CardDescription>Lotes que vencen en los proximos 90 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Dias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expirations.expiringProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay productos por vencer
                      </TableCell>
                    </TableRow>
                  ) : (
                    expirations.expiringProducts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.productName}</TableCell>
                        <TableCell>{p.lotNumber}</TableCell>
                        <TableCell className="text-right">{p.currentQuantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.totalValue)}</TableCell>
                        <TableCell>{formatDate(p.expiryDate)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status === 'urgent'
                                ? 'destructive'
                                : p.status === 'warning'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {p.daysUntilExpiry < 0
                              ? 'Vencido'
                              : `${p.daysUntilExpiry} dias`}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Compras */}
        <TabsContent value="compras" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Ordenes</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchases.totalOrders}</div>
                <p className="text-xs text-muted-foreground">{periodLabels[period]}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(purchases.totalSpent)}</div>
                <p className="text-xs text-muted-foreground">en ordenes de compra</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ordenes Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{purchases.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">esperando recepcion</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ordenes Recibidas</CardTitle>
                <Truck className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{purchases.receivedOrders}</div>
                <p className="text-xs text-muted-foreground">completadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Orders by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Ordenes por Estado</CardTitle>
              <CardDescription>Distribucion de ordenes de compra</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {purchases.ordersByStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay ordenes en el periodo</p>
              ) : (
                purchases.ordersByStatus.map((o) => (
                  <div key={o.status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{o.label}</span>
                      <span className="font-medium">
                        {o.count} ordenes - {formatCurrency(o.value)}
                      </span>
                    </div>
                    <Progress
                      value={
                        purchases.totalOrders > 0
                          ? (o.count / purchases.totalOrders) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Top Suppliers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Proveedores</CardTitle>
              <CardDescription>Proveedores con mayor volumen de compras</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-right">Ordenes</TableHead>
                    <TableHead className="text-right">Total Gastado</TableHead>
                    <TableHead>Ultima Orden</TableHead>
                    <TableHead className="text-right">Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.topSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay proveedores registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases.topSuppliers.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-right">{s.ordersCount}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(s.totalSpent)}
                        </TableCell>
                        <TableCell>{formatDate(s.lastOrderDate || '')}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(s.avgOrderValue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Conteos */}
        <TabsContent value="conteos" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Conteos Realizados</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{counts.totalCounts}</div>
                <p className="text-xs text-muted-foreground">{periodLabels[period]}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completados</CardTitle>
                <Calendar className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{counts.completedCounts}</div>
                <p className="text-xs text-muted-foreground">conteos finalizados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Discrepancias</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{counts.totalDiscrepancies}</div>
                <p className="text-xs text-muted-foreground">items con diferencia</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valor Diferencia</CardTitle>
                <DollarSign className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${counts.totalDifferenceValue < 0 ? 'text-red-600' : 'text-muted-foreground'}`}
                >
                  {formatCurrency(Math.abs(counts.totalDifferenceValue))}
                </div>
                <p className="text-xs text-muted-foreground">impacto financiero</p>
              </CardContent>
            </Card>
          </div>

          {/* Counts by Type and Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conteos por Tipo</CardTitle>
                <CardDescription>Distribucion por tipo de conteo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {counts.countsByType.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay conteos registrados</p>
                ) : (
                  counts.countsByType.map((c) => (
                    <div key={c.type} className="flex items-center justify-between">
                      <span>{c.label}</span>
                      <Badge variant="outline">{c.count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conteos por Estado</CardTitle>
                <CardDescription>Distribucion por estado de conteo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {counts.countsByStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay conteos registrados</p>
                ) : (
                  counts.countsByStatus.map((c) => (
                    <div key={c.status} className="flex items-center justify-between">
                      <Badge
                        variant={
                          c.color === 'red'
                            ? 'destructive'
                            : c.color === 'emerald' || c.color === 'green'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {c.label}
                      </Badge>
                      <span className="font-medium">{c.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Counts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Conteos Recientes</CardTitle>
              <CardDescription>Ultimos conteos de inventario realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Discrepancias</TableHead>
                    <TableHead className="text-right">Valor Dif.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counts.recentCounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No hay conteos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    counts.recentCounts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.countNumber}</TableCell>
                        <TableCell>{c.countTypeLabel}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{c.statusLabel}</Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(c.startedAt)}</TableCell>
                        <TableCell className="text-right">{c.itemsCounted}</TableCell>
                        <TableCell className="text-right">
                          {c.itemsWithDifference > 0 ? (
                            <Badge variant="secondary">{c.itemsWithDifference}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {c.totalDifferenceValue !== 0
                            ? formatCurrency(c.totalDifferenceValue)
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Rapidos</CardTitle>
          <CardDescription>Genera reportes especificos para descargar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleGenerateReport('stock')}
              disabled={exportingReport === 'stock'}
            >
              {exportingReport === 'stock' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Reporte de Stock
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleGenerateReport('movimientos')}
              disabled={exportingReport === 'movimientos'}
            >
              {exportingReport === 'movimientos' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Reporte de Movimientos
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleGenerateReport('vencimientos')}
              disabled={exportingReport === 'vencimientos'}
            >
              {exportingReport === 'vencimientos' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Reporte de Vencimientos
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleGenerateReport('compras')}
              disabled={exportingReport === 'compras'}
            >
              {exportingReport === 'compras' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Reporte de Compras
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleGenerateReport('conteos')}
              disabled={exportingReport === 'conteos'}
            >
              {exportingReport === 'conteos' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Reporte de Conteos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
