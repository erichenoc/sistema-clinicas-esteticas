'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Repeat, Plus, Trash2, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, getCategoryDef } from '@/types/expenses'
import type { ExpenseCategoryKey } from '@/types/expenses'
import {
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
} from '@/actions/recurring-expenses'
import type { RecurringExpenseData } from '@/actions/recurring-expenses'
import type { ExpenseCategory, ExpensePaymentMethod } from '@/actions/expenses'
import { getSuppliers } from '@/actions/inventory-suppliers'
import type { SupplierData } from '@/actions/inventory-suppliers'

const NO_SUPPLIER = '__none__'

export function GastosFijosDialog({
  recurring,
  periodLabel,
}: {
  recurring: RecurringExpenseData[]
  periodLabel: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [suppliers, setSuppliers] = useState<SupplierData[]>([])

  const [supplierId, setSupplierId] = useState(NO_SUPPLIER)
  const [supplierName, setSupplierName] = useState('')
  const [category, setCategory] = useState<ExpenseCategoryKey>('servicios')
  const [subcategory, setSubcategory] = useState('')
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState('')
  const [includesTax, setIncludesTax] = useState(false)
  const [dueDay, setDueDay] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('transfer')

  useEffect(() => {
    if (!open) return
    getSuppliers({ isActive: true }).then(setSuppliers)
  }, [open])

  const categoryDef = getCategoryDef(category)

  const resetForm = () => {
    setSupplierId(NO_SUPPLIER)
    setSupplierName('')
    setCategory('servicios')
    setSubcategory('')
    setConcept('')
    setAmount('')
    setIncludesTax(false)
    setDueDay('')
    setPaymentMethod('transfer')
    setShowForm(false)
  }

  const handleCreate = async () => {
    const selected = suppliers.find((s) => s.id === supplierId)
    const finalName = selected?.name || supplierName.trim()

    if (!finalName) {
      toast.error('Indica a quién se le paga')
      return
    }
    if (!concept.trim()) {
      toast.error('Escribe el concepto (ej: Renta del local)')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await createRecurringExpense({
        supplier_id: selected?.id || null,
        supplier_name: selected ? null : finalName,
        supplier_rnc: selected?.tax_id || null,
        category: category as ExpenseCategory,
        subcategory: subcategory || null,
        concept: concept.trim(),
        amount: parseFloat(amount) || 0,
        includes_tax: includesTax,
        due_day: parseInt(dueDay, 10) || null,
        payment_method: paymentMethod,
      })
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Gasto fijo guardado. Aparecerá cada mes.')
      resetForm()
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = async (item: RecurringExpenseData) => {
    const { error } = await updateRecurringExpense(item.id, { is_active: !item.is_active })
    if (error) {
      toast.error(error)
      return
    }
    toast.success(item.is_active ? 'Gasto fijo pausado' : 'Gasto fijo activado')
    router.refresh()
  }

  const handleDelete = async (item: RecurringExpenseData) => {
    if (!confirm(`Eliminar el gasto fijo "${item.concept}"? Los gastos ya registrados se conservan.`)) {
      return
    }
    const { error } = await deleteRecurringExpense(item.id)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Gasto fijo eliminado')
    router.refresh()
  }

  const monthlyTotal = recurring
    .filter((r) => r.is_active)
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Repeat className="mr-2 h-4 w-4" />
          Gastos Fijos
          {recurring.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {recurring.filter((r) => r.is_active).length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gastos Fijos</DialogTitle>
          <DialogDescription>
            Renta, luz, internet, teléfono: se guardan una vez y cada mes se registran con un clic
          </DialogDescription>
        </DialogHeader>

        {recurring.length > 0 && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total fijo mensual estimado</span>
              <span className="font-bold text-primary">{formatCurrency(monthlyTotal)}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {recurring.length === 0 && !showForm && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no tienes gastos fijos. Agrega la renta, la luz o el internet para no registrarlos
              a mano cada mes.
            </p>
          )}

          {recurring.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${
                item.is_active ? '' : 'opacity-60'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-sm">{item.concept}</p>
                  <Badge variant="outline" className="text-xs">
                    {EXPENSE_CATEGORY_LABELS[item.category] || item.category}
                  </Badge>
                  {item.generated_this_period && (
                    <Badge className="bg-green-500 text-xs">Ya registrado</Badge>
                  )}
                  {!item.is_active && (
                    <Badge variant="secondary" className="text-xs">
                      Pausado
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {item.display_name} · {formatCurrency(item.amount)}
                  {item.due_day ? ` · vence día ${item.due_day}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title={item.is_active ? 'Pausar' : 'Activar'}
                  onClick={() => handleToggle(item)}
                >
                  <Power className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {showForm ? (
          <div className="space-y-4 rounded-md border p-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Proveedor registrado</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="fixName">A quién se le paga *</Label>
                <Input
                  id="fixName"
                  value={
                    supplierId === NO_SUPPLIER
                      ? supplierName
                      : suppliers.find((s) => s.id === supplierId)?.name || ''
                  }
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Ej: EDESUR, Claro"
                  disabled={supplierId !== NO_SUPPLIER}
                />
              </div>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="fixConcept">Concepto *</Label>
              <Input
                id="fixConcept"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej: Renta del local, Internet Claro"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="fixAmount">Monto mensual (RD$)</Label>
                <Input
                  id="fixAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fixDay">Vence día</Label>
                <Input
                  id="fixDay"
                  type="number"
                  min="1"
                  max="28"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  placeholder="Ej: 5"
                />
              </div>
              <div className="space-y-2">
                <Label>Método</Label>
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
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="fixTax"
                checked={includesTax}
                onCheckedChange={(c) => setIncludesTax(!!c)}
              />
              <label htmlFor="fixTax" className="cursor-pointer text-sm text-muted-foreground">
                El monto incluye 18% de ITBIS
              </label>
            </div>

            <p className="text-xs text-muted-foreground">
              El monto es una estimación. Si la luz llega distinta, edita el gasto del mes sin tocar
              este fijo.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetForm} disabled={isSaving}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Fijo'}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Gasto Fijo
          </Button>
        )}

        <DialogFooter>
          <p className="mr-auto text-xs text-muted-foreground">Mostrando {periodLabel}</p>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
