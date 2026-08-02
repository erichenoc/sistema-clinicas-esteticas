'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { formatCurrency } from '@/types/billing'
import { EXPENSE_CATEGORIES, getCategoryDef } from '@/types/expenses'
import type { ExpenseCategoryKey } from '@/types/expenses'
import { createExpense, registerExpensePayment } from '@/actions/expenses'
import type { ExpenseCategory, ExpensePaymentMethod } from '@/actions/expenses'
import { getSuppliers } from '@/actions/inventory-suppliers'
import type { SupplierData } from '@/actions/inventory-suppliers'

const ITBIS_RATE = 18

const NO_SUPPLIER = '__none__'

export function NuevoGastoDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [suppliers, setSuppliers] = useState<SupplierData[]>([])

  // Datos del gasto
  const [supplierId, setSupplierId] = useState<string>(NO_SUPPLIER)
  const [supplierName, setSupplierName] = useState('')
  const [supplierRnc, setSupplierRnc] = useState('')
  const [category, setCategory] = useState<ExpenseCategoryKey>('servicios')
  const [subcategory, setSubcategory] = useState('')
  const [concept, setConcept] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [ncf, setNcf] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState('')
  const [hasTax, setHasTax] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('transfer')
  const [notes, setNotes] = useState('')
  const [payNow, setPayNow] = useState(false)

  useEffect(() => {
    if (!open) return
    getSuppliers({ isActive: true }).then(setSuppliers)
  }, [open])

  const categoryDef = getCategoryDef(category)

  // El monto que se digita es el TOTAL de la factura del proveedor.
  // Si lleva ITBIS, se desglosa hacia atras para poder reportarlo en el 606.
  const totalAmount = parseFloat(amount) || 0
  const subtotal = hasTax ? totalAmount / (1 + ITBIS_RATE / 100) : totalAmount
  const taxAmount = hasTax ? totalAmount - subtotal : 0

  const resetForm = () => {
    setSupplierId(NO_SUPPLIER)
    setSupplierName('')
    setSupplierRnc('')
    setCategory('servicios')
    setSubcategory('')
    setConcept('')
    setInvoiceNumber('')
    setNcf('')
    setIssueDate(new Date().toISOString().slice(0, 10))
    setDueDate('')
    setAmount('')
    setHasTax(false)
    setPaymentMethod('transfer')
    setNotes('')
    setPayNow(false)
  }

  const handleSubmit = async () => {
    const selectedSupplier = suppliers.find((s) => s.id === supplierId)
    const finalSupplierName = selectedSupplier?.name || supplierName.trim()

    if (!finalSupplierName) {
      toast.error('Indica a quién se le paga')
      return
    }
    if (!concept.trim()) {
      toast.error('Escribe el concepto del gasto')
      return
    }
    if (totalAmount <= 0) {
      toast.error('El monto debe ser mayor a cero')
      return
    }

    setIsSaving(true)
    try {
      const { data, error } = await createExpense({
        supplier_id: selectedSupplier?.id || null,
        supplier_name: selectedSupplier ? null : finalSupplierName,
        supplier_rnc: supplierRnc.trim() || selectedSupplier?.tax_id || null,
        supplier_invoice_number: invoiceNumber.trim() || null,
        ncf: ncf.trim() || null,
        category: category as ExpenseCategory,
        subcategory: subcategory || null,
        concept: concept.trim(),
        issue_date: issueDate,
        due_date: dueDate || null,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: Math.round(taxAmount * 100) / 100,
        total: totalAmount,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      })

      if (error || !data) {
        toast.error(error || 'Error al registrar el gasto')
        return
      }

      // Gasto de contado: se registra el pago completo de una vez
      if (payNow) {
        const { error: payError } = await registerExpensePayment(data.id, {
          amount: totalAmount,
          payment_method: paymentMethod,
          payment_date: issueDate,
        })
        if (payError) {
          toast.warning(`Gasto registrado, pero el pago no se guardo: ${payError}`)
        } else {
          toast.success(`Gasto ${data.expense_number} registrado y pagado`)
        }
      } else {
        toast.success(`Gasto ${data.expense_number} registrado`)
      }

      resetForm()
      setOpen(false)
      onCreated()
    } catch (err) {
      console.error('Error creating expense:', err)
      toast.error('Error al registrar el gasto')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gasto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Gasto</DialogTitle>
          <DialogDescription>
            Registra lo que la clínica paga: proveedores, servicios, nómina o inversión en productos
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Proveedor */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Proveedor registrado</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SUPPLIER}>Otro (escribir abajo)</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierName">
                {supplierId === NO_SUPPLIER ? 'A quién se le paga *' : 'A quién se le paga'}
              </Label>
              <Input
                id="supplierName"
                value={supplierId === NO_SUPPLIER ? supplierName : suppliers.find((s) => s.id === supplierId)?.name || ''}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Ej: EDESUR, Claro, Juan Pérez"
                disabled={supplierId !== NO_SUPPLIER}
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v as ExpenseCategoryKey)
                  setSubcategory('')
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoryDef && (
                <p className="text-xs text-muted-foreground">{categoryDef.description}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Detalle</Label>
              {categoryDef && categoryDef.subcategories.length > 0 ? (
                <Select value={subcategory} onValueChange={setSubcategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryDef.subcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="Opcional"
                />
              )}
            </div>
          </div>

          {/* Concepto */}
          <div className="space-y-2">
            <Label htmlFor="concept">Concepto *</Label>
            <Input
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej: Factura de luz de enero, compra de ácido hialurónico"
            />
          </div>

          {/* Monto */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto total (RD$) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>ITBIS incluido</Label>
              <div className="flex h-9 items-center gap-2">
                <Checkbox
                  id="hasTax"
                  checked={hasTax}
                  onCheckedChange={(checked) => setHasTax(!!checked)}
                />
                <label htmlFor="hasTax" className="text-sm text-muted-foreground cursor-pointer">
                  El monto incluye {ITBIS_RATE}% de ITBIS
                </label>
              </div>
            </div>
          </div>

          {hasTax && totalAmount > 0 && (
            <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ITBIS pagado</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}

          {/* Comprobantes */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">No. Factura</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ncf">NCF</Label>
              <Input
                id="ncf"
                value={ncf}
                onChange={(e) => setNcf(e.target.value)}
                placeholder="B01..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rnc">RNC proveedor</Label>
              <Input
                id="rnc"
                value={supplierRnc}
                onChange={(e) => setSupplierRnc(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Fecha del gasto *</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha límite de pago</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Pago */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as ExpensePaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <div className="flex h-9 items-center gap-2">
                <Checkbox
                  id="payNow"
                  checked={payNow}
                  onCheckedChange={(checked) => setPayNow(!!checked)}
                />
                <label htmlFor="payNow" className="text-sm text-muted-foreground cursor-pointer">
                  Ya está pagado completo
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Registrar Gasto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
