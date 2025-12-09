'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
  Loader2,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  createProductLot,
  deleteLot,
  type LotListItemData,
  type LotStats,
  type ProductForLot,
  type SupplierForLot,
} from '@/actions/inventory'

const lotFormSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto'),
  lotNumber: z.string().min(1, 'El número de lote es requerido'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  expirationDate: z.string().optional(),
  costPerUnit: z.number().min(0, 'El costo no puede ser negativo'),
  supplierId: z.string().optional(),
})

type LotFormValues = z.infer<typeof lotFormSchema>

interface LotesClientProps {
  lotes: LotListItemData[]
  stats: LotStats
  products: ProductForLot[]
  suppliers: SupplierForLot[]
}

export function LotesClient({ lotes: initialLotes, stats, products, suppliers }: LotesClientProps) {
  const [lotes, setLotes] = useState(initialLotes)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isNewLotDialogOpen, setIsNewLotDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      productId: '',
      lotNumber: '',
      quantity: 1,
      expirationDate: '',
      costPerUnit: 0,
      supplierId: '',
    },
  })

  const filteredLotes = lotes.filter((lote) => {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
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

  const getDaysUntilExpiration = (expirationDate: string | null) => {
    if (!expirationDate) return null
    const today = new Date()
    const expDate = new Date(expirationDate)
    const diffTime = expDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteLot(id)
      if (result.success) {
        setLotes(lotes.filter((l) => l.id !== id))
        toast.success('Lote eliminado')
      } else {
        toast.error(result.error || 'Error al eliminar')
      }
    })
  }

  async function onSubmit(data: LotFormValues) {
    startTransition(async () => {
      const result = await createProductLot({
        product_id: data.productId,
        lot_number: data.lotNumber,
        initial_quantity: data.quantity,
        expiry_date: data.expirationDate || undefined,
        unit_cost: data.costPerUnit,
        supplier_id: data.supplierId || undefined,
      })

      if (result.data) {
        const product = products.find((p) => p.id === data.productId)
        const supplier = suppliers.find((s) => s.id === data.supplierId)

        const newLot: LotListItemData = {
          id: result.data.id,
          lotNumber: data.lotNumber,
          productId: data.productId,
          productName: product?.name || 'Producto',
          productBrand: product?.brand || null,
          quantity: data.quantity,
          usedQuantity: 0,
          costPerUnit: data.costPerUnit,
          expirationDate: data.expirationDate || null,
          receivedDate: new Date().toISOString().split('T')[0],
          supplier: supplier?.name || null,
          status: 'active',
        }

        setLotes([...lotes, newLot])
        toast.success('Lote registrado')
        setIsNewLotDialogOpen(false)
        form.reset()
      } else {
        toast.error(result.error || 'Error al crear el lote')
      }
    })
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Producto *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar producto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} {product.brand ? `- ${product.brand}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lotNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Lote *</FormLabel>
                        <FormControl>
                          <Input placeholder="LOT-2024-XXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expirationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Vencimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="costPerUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo por Unidad</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar proveedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsNewLotDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Lote
                  </Button>
                </DialogFooter>
              </form>
            </Form>
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
            <CardTitle className="text-3xl text-green-600">{stats.activeLotes}</CardTitle>
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
            <CardTitle className="text-3xl text-yellow-600">{stats.expiringLotes}</CardTitle>
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
            <CardTitle className="text-3xl">{formatPrice(stats.totalValue)}</CardTitle>
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
                        {lote.productBrand && (
                          <p className="text-sm text-muted-foreground">{lote.productBrand}</p>
                        )}
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
                        {daysUntilExp !== null && daysUntilExp <= 30 && daysUntilExp > 0 && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            {daysUntilExp}d
                          </Badge>
                        )}
                        {daysUntilExp !== null && daysUntilExp <= 0 && (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            Vencido
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{lote.supplier || 'N/A'}</TableCell>
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar lote?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción marcará el lote como agotado. El historial se mantendrá para trazabilidad.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(lote.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredLotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No se encontraron lotes</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
