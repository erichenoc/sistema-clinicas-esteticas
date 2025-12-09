'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Download, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PatientsHeaderProps {
  patients: Array<{
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    status: string
  }>
}

export function PatientsHeader({ patients }: PatientsHeaderProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    toast.loading('Exportando pacientes...', { id: 'export' })

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generate CSV content
    const headers = 'Nombre,Apellido,Email,Telefono,Estado\n'
    const rows = patients.map(p =>
      `${p.firstName},${p.lastName},${p.email || ''},${p.phone || ''},${p.status}`
    ).join('\n')
    const csvContent = headers + rows

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pacientes-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.dismiss('export')
    toast.success(`${patients.length} pacientes exportados`)
    setIsExporting(false)
  }

  const handleImport = () => {
    setIsImporting(true)

    // Create file input
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        toast.loading('Procesando archivo...', { id: 'import' })
        await new Promise(resolve => setTimeout(resolve, 1500))
        toast.dismiss('import')
        toast.success(`Archivo "${file.name}" procesado. Funcionalidad de importacion proximamente.`)
      }
      setIsImporting(false)
    }
    input.oncancel = () => setIsImporting(false)
    input.click()
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
        <p className="text-muted-foreground">
          Gestiona la informacion de tus pacientes
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleImport} disabled={isImporting}>
          {isImporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Importar
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar
        </Button>
        <Button asChild>
          <Link href="/pacientes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Paciente
          </Link>
        </Button>
      </div>
    </div>
  )
}
