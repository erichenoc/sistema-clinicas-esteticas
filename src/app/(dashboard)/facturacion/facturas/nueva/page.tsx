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
  Building2,
  Receipt,
  Info,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

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

import { getPatients, type PatientData } from '@/actions/patients'
import { getTreatments, getPackages, type TreatmentListItemData, type PackageData } from '@/actions/treatments'
import { getProducts, type ProductListItemData } from '@/actions/inventory'
import { createSale } from '@/actions/pos'
import { createInvoice } from '@/actions/billing'

// Tipos para los datos transformados
interface ClientData {
  id: string
  name: string
  email: string | null
  phone: string
  rncCedula: string | null
  isBusiness: boolean
  businessName?: string
}

interface TreatmentItem {
  id: string
  name: string
  price: number
  category: string | null
  taxable: boolean
}

interface ProductItem {
  id: string
  name: string
  price: number
  stock: number
  taxable: boolean
}

interface PackageItem {
  id: string
  name: string
  price: number
  sessions: number
  taxable: boolean
}

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

  // Estados para datos cargados de la BD
  const [clients, setClients] = useState<ClientData[]>([])
  const [treatments, setTreatments] = useState<TreatmentItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
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

  // Cargar datos de la BD al montar
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [patientsData, treatmentsData, productsData, packagesData] = await Promise.all([
          getPatients(),
          getTreatments({ isActive: true }),
          getProducts({ isActive: true }),
          getPackages(),
        ])

        // Transformar pacientes a formato de clientes
        setClients(patientsData.map((p: PatientData) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email,
          phone: p.phone,
          rncCedula: p.document_number,
          isBusiness: false,
        })))

        // Transformar tratamientos
        setTreatments(treatmentsData.map((t: TreatmentListItemData) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          category: t.category_name,
          taxable: true,
        })))

        // Transformar productos
        setProducts(productsData.map((p: ProductListItemData) => ({
          id: p.id,
          name: p.name,
          price: p.sell_price || 0,
          stock: p.current_stock,
          taxable: true,
        })))

        // Transformar paquetes
        setPackages(packagesData.map((pk: PackageData) => ({
          id: pk.id,
          name: pk.name,
          price: pk.salePrice,
          sessions: pk.items.reduce((sum, item) => sum + item.quantity, 0),
          taxable: true,
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
  const handleSave = async (sendToClient: boolean = false) => {
    const validationError = validateInvoice()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsSubmitting(true)
    toast.loading('Guardando factura...', { id: 'save-invoice' })

    try {
      // Crear la venta primero
      const saleResult = await createSale({
        patient_id: selectedClient!.id,
        customer_name: selectedClient!.name,
        items: items.map(item => ({
          item_type: item.type === 'custom' ? 'treatment' : item.type as 'treatment' | 'package' | 'product',
          item_id: item.referenceId || item.id,
          item_name: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_amount: item.discountType === 'percentage'
            ? (item.quantity * item.unitPrice * item.discount / 100)
            : item.discount,
        })),
        subtotal,
        discount_total: discountTotal,
        tax_amount: taxAmount,
        total,
        payment_method: 'pending',
        notes,
      })

      if (saleResult.error) {
        toast.dismiss('save-invoice')
        toast.error(saleResult.error)
        setIsSubmitting(false)
        return
      }

      // Si tiene comprobante fiscal, crear la factura
      if (hasFiscalReceipt && saleResult.data) {
        const invoiceResult = await createInvoice(saleResult.data.id, {
          customer_tax_id: selectedClient!.rncCedula || undefined,
          customer_legal_name: selectedClient!.businessName || selectedClient!.name,
          customer_email: selectedClient!.email || undefined,
          invoice_series: ncfType || undefined,
        })

        if (invoiceResult.error) {
          toast.dismiss('save-invoice')
          toast.warning(`Venta creada pero hubo un error al generar factura: ${invoiceResult.error}`)
        } else {
          toast.dismiss('save-invoice')
          toast.success(`Factura ${invoiceResult.data?.invoice_number} emitida exitosamente`)
        }
      } else {
        toast.dismiss('save-invoice')
        toast.success(`Venta ${saleResult.data?.sale_number} creada exitosamente`)
      }

      router.push('/facturacion')
    } catch (error) {
      toast.dismiss('save-invoice')
      console.error('Error saving invoice:', error)
      toast.error('Error al guardar la factura')
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
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSubmitting || isLoading}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Borrador
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSubmitting || isLoading}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Emitir Factura
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Cargando datos...</span>
        </div>
      )}

      {!isLoading && (

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
                        {clients.map((client) => (
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
                            {treatments.map((t) => (
                              <CommandItem
                                key={t.id}
                                onSelect={() => addItem('treatment', { id: t.id, name: t.name, price: t.price, taxable: t.taxable })}
                              >
                                <Stethoscope className="mr-2 h-4 w-4 text-blue-500" />
                                <div className="flex-1">
                                  <span>{t.name}</span>
                                  {t.category && <span className="text-xs text-muted-foreground ml-2">({t.category})</span>}
                                </div>
                                <span className="font-medium">{formatCurrency(t.price, currency)}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandGroup heading="Productos">
                            {products.map((p) => (
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
                            {packages.map((pk) => (
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
      )}
    </div>
  )
}
