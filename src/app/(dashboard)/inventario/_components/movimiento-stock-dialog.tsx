'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PackagePlus } from 'lucide-react'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { formatCurrency } from '@/types/billing'
import { registerStockEntry, adjustStock, registerStockLoss } from '@/actions/inventory-movements'

type Operation = 'entry' | 'adjust' | 'loss'

interface ProductOption {
  id: string
  name: string
  currentStock: number
  trackStock: boolean
  costPrice: number
}

export function MovimientoStockDialog({ products }: { products: ProductOption[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [operation, setOperation] = useState<Operation>('entry')

  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [notes, setNotes] = useState('')
  const [registerExpense, setRegisterExpense] = useState(false)

  // Solo productos que llevan existencias
  const trackable = products.filter((p) => p.trackStock)
  const selected = trackable.find((p) => p.id === productId)
  const qty = parseFloat(quantity) || 0
  const cost = parseFloat(unitCost) || 0

  const resetForm = () => {
    setProductId('')
    setQuantity('')
    setUnitCost('')
    setNotes('')
    setRegisterExpense(false)
  }

  const handleOperationChange = (value: string) => {
    setOperation(value as Operation)
    setQuantity('')
    setRegisterExpense(false)
  }

  const handleSelectProduct = (id: string) => {
    setProductId(id)
    const product = trackable.find((p) => p.id === id)
    if (product && operation === 'entry' && product.costPrice > 0) {
      setUnitCost(String(product.costPrice))
    }
  }

  const handleSubmit = async () => {
    if (!productId) {
      toast.error('Selecciona un producto')
      return
    }
    if (operation !== 'adjust' && qty <= 0) {
      toast.error('La cantidad debe ser mayor a cero')
      return
    }
    if (operation === 'adjust' && qty < 0) {
      toast.error('La cantidad contada no puede ser negativa')
      return
    }
    if (operation === 'loss' && !notes.trim()) {
      toast.error('Indica el motivo de la merma')
      return
    }

    setIsSaving(true)
    try {
      if (operation === 'entry') {
        const { balance, error, expenseError } = await registerStockEntry({
          productId,
          quantity: qty,
          unitCost: cost || null,
          notes: notes.trim() || null,
          registerExpense,
          expenseConcept: `Compra de ${selected?.name || 'producto'}`,
        })
        if (error) {
          toast.error(error)
          return
        }
        if (expenseError) {
          toast.warning(`Stock actualizado, pero el gasto no se registro: ${expenseError}`)
        } else {
          toast.success(
            registerExpense
              ? `Entrada registrada. Nuevo stock: ${balance}. Gasto creado.`
              : `Entrada registrada. Nuevo stock: ${balance}`
          )
        }
      } else if (operation === 'adjust') {
        const { balance, error } = await adjustStock({
          productId,
          countedQuantity: qty,
          notes: notes.trim() || null,
        })
        if (error) {
          toast.error(error)
          return
        }
        toast.success(`Inventario ajustado. Stock actual: ${balance}`)
      } else {
        const { balance, error } = await registerStockLoss({
          productId,
          quantity: qty,
          reason: notes.trim(),
        })
        if (error) {
          toast.error(error)
          return
        }
        toast.success(`Merma registrada. Stock restante: ${balance}`)
      }

      resetForm()
      setOpen(false)
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  const quantityLabel =
    operation === 'entry'
      ? 'Cantidad que entra'
      : operation === 'adjust'
        ? 'Cantidad real contada'
        : 'Cantidad perdida'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PackagePlus className="mr-2 h-4 w-4" />
          Mover Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Movimiento de Inventario</DialogTitle>
          <DialogDescription>
            Registra mercancia que entra, corrige el conteo o descarga una merma
          </DialogDescription>
        </DialogHeader>

        <Tabs value={operation} onValueChange={handleOperationChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entry">Entrada</TabsTrigger>
            <TabsTrigger value="adjust">Ajuste</TabsTrigger>
            <TabsTrigger value="loss">Merma</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Producto *</Label>
            <Select value={productId} onValueChange={handleSelectProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {trackable.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No hay productos que lleven inventario
                  </SelectItem>
                ) : (
                  trackable.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (stock: {p.currentStock})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selected && (
              <p className="text-xs text-muted-foreground">
                Stock actual en sistema: <strong>{selected.currentStock}</strong>
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="qty">{quantityLabel} *</Label>
              <Input
                id="qty"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            {operation === 'entry' && (
              <div className="space-y-2">
                <Label htmlFor="cost">Costo unitario (RD$)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          {operation === 'entry' && qty > 0 && cost > 0 && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo total de la entrada</span>
                <span className="font-medium">{formatCurrency(qty * cost)}</span>
              </div>
            </div>
          )}

          {operation === 'adjust' && selected && qty >= 0 && quantity !== '' && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diferencia contra el sistema</span>
                <span
                  className={`font-medium ${
                    qty - selected.currentStock < 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {qty - selected.currentStock > 0 ? '+' : ''}
                  {qty - selected.currentStock}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">
              {operation === 'loss' ? 'Motivo de la merma *' : 'Notas'}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                operation === 'loss'
                  ? 'Ej: producto vencido, frasco roto'
                  : operation === 'adjust'
                    ? 'Ej: conteo fisico de fin de mes'
                    : 'Ej: compra a proveedor X'
              }
              rows={2}
            />
          </div>

          {operation === 'entry' && cost > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="registerExpense"
                checked={registerExpense}
                onCheckedChange={(checked) => setRegisterExpense(!!checked)}
              />
              <label htmlFor="registerExpense" className="text-sm cursor-pointer">
                Registrar tambien como gasto de inversion ({formatCurrency(qty * cost)})
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || trackable.length === 0}>
            {isSaving ? 'Guardando...' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
