'use client'

import { useState } from 'react'
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
  AlertCircle,
  Building2,
  CreditCard,
  Receipt,
  Info,
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import {
  formatCurrency,
  NCF_TYPE_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  type NCFType,
  type PaymentTerms,
} from '@/types/billing'

// Mock data - clientes
const mockClients = [
  { id: '1', name: 'María García López', email: 'maria@email.com', phone: '809-555-0101', rncCedula: '001-1234567-8', isBusiness: false },
  { id: '2', name: 'Juan Rodríguez', email: 'juan@email.com', phone: '809-555-0102', rncCedula: '002-9876543-2', isBusiness: false },
  { id: '3', name: 'Ana Martínez', email: 'ana@email.com', phone: '809-555-0103', isBusiness: false },
  { id: '4', name: 'Empresa ABC, SRL', email: 'contacto@abc.com', phone: '809-555-0104', rncCedula: '130123456', isBusiness: true, businessName: 'ABC Distribuciones, SRL' },
  { id: '5', name: 'Comercial XYZ', email: 'info@xyz.com', phone: '809-555-0105', rncCedula: '131987654', isBusiness: true, businessName: 'Comercial XYZ, SAS' },
]

// Mock data - tratamientos
const mockTreatments = [
  { id: 't1', name: 'Limpieza Facial Profunda', price: 2500, category: 'Facial', taxable: true },
  { id: 't2', name: 'Botox - Zona Frontal', price: 8500, category: 'Facial', taxable: true },
  { id: 't3', name: 'Ácido Hialurónico - Labios', price: 12000, category: 'Facial', taxable: true },
  { id: 't4', name: 'Mesoterapia Corporal', price: 4500, category: 'Corporal', taxable: true },
  { id: 't5', name: 'Radiofrecuencia Facial', price: 3500, category: 'Facial', taxable: true },
  { id: 't6', name: 'Depilación Láser - Axilas', price: 2000, category: 'Corporal', taxable: true },
]

// Mock data - productos
const mockProducts = [
  { id: 'p1', name: 'Crema Hidratante Premium', price: 1800, stock: 25, taxable: true },
  { id: 'p2', name: 'Sérum Vitamina C', price: 2500, stock: 18, taxable: true },
  { id: 'p3', name: 'Protector Solar SPF 50', price: 950, stock: 42, taxable: true },
]

// Mock data - paquetes
const mockPackages = [
  { id: 'pk1', name: 'Paquete Rejuvenecimiento Facial', price: 25000, sessions: 5, taxable: true },
  { id: 'pk2', name: 'Paquete Corporal Completo', price: 35000, sessions: 8, taxable: true },
]

type ItemType = 'treatment' | 'product' | 'package' | 'custom'

interface InvoiceItem {
  id: string
  type: ItemType
  referenceId?: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'percentage' | 'fixed'
  taxable: boolean
  taxRate: number
  notes?: string
}

export default function NuevaFacturaPage() {
  const router = useRouter()
  const [selectedClient, setSelectedClient] = useState<typeof mockClients[0] | null>(null)
  const [clientSearchOpen, setClientSearchOpen] = useState(false)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [itemSearchOpen, setItemSearchOpen] = useState(false)
  const [currency, setCurrency] = useState<'DOP' | 'USD'>('DOP')
  const [notes, setNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  // Opciones de comprobante fiscal
  const [hasFiscalReceipt, setHasFiscalReceipt] = useState(false)
  const [ncfType, setNcfType] = useState<NCFType | ''>('')

  // Términos de pago
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('immediate')
  const [customPaymentDays, setCustomPaymentDays] = useState(30)

  const defaultTaxRate = 18 // ITBIS

  // Calcular totales
  const calculateItemSubtotal = (item: InvoiceItem) => {
    const gross = item.quantity * item.unitPrice
    const discountAmount = item.discountType === 'percentage'
      ? gross * (item.discount / 100)
      : item.discount
    return gross - discountAmount
  }

  const calculateItemTax = (item: InvoiceItem) => {
    if (!item.taxable) return 0
    const subtotal = calculateItemSubtotal(item)
    return subtotal * (item.taxRate / 100)
  }

  const subtotal = items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0)
  const discountTotal = items.reduce((sum, item) => {
    const gross = item.quantity * item.unitPrice
    return sum + (item.discountType === 'percentage'
      ? gross * (item.discount / 100)
      : item.discount)
  }, 0)
  const taxableAmount = items
    .filter(item => item.taxable)
    .reduce((sum, item) => sum + calculateItemSubtotal(item), 0)
  const exemptAmount = items
    .filter(item => !item.taxable)
    .reduce((sum, item) => sum + calculateItemSubtotal(item), 0)
  const taxAmount = items.reduce((sum, item) => sum + calculateItemTax(item), 0)
  const total = subtotal + taxAmount

  // Calcular fecha de vencimiento
  const getDueDate = () => {
    const term = PAYMENT_TERMS_OPTIONS.find(t => t.value === paymentTerms)
    const days = paymentTerms === 'custom' ? customPaymentDays : (term?.days || 0)
    return addDays(new Date(), days)
  }

  // Agregar item
  const addItem = (type: ItemType, data: { id: string; name: string; price: number; taxable?: boolean }) => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      type,
      referenceId: data.id,
      description: data.name,
      quantity: 1,
      unitPrice: data.price,
      discount: 0,
      discountType: 'percentage',
      taxable: data.taxable !== false,
      taxRate: defaultTaxRate,
    }
    setItems([...items, newItem])
    setItemSearchOpen(false)
  }

  // Agregar item personalizado
  const addCustomItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      type: 'custom',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percentage',
      taxable: true,
      taxRate: defaultTaxRate,
    }
    setItems([...items, newItem])
  }

  // Actualizar item
  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number | boolean) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // Eliminar item
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  // Validar antes de guardar
  const validateInvoice = (): string | null => {
    if (!selectedClient) return 'Selecciona un cliente'
    if (items.length === 0) return 'Agrega al menos un item'
    if (hasFiscalReceipt && !ncfType) return 'Selecciona el tipo de comprobante fiscal'
    if (hasFiscalReceipt && ncfType === 'B01' && !selectedClient.rncCedula) {
      return 'El cliente necesita RNC/Cédula para comprobante fiscal de crédito (B01)'
    }
    return null
  }

  // Guardar factura
  const handleSave = (sendToClient: boolean = false) => {
    const validationError = validateInvoice()
    if (validationError) {
      alert(validationError)
      return
    }

    const invoiceData = {
      clientId: selectedClient!.id,
      hasFiscalReceipt,
      ncfType: hasFiscalReceipt ? ncfType : undefined,
      items: items.map(item => ({
        type: item.type,
        referenceId: item.referenceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        discountType: item.discountType,
        taxable: item.taxable,
        taxRate: item.taxRate,
        notes: item.notes,
      })),
      currency,
      paymentTerms,
      customPaymentDays: paymentTerms === 'custom' ? customPaymentDays : undefined,
      dueDate: format(getDueDate(), 'yyyy-MM-dd'),
      notes,
      internalNotes,
      subtotal,
      discountTotal,
      taxableAmount,
      exemptAmount,
      taxAmount,
      total,
      status: sendToClient ? 'pending' : 'draft',
    }

    console.log('Guardando factura:', invoiceData)

    // Simular guardado
    const message = hasFiscalReceipt
      ? `Factura con NCF ${ncfType} ${sendToClient ? 'emitida' : 'guardada como borrador'}`
      : `Factura ${sendToClient ? 'emitida' : 'guardada como borrador'}`
    alert(message)
    router.push('/facturacion')
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

  // Determinar NCF recomendado según cliente
  const getRecommendedNCF = (): NCFType => {
    if (selectedClient?.isBusiness && selectedClient?.rncCedula) {
      return 'B01' // Crédito fiscal para empresas con RNC
    }
    return 'B02' // Consumidor final
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facturacion">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Nueva Factura</h1>
            <p className="text-muted-foreground">
              Crea una factura{hasFiscalReceipt ? ' con comprobante fiscal' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave(false)}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Borrador
          </Button>
          <Button onClick={() => handleSave(true)}>
            <Send className="mr-2 h-4 w-4" />
            Emitir Factura
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
              <CardDescription>Selecciona el cliente para esta factura</CardDescription>
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
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{selectedClient.name}</span>
                          {selectedClient.isBusiness && (
                            <Badge variant="secondary">
                              <Building2 className="mr-1 h-3 w-3" />
                              Empresa
                            </Badge>
                          )}
                        </div>
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
                    <CommandInput placeholder="Buscar por nombre, email o RNC..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron clientes</CommandEmpty>
                      <CommandGroup>
                        {mockClients.map((client) => (
                          <CommandItem
                            key={client.id}
                            onSelect={() => {
                              setSelectedClient(client)
                              setClientSearchOpen(false)
                              // Auto-seleccionar NCF recomendado
                              if (hasFiscalReceipt) {
                                if (client.isBusiness && client.rncCedula) {
                                  setNcfType('B01')
                                } else {
                                  setNcfType('B02')
                                }
                              }
                            }}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{client.name}</span>
                                {client.isBusiness && (
                                  <Badge variant="outline" className="text-xs">Empresa</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {client.email} • {client.phone}
                                {client.rncCedula && ` • RNC: ${client.rncCedula}`}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
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
                        <span className="ml-2 font-mono">{selectedClient.rncCedula}</span>
                      </div>
                    )}
                    {selectedClient.businessName && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Razón Social:</span>
                        <span className="ml-2">{selectedClient.businessName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comprobante Fiscal */}
          <Card className={hasFiscalReceipt ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Comprobante Fiscal (NCF)</CardTitle>
                    <CardDescription>
                      Emite factura con comprobante fiscal válido para la DGII
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={hasFiscalReceipt}
                  onCheckedChange={(checked) => {
                    setHasFiscalReceipt(checked)
                    if (checked && selectedClient) {
                      setNcfType(getRecommendedNCF())
                    } else {
                      setNcfType('')
                    }
                  }}
                />
              </div>
            </CardHeader>
            {hasFiscalReceipt && (
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Tipo de Comprobante</AlertTitle>
                  <AlertDescription>
                    Selecciona el tipo de NCF según las características del cliente y la transacción.
                  </AlertDescription>
                </Alert>

                <RadioGroup
                  value={ncfType}
                  onValueChange={(v) => setNcfType(v as NCFType)}
                  className="grid gap-3"
                >
                  {NCF_TYPE_OPTIONS.map((option) => {
                    const isRecommended = selectedClient && option.value === getRecommendedNCF()
                    const requiresRNC = option.value === 'B01'
                    const canSelect = !requiresRNC || (selectedClient?.rncCedula)

                    return (
                      <div key={option.value} className="relative">
                        <Label
                          htmlFor={option.value}
                          className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                            ncfType === option.value
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          } ${!canSelect ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                            disabled={!canSelect}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.label}</span>
                              {isRecommended && (
                                <Badge variant="secondary" className="text-xs">
                                  Recomendado
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {option.description}
                            </p>
                            {requiresRNC && !selectedClient?.rncCedula && (
                              <p className="text-xs text-destructive mt-1">
                                Requiere RNC/Cédula del cliente
                              </p>
                            )}
                          </div>
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>

                {ncfType && (
                  <div className="p-3 rounded-lg bg-primary/10 text-sm">
                    <p className="font-medium">NCF a generar:</p>
                    <p className="font-mono text-lg">{ncfType}00000001</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      El número se asignará automáticamente al emitir la factura
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Items de la factura */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Items</CardTitle>
                  <CardDescription>Agrega los servicios y productos a facturar</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Popover open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Item
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Buscar tratamiento, producto o paquete..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron resultados</CommandEmpty>
                          <CommandGroup heading="Tratamientos">
                            {mockTreatments.map((t) => (
                              <CommandItem
                                key={t.id}
                                onSelect={() => addItem('treatment', { id: t.id, name: t.name, price: t.price, taxable: t.taxable })}
                              >
                                <Stethoscope className="mr-2 h-4 w-4 text-blue-500" />
                                <div className="flex-1">
                                  <span>{t.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">({t.category})</span>
                                </div>
                                <span className="font-medium">{formatCurrency(t.price, currency)}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandGroup heading="Productos">
                            {mockProducts.map((p) => (
                              <CommandItem
                                key={p.id}
                                onSelect={() => addItem('product', { id: p.id, name: p.name, price: p.price, taxable: p.taxable })}
                              >
                                <Package className="mr-2 h-4 w-4 text-green-500" />
                                <div className="flex-1">
                                  <span>{p.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">(Stock: {p.stock})</span>
                                </div>
                                <span className="font-medium">{formatCurrency(p.price, currency)}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandGroup heading="Paquetes">
                            {mockPackages.map((pk) => (
                              <CommandItem
                                key={pk.id}
                                onSelect={() => addItem('package', { id: pk.id, name: pk.name, price: pk.price, taxable: pk.taxable })}
                              >
                                <Gift className="mr-2 h-4 w-4 text-purple-500" />
                                <div className="flex-1">
                                  <span>{pk.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">({pk.sessions} sesiones)</span>
                                </div>
                                <span className="font-medium">{formatCurrency(pk.price, currency)}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button variant="outline" onClick={addCustomItem}>
                    <FileText className="mr-2 h-4 w-4" />
                    Item Personalizado
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
                      <TableHead className="w-[250px]">Descripción</TableHead>
                      <TableHead className="w-[70px]">Cant.</TableHead>
                      <TableHead className="w-[100px]">Precio</TableHead>
                      <TableHead className="w-[130px]">Descuento</TableHead>
                      <TableHead className="w-[60px]">ITBIS</TableHead>
                      <TableHead className="w-[110px] text-right">Total</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const itemSubtotal = calculateItemSubtotal(item)
                      const itemTax = calculateItemTax(item)
                      const itemTotal = itemSubtotal + itemTax
                      const badgeConfig = getItemTypeBadge(item.type)
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <Badge variant={badgeConfig.variant} className="mt-1 shrink-0">
                                {getItemTypeIcon(item.type)}
                              </Badge>
                              {item.type === 'custom' ? (
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                  placeholder="Descripción"
                                  className="h-8"
                                />
                              ) : (
                                <span className="font-medium text-sm">{item.description}</span>
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
                              className="h-8 w-14"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              min={0}
                              className="h-8 w-20"
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
                                className="h-8 w-14"
                              />
                              <Select
                                value={item.discountType}
                                onValueChange={(v) => updateItem(item.id, 'discountType', v)}
                              >
                                <SelectTrigger className="h-8 w-12">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">%</SelectItem>
                                  <SelectItem value="fixed">$</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={item.taxable}
                              onCheckedChange={(checked) => updateItem(item.id, 'taxable', !!checked)}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(itemTotal, currency)}
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

          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notas para el cliente</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas que aparecerán en la factura..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Notas internas (no visibles para el cliente)</Label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notas internas para referencia..."
                  rows={2}
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
                <Label>Términos de pago</Label>
                <Select value={paymentTerms} onValueChange={(v: PaymentTerms) => setPaymentTerms(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS_OPTIONS.map((term) => (
                      <SelectItem key={term.value} value={term.value}>
                        {term.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {paymentTerms === 'custom' && (
                <div className="space-y-2">
                  <Label>Días de crédito</Label>
                  <Input
                    type="number"
                    value={customPaymentDays}
                    onChange={(e) => setCustomPaymentDays(parseInt(e.target.value) || 30)}
                    min={1}
                    max={365}
                  />
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <span className="text-muted-foreground">Vencimiento:</span>
                <span className="ml-2 font-medium">
                  {format(getDueDate(), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal bruto</span>
                <span>{formatCurrency(subtotal + discountTotal, currency)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuentos</span>
                  <span>-{formatCurrency(discountTotal, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal neto</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <Separator />
              {taxableAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monto gravado</span>
                  <span>{formatCurrency(taxableAmount, currency)}</span>
                </div>
              )}
              {exemptAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monto exento</span>
                  <span>{formatCurrency(exemptAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ITBIS (18%)</span>
                <span>{formatCurrency(taxAmount, currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total, currency)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {items.length} item{items.length !== 1 ? 's' : ''} en esta factura
              </p>
            </CardContent>
          </Card>

          {hasFiscalReceipt && ncfType && (
            <Card className="border-primary bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  <span className="font-medium">Comprobante Fiscal</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium">{ncfType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NCF:</span>
                    <span className="font-mono">{ncfType}00000001</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                La factura se generará con el número <strong>FAC-2024-0001</strong> al emitir.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
