'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { EXPENSE_PAYMENT_METHOD_LABELS } from '@/types/expenses'
import {
  getExpensePayments,
  registerExpensePayment,
  deleteExpensePayment,
} from '@/actions/expenses'
import type {
  ExpenseListItem,
  ExpensePaymentData,
  ExpensePaymentMethod,
} from '@/actions/expenses'

export function PagarGastoDialog({
  expense,
  open,
  onOpenChange,
  onPaid,
}: {
  expense: ExpenseListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaid: () => void
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [payments, setPayments] = useState<ExpensePaymentData[]>([])
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<ExpensePaymentMethod>('transfer')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState('')

  useEffect(() => {
    if (!open || !expense) return
    setAmount(expense.pending_amount > 0 ? String(expense.pending_amount) : '')
    setMethod((expense.payment_method as ExpensePaymentMethod) || 'transfer')
    setDate(new Date().toISOString().slice(0, 10))
    setReference('')
    getExpensePayments(expense.id).then(({ data }) => setPayments(data))
  }, [open, expense])

  if (!expense) return null

  const paymentAmount = parseFloat(amount) || 0
  const remainingAfter = Math.max(0, expense.pending_amount - paymentAmount)

  const handlePay = async () => {
    if (paymentAmount <= 0) {
      toast.error('El monto debe ser mayor a cero')
      return
    }
    if (paymentAmount > expense.pending_amount + 0.01) {
      toast.error(`El pago excede el saldo pendiente (${formatCurrency(expense.pending_amount)})`)
      return
    }

    setIsSaving(true)
    try {
      const { error } = await registerExpensePayment(expense.id, {
        amount: paymentAmount,
        payment_method: method,
        payment_date: date,
        reference: reference.trim() || null,
      })

      if (error) {
        toast.error(error)
        return
      }

      toast.success(
        remainingAfter > 0
          ? `Abono registrado. Queda pendiente ${formatCurrency(remainingAfter)}`
          : 'Gasto pagado completo'
      )
      onOpenChange(false)
      onPaid()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    const { error } = await deleteExpensePayment(paymentId)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Pago eliminado')
    const { data } = await getExpensePayments(expense.id)
    setPayments(data)
    onPaid()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            {expense.supplier_display_name} — {expense.concept}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total del gasto</span>
            <span>{formatCurrency(expense.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ya pagado</span>
            <span className="text-green-600">{formatCurrency(expense.paid_amount)}</span>
          </div>
          <div className="flex justify-between font-medium border-t pt-1">
            <span>Pendiente</span>
            <span className="text-red-600">{formatCurrency(expense.pending_amount)}</span>
          </div>
        </div>

        <div className="grid gap-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payAmount">Monto a pagar (RD$)</Label>
              <Input
                id="payAmount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as ExpensePaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPENSE_PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payDate">Fecha del pago</Label>
              <Input
                id="payDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payRef">Referencia</Label>
              <Input
                id="payRef"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="No. cheque, transferencia"
              />
            </div>
          </div>

          {payments.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Pagos ya registrados</Label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{formatCurrency(p.amount)}</span>
                      <span className="text-muted-foreground">
                        {' '}
                        · {EXPENSE_PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                        {' · '}
                        {new Date(p.payment_date).toLocaleDateString('es-DO')}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeletePayment(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handlePay} disabled={isSaving || expense.pending_amount <= 0}>
            {isSaving ? 'Guardando...' : 'Registrar Pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
