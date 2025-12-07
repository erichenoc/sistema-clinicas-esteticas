'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Search,
  Package,
  AlertTriangle,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Label } from '@/components/ui/label'

// Mock data
const mockLotes = [
  {
    id: '1',
    lotNumber: 'LOT-2024-001',
    productId: '1',
    productName: 'Botox 100U',
    productBrand: 'Allergan',
    quantity: 10,
    usedQuantity: 5,
    costPerUnit: 3500,
    expirationDate: '2025-06-15',
    receivedDate: '2024-01-10',
    supplier: 'Distribuidora Médica SA',
    status: 'active',
  },
  {
    id: '2',
    lotNumber: 'LOT-2024-002',
    productId: '1',
    productName: 'Botox 100U',
    productBrand: 'Allergan',
    quantity: 5,
    usedQuantity: 0,
    costPerUnit: 3500,
    expirationDate: '2025-08-20',
    receivedDate: '2024-02-15',
    supplier: 'Distribuidora Médica SA',
    status: 'active',
  },
  {
    id: '3',
    lotNumber: 'LOT-2024-003',
    productId: '2',
    productName: 'Ácido Hialurónico 1ml',
    productBrand: 'Juvederm',
    quantity: 8,
    usedQuantity: 2,
    costPerUnit: 2800,
    expirationDate: '2024-03-01',
    receivedDate: '2023-06-01',
    supplier: 'MedSupply Internacional',
    status: 'expiring_soon',
  },
  {
    id: '4',
    lotNumber: 'LOT-2023-015',
    productId: '3',
    productName: 'Crema Hidratante',
    productBrand: 'SkinMed',
    quantity: 20,
    usedQuantity: 20,
    costPerUnit: 450,
    expirationDate: '2024-01-15',
    receivedDate: '2023-01-15',
    supplier: 'Cosméticos Premium',
    status: 'depleted',
  },
]

export default function LotesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isNewLotDialogOpen, setIsNewLotDialogOpen] = useState(false)

  const filteredLotes = mockLotes.filter((lote) => {
    const matchesSearch =
      lote.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lote.productName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lote.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>
      case 'expiring_soon':
        return <Badge className="bg-yellow-500">Por vencer</Badge>
      case 'expired':
        return <Badge className="bg-red-500">Vencido</Badge>
      case 'depleted':
        return <Badge variant="secondary">Agotado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date()
    const expDate = new Date(expirationDate)
    const diffTime = expDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Stats
  const activeLotes = mockLotes.filter((l) => l.status === 'active').length
  const expiringLotes = mockLotes.filter((l) => l.status === 'expiring_soon').length
  const totalValue = mockLotes.reduce(
    (acc, l) => acc + (l.quantity - l.usedQuantity) * l.costPerUnit,
    0
  )

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
            <h1 className="text-2xl font-bold tracking-tight">Gestión de Lotes</h1>
            <p className="text-muted-foreground">
              Control de lotes, vencimientos y trazabilidad
            </p>
          </div>
        </div>
        <Dialog open={isNewLotDialogOpen} onOpenChange={setIsNewLotDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Lote
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Lote</DialogTitle>
              <DialogDescription>
                Ingresa la información del nuevo lote de productos
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="product">Producto</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Botox 100U - Allergan</SelectItem>
                    <SelectItem value="2">Ácido Hialurónico 1ml - Juvederm</SelectItem>
                    <SelectItem value="3">Crema Hidratante - SkinMed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="lotNumber">Número de Lote</Label>
                  <Input id="lotNumber" placeholder="LOT-2024-XXX" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input id="quantity" type="number" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expirationDate">Fecha de Vencimiento</Label>
                  <Input id="expirationDate" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="costPerUnit">Costo por Unidad</Label>
                  <Input id="costPerUnit" type="number" placeholder="0.00" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier">Proveedor</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Distribuidora Médica SA</SelectItem>
                    <SelectItem value="2">MedSupply Internacional</SelectItem>
                    <SelectItem value="3">Cosméticos Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewLotDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsNewLotDialogOpen(false)}>
                Guardar Lote
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Lotes Activos
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeLotes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Con stock disponible</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Por Vencer
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{expiringLotes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Próximos 30 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Valor en Lotes
            </CardDescription>
            <CardTitle className="text-3xl">{formatPrice(totalValue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Stock disponible</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de lote o producto..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="expiring_soon">Por vencer</SelectItem>
            <SelectItem value="expired">Vencidos</SelectItem>
            <SelectItem value="depleted">Agotados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Costo Unit.</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLotes.map((lote) => {
                const daysUntilExp = getDaysUntilExpiration(lote.expirationDate)
                const remaining = lote.quantity - lote.usedQuantity
                return (
                  <TableRow key={lote.id}>
                    <TableCell className="font-mono font-medium">
                      {lote.lotNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lote.productName}</p>
                        <p className="text-sm text-muted-foreground">{lote.productBrand}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{remaining}</span>
                        <span className="text-muted-foreground">/ {lote.quantity}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(lote.costPerUnit)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{formatDate(lote.expirationDate)}</span>
                        {daysUntilExp <= 30 && daysUntilExp > 0 && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            {daysUntilExp}d
                          </Badge>
                        )}
                        {daysUntilExp <= 0 && (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            Vencido
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{lote.supplier}</TableCell>
                    <TableCell>{getStatusBadge(lote.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
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
    </div>
  )
}
