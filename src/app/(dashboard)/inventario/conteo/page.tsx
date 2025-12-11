export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowLeft, Plus, Search, ClipboardList, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Mock data - TODO: Connect to database
const mockCounts = [
  {
    id: 'CI-001',
    name: 'Conteo Mensual Febrero',
    date: '2024-02-01',
    status: 'completed',
    totalItems: 150,
    discrepancies: 3,
    adjustedValue: 2500,
    createdBy: 'Maria Garcia',
  },
  {
    id: 'CI-002',
    name: 'Conteo Parcial - Cosmeticos',
    date: '2024-02-10',
    status: 'in_progress',
    totalItems: 45,
    discrepancies: 0,
    adjustedValue: 0,
    createdBy: 'Juan Perez',
  },
  {
    id: 'CI-003',
    name: 'Conteo Mensual Enero',
    date: '2024-01-01',
    status: 'completed',
    totalItems: 148,
    discrepancies: 5,
    adjustedValue: 4200,
    createdBy: 'Maria Garcia',
  },
]

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: ClipboardList },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

export default function ConteoInventarioPage() {
  const stats = {
    totalCounts: mockCounts.length,
    inProgress: mockCounts.filter(c => c.status === 'in_progress').length,
    totalDiscrepancies: mockCounts.reduce((acc, c) => acc + c.discrepancies, 0),
    totalAdjusted: mockCounts.reduce((acc, c) => acc + c.adjustedValue, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventario">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Conteo de Inventario</h1>
            <p className="text-muted-foreground">Realiza conteos fisicos y ajustes de inventario</p>
          </div>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Conteo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conteos</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCounts}</div>
            <p className="text-xs text-muted-foreground">realizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">conteos activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discrepancias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDiscrepancies}</div>
            <p className="text-xs text-muted-foreground">encontradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Ajustado</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD${stats.totalAdjusted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">en ajustes</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Conteos</CardTitle>
          <CardDescription>Todos los conteos de inventario realizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar conteo..." className="pl-10" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Discrepancias</TableHead>
                <TableHead>Valor Ajustado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado por</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCounts.map((count) => {
                const status = statusConfig[count.status as keyof typeof statusConfig]
                const StatusIcon = status.icon
                return (
                  <TableRow key={count.id}>
                    <TableCell className="font-medium">{count.id}</TableCell>
                    <TableCell>{count.name}</TableCell>
                    <TableCell>{new Date(count.date).toLocaleDateString('es-DO')}</TableCell>
                    <TableCell>{count.totalItems}</TableCell>
                    <TableCell>
                      {count.discrepancies > 0 ? (
                        <span className="text-yellow-600 font-medium">{count.discrepancies}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </TableCell>
                    <TableCell>RD${count.adjustedValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{count.createdBy}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        {count.status === 'in_progress' ? 'Continuar' : 'Ver'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
