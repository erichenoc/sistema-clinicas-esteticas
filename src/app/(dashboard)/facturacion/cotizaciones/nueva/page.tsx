'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Package,
  Stethoscope,
  Gift,
  FileText,
  Save,
  Send,
  Calculator,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

import { formatCurrency } from '@/types/billing'
import { getPatients, type PatientData } from '@/actions/patients'
import { getTreatments, getPackages, type TreatmentListItemData, type PackageData } from '@/actions/treatments'
import { getProducts, type ProductListItemData } from '@/actions/inventory'
import { createQuotation, sendQuotationEmail } from '@/actions/quotations'

// Tipos para datos UI
interface ClientData {
  id: string
  name: string
  email: string | null
  phone: string
  rncCedula?: string | null
}

interface TreatmentItem {
  id: string
  name: string
  price: number
  category: string | null
}

interface ProductItem {
  id: string
  name: string
  price: number
  stock: number
}

interface PackageItem {
  id: string
  name: string
  price: number
  sessions: number
}

type ItemType = 'treatment' | 'product' | 'package' | 'custom'

interface QuoteItem {
  id: string
  type: ItemType
  referenceId?: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'percentage' | 'fixed'
  notes?: string
}

export default function NuevaCotizacionPage() {
  const router = useRouter()
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
  const [clientSearchOpen, setClientSearchOpen] = useState(false)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [itemSearchOpen, setItemSearchOpen] = useState(false)
  const [currency, setCurrency] = useState<'DOP' | 'USD'>('DOP')
  const [applyTax, setApplyTax] = useState(true)
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('• Cotización válida por 30 días\n• Precios sujetos a cambio sin previo aviso\n• Se requiere 50% de anticipo para reservar cita')
  const [validDays, setValidDays] = useState(30)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados para datos cargados de la base de datos
  const [clients, setClients] = useState<ClientData[]>([])
  const [treatments, setTreatments] = useState<TreatmentItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cargar datos de la base de datos
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [patientsData, treatmentsData, packagesData, productsData] = await Promise.all([
          getPatients(),
          getTreatments({ isActive: true }),
          getPackages(),
          getProducts({ isActive: true }),
        ])

        // Transformar pacientes a clientes
        setClients(patientsData.map((p: PatientData) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email,
          phone: p.phone,
          rncCedula: p.document_number || null,
        })))

        // Transformar tratamientos
        setTreatments(treatmentsData.map((t: TreatmentListItemData) => ({
          id: t.id,
          name: t.name,
          price: t.price || 0,
          category: t.category_name || null,
        })))

        // Transformar productos
        setProducts(productsData.map((p: ProductListItemData) => ({
          id: p.id,
          name: p.name,
          price: p.sell_price || 0,
          stock: p.current_stock || 0,
        })))

        // Transformar paquetes
        setPackages(packagesData.map((pk: PackageData) => ({
          id: pk.id,
          name: pk.name,
          price: pk.salePrice || pk.regularPrice || 0,
          sessions: pk.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 1,
        })))
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Calcular totales
  const calculateItemSubtotal = (item: QuoteItem) => {
    const gross = item.quantity * item.unitPrice
    const discountAmount = item.discountType === 'percentage'
      ? gross * (item.discount / 100)
      : item.discount
    return gross - discountAmount
  }

  const subtotal = items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0)
  const discountTotal = items.reduce((sum, item) => {
    const gross = item.quantity * item.unitPrice
    return sum + (item.discountType === 'percentage'
      ? gross * (item.discount / 100)
      : item.discount)
  }, 0)
  const taxRate = applyTax ? 18 : 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  // Agregar item
  const addItem = (type: ItemType, data: { id: string; name: string; price: number }) => {
    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      type,
      referenceId: data.id,
      description: data.name,
      quantity: 1,
      unitPrice: data.price,
      discount: 0,
      discountType: 'percentage',
    }
    setItems([...items, newItem])
    setItemSearchOpen(false)
  }

  // Agregar item personalizado
  const addCustomItem = () => {
    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      type: 'custom',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percentage',
    }
    setItems([...items, newItem])
  }

  // Actualizar item
  const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // Eliminar item
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  // Guardar cotización
  const handleSave = async (sendToClient: boolean = false) => {
    if (!selectedClient) {
      toast.error('Selecciona un cliente')
      return
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un item')
      return
    }

    setIsSubmitting(true)
    toast.loading('Guardando cotización...', { id: 'save-quote' })

    try {
      // Preparar items para la base de datos
      const itemsForDB = items.map(item => ({
        type: item.type,
        reference_id: item.referenceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount,
        discount_type: item.discountType,
        subtotal: calculateItemSubtotal(item),
        notes: item.notes,
      }))

      // Crear cotización en la base de datos
      const result = await createQuotation({
        patient_id: selectedClient.id,
        currency,
        items: itemsForDB,
        valid_until: format(addDays(new Date(), validDays), 'yyyy-MM-dd'),
        notes,
        terms_conditions: terms,
        subtotal,
        discount_total: discountTotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        status: 'draft',
      })

      if (!result.success) {
        toast.dismiss('save-quote')
        toast.error(result.error || 'Error al guardar la cotización')
        setIsSubmitting(false)
        return
      }

      // Si se debe enviar por email
      if (sendToClient && result.data?.id) {
        toast.loading('Enviando cotización por email...', { id: 'save-quote' })

        const emailResult = await sendQuotationEmail(result.data.id)

        if (!emailResult.success) {
          toast.dismiss('save-quote')
          toast.warning(`Cotización guardada pero no se pudo enviar: ${emailResult.error}`)
          setIsSubmitting(false)
          router.push('/facturacion/cotizaciones')
          return
        }
      }

      toast.dismiss('save-quote')
      toast.success(sendToClient ? 'Cotización guardada y enviada al cliente' : 'Cotización guardada como borrador')
      router.push('/facturacion/cotizaciones')
    } catch (error) {
      console.error('Error saving quotation:', error)
      toast.dismiss('save-quote')
      toast.error('Error inesperado al guardar la cotización')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getItemTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'treatment': return <Stethoscope className="h-4 w-4" />
      case 'product': return <Package className="h-4 w-4" />
      case 'package': return <Gift className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getItemTypeBadge = (type: ItemType) => {
    const config = {
      treatment: { label: 'Tratamiento', variant: 'default' as const },
      product: { label: 'Producto', variant: 'secondary' as const },
      package: { label: 'Paquete', variant: 'outline' as const },
      custom: { label: 'Personalizado', variant: 'outline' as const },
    }
    return config[type]
  }

  return (
    <div className="space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Link href="/facturacion">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">Nueva Cotización</h1>
            <p className="text-muted-foreground text-sm">
              Crea una cotización para enviar a tu cliente
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            <span className="truncate">Guardar Borrador</span>
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            <span className="truncate">Guardar y Enviar</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selección de cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
              <CardDescription>Selecciona el cliente para esta cotización</CardDescription>
            </CardHeader>
            <CardContent>
              <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start"
                  >
                    {selectedClient ? (
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{selectedClient.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {selectedClient.email} • {selectedClient.phone}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        <Search className="mr-2 h-4 w-4 inline" />
                        Buscar cliente...
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar por nombre, email o teléfono..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron clientes</CommandEmpty>
                      <CommandGroup>
                        {isLoading ? (
                          <div className="py-6 text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mt-2">Cargando clientes...</p>
                          </div>
                        ) : clients.length === 0 ? (
                          <div className="py-6 text-center text-muted-foreground">
                            No hay clientes registrados
                          </div>
                        ) : (
                          clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              onSelect={() => {
                                setSelectedClient(client)
                                setClientSearchOpen(false)
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{client.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {client.email} • {client.phone}
                                  {client.rncCedula && ` • ${client.rncCedula}`}
                                </span>
                              </div>
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedClient && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2">{selectedClient.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span className="ml-2">{selectedClient.phone}</span>
                    </div>
                    {selectedClient.rncCedula && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">RNC/Cédula:</span>
                        <span className="ml-2">{selectedClient.rncCedula}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items de la cotización */}
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Items</CardTitle>
                  <CardDescription>Agrega los servicios y productos a cotizar</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Popover open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Item
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Buscar tratamiento, producto o paquete..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron resultados</CommandEmpty>
                          {isLoading ? (
                            <div className="py-6 text-center">
                              <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mt-2">Cargando items...</p>
                            </div>
                          ) : (
                            <>
                              <CommandGroup heading="Tratamientos">
                                {treatments.length === 0 ? (
                                  <div className="py-2 text-center text-sm text-muted-foreground">
                                    No hay tratamientos disponibles
                                  </div>
                                ) : (
                                  treatments.map((t) => (
                                    <CommandItem
                                      key={t.id}
                                      onSelect={() => addItem('treatment', { id: t.id, name: t.name, price: t.price })}
                                    >
                                      <Stethoscope className="mr-2 h-4 w-4 text-blue-500" />
                                      <div className="flex-1">
                                        <span>{t.name}</span>
                                        {t.category && (
                                          <span className="text-xs text-muted-foreground ml-2">({t.category})</span>
                                        )}
                                      </div>
                                      <span className="font-medium">{formatCurrency(t.price, currency)}</span>
                                    </CommandItem>
                                  ))
                                )}
                              </CommandGroup>
                              <CommandGroup heading="Productos">
                                {products.length === 0 ? (
                                  <div className="py-2 text-center text-sm text-muted-foreground">
                                    No hay productos disponibles
                                  </div>
                                ) : (
                                  products.map((p) => (
                                    <CommandItem
                                      key={p.id}
                                      onSelect={() => addItem('product', { id: p.id, name: p.name, price: p.price })}
                                    >
                                      <Package className="mr-2 h-4 w-4 text-green-500" />
                                      <div className="flex-1">
                                        <span>{p.name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">(Stock: {p.stock})</span>
                                      </div>
                                      <span className="font-medium">{formatCurrency(p.price, currency)}</span>
                                    </CommandItem>
                                  ))
                                )}
                              </CommandGroup>
                              <CommandGroup heading="Paquetes">
                                {packages.length === 0 ? (
                                  <div className="py-2 text-center text-sm text-muted-foreground">
                                    No hay paquetes disponibles
                                  </div>
                                ) : (
                                  packages.map((pk) => (
                                    <CommandItem
                                      key={pk.id}
                                      onSelect={() => addItem('package', { id: pk.id, name: pk.name, price: pk.price })}
                                    >
                                      <Gift className="mr-2 h-4 w-4 text-purple-500" />
                                      <div className="flex-1">
                                        <span>{pk.name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">({pk.sessions} sesiones)</span>
                                      </div>
                                      <span className="font-medium">{formatCurrency(pk.price, currency)}</span>
                                    </CommandItem>
                                  ))
                                )}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button variant="outline" onClick={addCustomItem} className="w-full sm:w-auto">
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="truncate">Item Personalizado</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No hay items agregados</p>
                  <p className="text-sm">Usa el botón &quot;Agregar Item&quot; para comenzar</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Descripción</TableHead>
                      <TableHead className="w-[80px]">Cant.</TableHead>
                      <TableHead className="w-[120px]">Precio Unit.</TableHead>
                      <TableHead className="w-[150px]">Descuento</TableHead>
                      <TableHead className="w-[120px] text-right">Subtotal</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const itemSubtotal = calculateItemSubtotal(item)
                      const badgeConfig = getItemTypeBadge(item.type)
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <Badge variant={badgeConfig.variant} className="mt-1">
                                {getItemTypeIcon(item.type)}
                              </Badge>
                              {item.type === 'custom' ? (
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                  placeholder="Descripción del item"
                                  className="h-8"
                                />
                              ) : (
                                <div>
                                  <span className="font-medium">{item.description}</span>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {badgeConfig.label}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              min={0.01}
                              step={1}
                              className="h-8 w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              min={0}
                              className="h-8 w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={item.discount}
                                onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                min={0}
                                max={item.discountType === 'percentage' ? 100 : undefined}
                                className="h-8 w-16"
                              />
                              <Select
                                value={item.discountType}
                                onValueChange={(v) => updateItem(item.id, 'discountType', v)}
                              >
                                <SelectTrigger className="h-8 w-14">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">%</SelectItem>
                                  <SelectItem value="fixed">$</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(itemSubtotal, currency)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Notas y términos */}
          <Card>
            <CardHeader>
              <CardTitle>Notas y Términos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notas para el cliente</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales que aparecerán en la cotización..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Términos y condiciones</Label>
                <Textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral - Resumen */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select value={currency} onValueChange={(v: 'DOP' | 'USD') => setCurrency(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOP">Peso Dominicano (RD$)</SelectItem>
                    <SelectItem value="USD">Dólar Estadounidense (US$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Validez (días)</Label>
                <Input
                  type="number"
                  value={validDays}
                  onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
                  min={1}
                  max={365}
                />
                <p className="text-xs text-muted-foreground">
                  Válida hasta: {format(addDays(new Date(), validDays), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aplicar ITBIS (18%)</Label>
                  <p className="text-xs text-muted-foreground">
                    Impuesto sobre bienes y servicios
                  </p>
                </div>
                <Switch
                  checked={applyTax}
                  onCheckedChange={setApplyTax}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal + discountTotal, currency)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuentos</span>
                  <span>-{formatCurrency(discountTotal, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal con descuento</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              {applyTax && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ITBIS (18%)</span>
                  <span>{formatCurrency(taxAmount, currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total, currency)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {items.length} item{items.length !== 1 ? 's' : ''} en esta cotización
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                La cotización se generará con el número <strong>COT-2024-0001</strong> al guardar.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
