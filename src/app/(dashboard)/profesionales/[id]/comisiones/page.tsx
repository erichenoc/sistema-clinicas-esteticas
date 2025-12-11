'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Check,
  Clock,
  Loader2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  getProfessionalById,
  getCommissions,
  type CommissionData,
} from '@/actions/professionals'

export default function ComisionesProfesionalPage() {
  const params = useParams()
  const professionalId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [professionalName, setProfessionalName] = useState('')
  const [commissions, setCommissions] = useState<CommissionData[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [professional, commissionsData] = await Promise.all([
          getProfessionalById(professionalId),
          getCommissions({ professionalId }),
        ])

        if (professional) {
          setProfessionalName(professional.full_name)
        }

        setCommissions(commissionsData)

        // Calculate stats
        const totalAmount = commissionsData.reduce(
          (sum, c) => sum + (c.commission_amount || 0),
          0
        )
        const pendingAmount = commissionsData
          .filter((c) => c.status === 'pending')
          .reduce((sum, c) => sum + (c.commission_amount || 0), 0)
        const approvedAmount = commissionsData
          .filter((c) => c.status === 'approved')
          .reduce((sum, c) => sum + (c.commission_amount || 0), 0)
        const paidAmount = commissionsData
          .filter((c) => c.status === 'paid')
          .reduce((sum, c) => sum + (c.commission_amount || 0), 0)

        setStats({
          total: totalAmount,
          pending: pendingAmount,
          approved: approvedAmount,
          paid: paidAmount,
        })
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [professionalId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Check className="h-3 w-3 mr-1" />
            Aprobada
          </Badge>
        )
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-600">
            <DollarSign className="h-3 w-3 mr-1" />
            Pagada
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/profesionales/${professionalId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comisiones</h1>
          <p className="text-muted-foreground">
            Historial de comisiones para {professionalName}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">RD${stats.total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendiente</p>
                <p className="text-xl font-bold">RD${stats.pending.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Check className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aprobada</p>
                <p className="text-xl font-bold">RD${stats.approved.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagada</p>
                <p className="text-xl font-bold">RD${stats.paid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de Comisiones
          </CardTitle>
          <CardDescription>
            Lista de todas las comisiones generadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin comisiones</h3>
              <p className="text-muted-foreground">
                Este profesional aun no tiene comisiones registradas
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Tasa</TableHead>
                  <TableHead>Comision</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(commission.created_at).toLocaleDateString('es-DO')}
                      </div>
                    </TableCell>
                    <TableCell>{commission.reference_description}</TableCell>
                    <TableCell>RD${commission.base_amount?.toLocaleString()}</TableCell>
                    <TableCell>{commission.commission_rate}%</TableCell>
                    <TableCell className="font-medium">
                      RD${commission.commission_amount?.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(commission.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
