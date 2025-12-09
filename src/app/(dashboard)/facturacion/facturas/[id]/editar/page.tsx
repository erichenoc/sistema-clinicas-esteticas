'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { toast } from 'sonner'
import { useUser } from '@/contexts/user-context'
import { formatCurrency, PAYMENT_TERMS_OPTIONS } from '@/types/billing'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'percentage' | 'fixed'
  taxable: boolean
  taxRate: number
}

export default function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { hasPermission, isLoading: userLoading } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientRnc, setClientRnc] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('immediate')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])

  // Check permissions
  useEffect(() => {
    if (!userLoading && !hasPermission('billing:edit')) {
      toast.error('No tienes permisos para editar facturas')
      router.push('/facturacion')
    }
  }, [hasPermission, userLoading, router])

  // Load invoice data
  useEffect(() => {
    // Simular carga de datos (en produccion seria una llamada a API)
    const loadInvoice = async () => {
      // Mock data
      setInvoiceNumber(`FAC-2024-00${id}`)
      setClientName('Maria Garcia Lopez')
      setClientEmail('maria.garcia@email.com')
      setClientPhone('809-555-1234')
      setClientRnc('')
      setPaymentTerms('immediate')
      setNotes('Tratamiento realizado por Dra. Carmen Perez.')
      setItems([
        {
          id: '1',
          description: 'Limpieza Facial Profunda',
          quantity: 1,
          unitPrice: 2500,
          discount: 0,
          discountType: 'percentage',
          taxable: true,
          taxRate: 18,
        },
        {
          id: '2',
          description: 'Botox - Zona Entrecejo (20 unidades)',
          quantity: 1,
          unitPrice: 15000,
          discount: 10,
          discountType: 'percentage',
          taxable: true,
          taxRate: 18,
        },
      ])
      setIsLoading(false)
    }

    loadInvoice()
  }, [id])

  const calculateItemTotal = (item: InvoiceItem) => {
    let subtotal = item.quantity * item.unitPrice
    if (item.discount > 0) {
      if (item.discountType === 'percentage') {
        subtotal = subtotal * (1 - item.discount / 100)
      } else {
        subtotal = subtotal - item.discount
      }
    }
    const tax = item.taxable ? subtotal * (item.taxRate / 100) : 0
    return subtotal + tax
  }

  const calculateTotals = () => {
    let subtotal = 0
    let discountTotal = 0
    let taxTotal = 0

    items.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice
      subtotal += itemSubtotal

      if (item.discount > 0) {
        if (item.discountType === 'percentage') {
          discountTotal += itemSubtotal * (item.discount / 100)
        } else {
          discountTotal += item.discount
        }
      }

      const taxableAmount = itemSubtotal - (item.discountType === 'percentage'
        ? itemSubtotal * (item.discount / 100)
        : item.discount)
      if (item.taxable) {
        taxTotal += taxableAmount * (item.taxRate / 100)
      }
    })

    return {
      subtotal,
      discountTotal,
      taxTotal,
      total: subtotal - discountTotal + taxTotal,
    }
  }

  const handleUpdateItem = (itemId: string, field: keyof InvoiceItem, value: string | number | boolean) => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ))
  }

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percentage',
      taxable: true,
      taxRate: 18,
    }
    setItems([...items, newItem])
  }

  const handleRemoveItem = (itemId: string) => {
    if (items.length <= 1) {
      toast.error('La factura debe tener al menos un item')
      return
    }
    setItems(items.filter(item => item.id !== itemId))
  }

  const handleSave = async () => {
    if (!clientName.trim()) {
      toast.error('El nombre del cliente es requerido')
      return
    }
    if (items.some(item => !item.description.trim())) {
      toast.error('Todos los items deben tener una descripcion')
      return
    }

    setIsSaving(true)

    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast.success('Factura actualizada exitosamente')
    router.push(`/facturacion/facturas/${id}`)
  }

  const totals = calculateTotals()

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/facturacion/facturas/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Factura</h1>
            <p className="text-muted-foreground">{invoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/facturacion/facturas/${id}`}>Cancelar</Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* Warning */}
      <Alert variant="destructive" className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Atencion</AlertTitle>
        <AlertDescription className="text-amber-700">
          Solo los administradores pueden editar facturas. Los cambios quedaran registrados en el historial de la factura.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del Cliente</CardTitle>
              <CardDescription>Informacion del cliente para la factura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nombre *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientRnc">RNC / Cedula</Label>
                  <Input
                    id="clientRnc"
                    value={clientRnc}
                    onChange={(e) => setClientRnc(e.target.value)}
                    placeholder="Para comprobantes fiscales"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Telefono</Label>
                  <Input
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="1-809-555-0000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Items de la Factura</CardTitle>
                <CardDescription>Productos y servicios facturados</CardDescription>
              </div>
              <Button size="sm" onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Item
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Descripcion</TableHead>
                    <TableHead className="text-right w-[10%]">Cant.</TableHead>
                    <TableHead className="text-right w-[15%]">Precio</TableHead>
                    <TableHead className="text-right w-[10%]">Desc. %</TableHead>
                    <TableHead className="text-right w-[15%]">Total</TableHead>
                    <TableHead className="w-[10%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          placeholder="Descripcion del item"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => handleUpdateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(calculateItemTotal(item))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right">Subtotal</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.subtotal)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  {totals.discountTotal > 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-right">Descuento</TableCell>
                      <TableCell className="text-right text-red-600">
                        -{formatCurrency(totals.discountTotal)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={4} className="text-right">ITBIS (18%)</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.taxTotal)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={4} className="text-right font-bold text-lg">Total</TableCell>
                    <TableCell className="text-right font-bold text-lg">{formatCurrency(totals.total)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales para la factura..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuracion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Terminos de Pago</Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.discountTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="text-red-600">-{formatCurrency(totals.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">ITBIS</span>
                <span>{formatCurrency(totals.taxTotal)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(totals.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
