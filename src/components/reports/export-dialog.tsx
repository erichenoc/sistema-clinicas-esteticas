'use client'

import { useState } from 'react'
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { exportReport, type ReportType } from '@/actions/export-reports'

interface ExportDialogProps {
  reportType: ReportType
  title?: string
  trigger?: React.ReactNode
}

export function ExportDialog({ reportType, title, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'custom'>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const reportTitles: Record<ReportType, string> = {
    financial: 'Reporte Financiero',
    patients: 'Reporte de Pacientes',
    appointments: 'Reporte de Citas',
    commissions: 'Reporte de Comisiones',
    inventory: 'Reporte de Inventario',
    professionals: 'Reporte de Profesionales',
  }

  const getDateRangeValues = () => {
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (dateRange) {
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        break
      case 'year':
        start = new Date(now.getFullYear(), 0, 1)
        break
      case 'custom':
        return {
          start: startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          end: endDate || now.toISOString(),
        }
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    toast.loading('Generando reporte...', { id: 'export' })

    try {
      const dates = getDateRangeValues()
      const result = await exportReport(reportType, {
        format,
        dateRange: dates,
      })

      // Crear y descargar el archivo
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportType}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.dismiss('export')
      toast.success('Reporte descargado exitosamente')
      setOpen(false)
    } catch (error) {
      toast.dismiss('export')
      toast.error('Error al generar el reporte')
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportar {title || reportTitles[reportType]}</DialogTitle>
          <DialogDescription>
            Selecciona el formato y rango de fechas para exportar
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Formato */}
          <div className="space-y-3">
            <Label>Formato</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as 'csv' | 'excel' | 'pdf')}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="csv"
                  id="csv"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="csv"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileSpreadsheet className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">CSV</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="excel"
                  id="excel"
                  className="peer sr-only"
                  disabled
                />
                <Label
                  htmlFor="excel"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 opacity-50 cursor-not-allowed"
                >
                  <FileSpreadsheet className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">Excel</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="pdf"
                  id="pdf"
                  className="peer sr-only"
                  disabled
                />
                <Label
                  htmlFor="pdf"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 opacity-50 cursor-not-allowed"
                >
                  <FileText className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">PDF</span>
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Excel y PDF estaran disponibles proximamente
            </p>
          </div>

          {/* Rango de Fechas */}
          <div className="space-y-3">
            <Label>Rango de Fechas</Label>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este Mes</SelectItem>
                <SelectItem value="quarter">Este Trimestre</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fechas personalizadas */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Desde</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="start-date"
                    type="date"
                    className="pl-10"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Hasta</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="end-date"
                    type="date"
                    className="pl-10"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
