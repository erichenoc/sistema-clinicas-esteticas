export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowLeft, Plus, Search, Building2, Phone, Mail, MapPin, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Mock data - TODO: Connect to database
const mockSuppliers = [
  {
    id: '1',
    name: 'Distribuidora Medica RD',
    contact: 'Carlos Martinez',
    email: 'ventas@distribuidoramedica.com',
    phone: '809-555-1234',
    address: 'Av. Winston Churchill #45, Santo Domingo',
    status: 'active',
    category: 'Equipos Medicos',
    totalOrders: 24,
    totalSpent: 450000,
  },
  {
    id: '2',
    name: 'Cosmeticos Premium',
    contact: 'Ana Rodriguez',
    email: 'pedidos@cosmeticospremium.com',
    phone: '809-555-5678',
    address: 'Calle El Conde #123, Zona Colonial',
    status: 'active',
    category: 'Cosmeticos',
    totalOrders: 18,
    totalSpent: 285000,
  },
  {
    id: '3',
    name: 'Equipos Esteticos SA',
    contact: 'Pedro Sanchez',
    email: 'info@equiposesteticos.com',
    phone: '809-555-9012',
    address: 'Av. 27 de Febrero #890, Santiago',
    status: 'active',
    category: 'Equipos',
    totalOrders: 8,
    totalSpent: 890000,
  },
  {
    id: '4',
    name: 'Suministros Clinicos',
    contact: 'Laura Gomez',
    email: 'ventas@suministrosclinicos.com',
    phone: '809-555-3456',
    address: 'Calle Duarte #567, La Vega',
    status: 'inactive',
    category: 'Suministros',
    totalOrders: 5,
    totalSpent: 75000,
  },
]

export default function ProveedoresPage() {
  const stats = {
    total: mockSuppliers.length,
    active: mockSuppliers.filter(s => s.status === 'active').length,
    totalSpent: mockSuppliers.reduce((acc, s) => acc + s.totalSpent, 0),
    totalOrders: mockSuppliers.reduce((acc, s) => acc + s.totalOrders, 0),
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
            <h1 className="text-2xl font-bold">Proveedores</h1>
            <p className="text-muted-foreground">Gestiona tus proveedores y contactos</p>
          </div>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">proveedores</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ordenes</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">realizadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Compras</CardTitle>
            <Building2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD${(stats.totalSpent / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">invertido</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar proveedor..." className="pl-10" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Suppliers Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {mockSuppliers.map((supplier) => (
          <Card key={supplier.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    <CardDescription>{supplier.category}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                    {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Nueva orden</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Desactivar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Contacto: <span className="text-foreground">{supplier.contact}</span>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {supplier.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {supplier.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {supplier.address}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Ordenes:</span>{' '}
                  <span className="font-medium">{supplier.totalOrders}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Total:</span>{' '}
                  <span className="font-medium">RD${supplier.totalSpent.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
