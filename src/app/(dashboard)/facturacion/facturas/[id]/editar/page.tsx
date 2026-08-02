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
  Percent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useUser } from '@/contexts/user-context'
import { formatCurrency } from '@/types/billing'
import {
  getInvoiceById,
  getInvoiceItems,
  updateInvoiceWithItems,
} from '@/actions/billing'

const DEFAULT_TAX_RATE = 18 // ITBIS Republica Dominicana

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'percentage' | 'fixed'
  taxable: boolean
  taxRate: number
  treatmentId: string | null
}

export default function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user, hasPermission, isLoading: userLoading } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'owner'

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientRnc, setClientRnc] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])

  // Estado de cobro de la factura (define si el ITBIS se edita bajo auditoria)
  const [paidAmount, setPaidAmount] = useState(0)
  const [invoiceStatus, setInvoiceStatus] = useState<string>('pending')

  // Check permissions
  useEffect(() => {
    if (!userLoading && !hasPermission('billing:edit')) {
      toast.error('No tienes permisos para editar facturas')
      router.push('/facturacion')
    }
  }, [hasPermission, userLoading, router])

  // Cargar datos reales de la factura
  useEffect(() => {
    if (userLoading) return

    const loadInvoice = async () => {
      setIsLoading(true)
      try {
        const [invoice, itemsData] = await Promise.all([
          getInvoiceById(id),
          getInvoiceItems(id),
        ])

        if (!invoice) {
          toast.error('Factura no encontrada')
          router.push('/facturacion')
          return
        }

        // Una factura anulada nunca se edita
        if (invoice.status === 'cancelled') {
          toast.error('Esta factura esta anulada y no se puede editar')
          router.push(`/facturacion/facturas/${id}`)
          return
        }

        // Con pagos registrados solo admin/dueno puede editar (queda auditado)
        const hasPayments = invoice.status === 'paid' || invoice.paid_amount > 0
        if (hasPayments && !isAdmin) {
          toast.error('Esta factura ya tiene pagos: solo un administrador puede editarla')
          router.push(`/facturacion/facturas/${id}`)
          return
        }

        setInvoiceNumber(invoice.invoice_number)
        setClientName(invoice.patient_name || 'Cliente General')
        setClientRnc(invoice.ncf || '')
        setNotes(invoice.notes || '')
        setPaidAmount(invoice.paid_amount || 0)
        setInvoiceStatus(invoice.status)
        setItems(
          itemsData.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            discount: item.discount_percent || 0,
            discountType: 'percentage' as const,
            taxable: (item.tax_percent || 0) > 0,
            taxRate: (item.tax_percent || 0) > 0 ? item.tax_percent : DEFAULT_TAX_RATE,
            treatmentId: item.treatment_id,
          }))
        )
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading invoice:', error)
        toast.error('Error al cargar la factura')
        router.push('/facturacion')
      }
    }

    loadInvoice()
  }, [id, router, userLoading, isAdmin])

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
    // Hereda el criterio de ITBIS de la factura: si ningun item lleva ITBIS,
    // el nuevo tampoco (facturas exentas)
    const anyTaxable = items.some((item) => item.taxable)
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percentage',
      taxable: anyTaxable,
      taxRate: DEFAULT_TAX_RATE,
      treatmentId: null,
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

  // Quitar o aplicar el ITBIS a toda la factura de una sola vez
  const handleToggleAllTax = (taxable: boolean) => {
    setItems(
      items.map((item) => ({
        ...item,
        taxable,
        taxRate: item.taxRate || DEFAULT_TAX_RATE,
      }))
    )
    toast.success(taxable ? 'ITBIS aplicado a todos los items' : 'ITBIS retirado de toda la factura')
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

    try {
      const { error, overpaid } = await updateInvoiceWithItems(
        id,
        { notes: notes.trim() || null },
        items.map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_percent: item.discount,
          tax_percent: item.taxable ? item.taxRate : 0,
          treatment_id: item.treatmentId,
        }))
      )

      if (error) {
        toast.error(error)
        return
      }

      if (overpaid && overpaid > 0) {
        toast.success(
          `Factura actualizada. Queda un saldo a favor del paciente de ${formatCurrency(overpaid)}`,
          { duration: 8000 }
        )
      } else {
        toast.success('Factura actualizada exitosamente')
      }
      router.push(`/facturacion/facturas/${id}`)
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error('Error al actualizar la factura')
    } finally {
      setIsSaving(false)
    }
  }

  const totals = calculateTotals()
  const hasPayments = invoiceStatus === 'paid' || paidAmount > 0
  const allTaxable = items.length > 0 && items.every((item) => item.taxable)
  const noneTaxable = items.length > 0 && items.every((item) => !item.taxable)
  // Excedente si el nuevo total queda por debajo de lo ya cobrado
  const overpaidPreview = Math.max(0, paidAmount - totals.total)

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
      {hasPayments ? (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">
            Esta factura ya tiene {formatCurrency(paidAmount)} cobrados
          </AlertTitle>
          <AlertDescription className="text-red-700">
            Estas editando una factura con pagos registrados. El cambio queda guardado en el
            historial de auditoria con el detalle anterior, quien lo hizo y cuando.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Atencion</AlertTitle>
          <AlertDescription className="text-amber-700">
            Solo los administradores pueden editar facturas. Los cambios quedaran registrados en el historial de la factura.
          </AlertDescription>
        </Alert>
      )}

      {/* Aviso de saldo a favor: el nuevo total quedo por debajo de lo cobrado */}
      {overpaidPreview > 0 && (
        <Alert variant="destructive" className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">
            Quedara un saldo a favor de {formatCurrency(overpaidPreview)}
          </AlertTitle>
          <AlertDescription className="text-blue-700">
            El nuevo total ({formatCurrency(totals.total)}) es menor a lo ya cobrado
            ({formatCurrency(paidAmount)}). Al guardar, la factura queda saldada y la diferencia
            se registra como saldo a favor del paciente en las notas internas.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info (solo lectura: el cliente se define al crear la factura) */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del Cliente</CardTitle>
              <CardDescription>El cliente no se puede modificar desde la edicion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{clientName}</p>
                </div>
                {clientRnc && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">NCF / Comprobante</Label>
                    <p className="font-mono font-medium">{clientRnc}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Items de la Factura</CardTitle>
                <CardDescription>
                  Marca o desmarca el ITBIS por item, o quitalo de toda la factura
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleAllTax(false)}
                  disabled={noneTaxable}
                >
                  <Percent className="mr-2 h-4 w-4" />
                  Quitar ITBIS a todo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleAllTax(true)}
                  disabled={allTaxable}
                >
                  <Percent className="mr-2 h-4 w-4" />
                  Aplicar ITBIS a todo
                </Button>
                <Button size="sm" onClick={handleAddItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[34%]">Descripcion</TableHead>
                    <TableHead className="text-right w-[10%]">Cant.</TableHead>
                    <TableHead className="text-right w-[14%]">Precio</TableHead>
                    <TableHead className="text-right w-[10%]">Desc. %</TableHead>
                    <TableHead className="text-center w-[8%]">ITBIS</TableHead>
                    <TableHead className="text-right w-[15%]">Total</TableHead>
                    <TableHead className="w-[9%]"></TableHead>
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
                      <TableCell className="text-center">
                        <Checkbox
                          checked={item.taxable}
                          onCheckedChange={(checked) => handleUpdateItem(item.id, 'taxable', !!checked)}
                          aria-label={`Aplicar ITBIS a ${item.description || 'este item'}`}
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
                    <TableCell colSpan={5} className="text-right">Subtotal</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.subtotal)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  {totals.discountTotal > 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-right">Descuento</TableCell>
                      <TableCell className="text-right text-red-600">
                        -{formatCurrency(totals.discountTotal)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={5} className="text-right">
                      {noneTaxable ? 'ITBIS (factura exenta)' : `ITBIS (${DEFAULT_TAX_RATE}%)`}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.taxTotal)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={5} className="text-right font-bold text-lg">Total</TableCell>
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
                {noneTaxable ? (
                  <span className="text-muted-foreground">Exenta</span>
                ) : (
                  <span>{formatCurrency(totals.taxTotal)}</span>
                )}
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(totals.total)}</span>
              </div>
              {paidAmount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ya cobrado</span>
                    <span className="text-green-600">{formatCurrency(paidAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {overpaidPreview > 0 ? 'Saldo a favor' : 'Pendiente'}
                    </span>
                    <span className={overpaidPreview > 0 ? 'text-blue-600 font-medium' : 'font-medium'}>
                      {formatCurrency(
                        overpaidPreview > 0 ? overpaidPreview : totals.total - paidAmount
                      )}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
