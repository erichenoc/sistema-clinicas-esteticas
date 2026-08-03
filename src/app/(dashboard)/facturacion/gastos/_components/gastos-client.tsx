'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Search,
  CreditCard,
  Trash2,
  MoreHorizontal,
  TrendingUp,
  Repeat,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { formatCurrency } from '@/types/billing'
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from '@/types/expenses'
import type { ExpenseCategoryKey } from '@/types/expenses'
import { deleteExpense } from '@/actions/expenses'
import type { ExpenseListItem, CashFlowSummary, ExpenseStats } from '@/actions/expenses'
import type { CashFlowPeriod, IncomeDetail } from '@/actions/cashflow'
import { recentPeriods, formatDayMonth } from '@/lib/periods'
import { generateRecurringExpenses } from '@/actions/recurring-expenses'
import type { RecurringExpenseData } from '@/actions/recurring-expenses'
import { NuevoGastoDialog } from './nuevo-gasto-dialog'
import { GastosFijosDialog } from './gastos-fijos-dialog'
import { FacturacionMes } from './facturacion-mes'
import { PagarGastoDialog } from './pagar-gasto-dialog'

type StatusTab = 'all' | 'pending' | 'overdue' | 'paid'

interface GastosClientProps {
  expenses: ExpenseListItem[]
  cashFlow: CashFlowSummary | null
  stats: ExpenseStats | null
  period: CashFlowPeriod
  recurring: RecurringExpenseData[]
  recurringPeriod: string
  income: IncomeDetail | null
  accessError: string | null
}

export function GastosClient({
  expenses,
  cashFlow,
  stats,
  period,
  recurring,
  recurringPeriod,
  income,
  accessError,
}: GastosClientProps) {
  const monthOptions = recentPeriods()
  const SHORTCUT_LABELS: Record<string, string> = {
    month: 'Este mes',
    quarter: 'Este trimestre',
    year: 'Este año',
    all: 'Histórico',
  }
  const periodLabel =
    SHORTCUT_LABELS[period] ?? monthOptions.find((m) => m.value === period)?.label ?? 'Este mes'
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [tab, setTab] = useState<StatusTab>('all')
  // Vista principal: lo que se paga o lo que se factura
  const [view, setView] = useState<'gastos' | 'facturacion'>('gastos')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [payingExpense, setPayingExpense] = useState<ExpenseListItem | null>(null)
  const [payDialogOpen, setPayDialogOpen] = useState(false)

  // Los datos vienen del servidor: refrescar la ruta los vuelve a pedir
  const loadData = () => startTransition(() => router.refresh())

  const handlePeriodChange = (value: string) => {
    startTransition(() => router.push(`/facturacion/gastos?periodo=${value}`))
  }

  // Gastos fijos del mes que todavia no se han registrado
  const pendingRecurring = recurring.filter((r) => r.is_active && !r.generated_this_period)

  const handleGenerateRecurring = async () => {
    const { created, error } = await generateRecurringExpenses(recurringPeriod)
    if (error) {
      toast.error(error)
      return
    }
    toast.success(
      created === 1 ? '1 gasto fijo registrado' : `${created} gastos fijos registrados`
    )
    loadData()
  }

  const handleDelete = async (expense: ExpenseListItem) => {
    if (!confirm(`Eliminar el gasto ${expense.expense_number}? Esta accion no se puede deshacer.`)) {
      return
    }
    const { error } = await deleteExpense(expense.id)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Gasto eliminado')
    loadData()
  }

  const filtered = expenses.filter((e) => {
    if (tab === 'pending' && (e.pending_amount <= 0 || e.days_overdue > 0)) return false
    if (tab === 'overdue' && e.days_overdue <= 0) return false
    if (tab === 'paid' && e.status !== 'paid') return false
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false
    if (search) {
      const term = search.toLowerCase()
      const haystack = `${e.supplier_display_name} ${e.concept} ${e.expense_number} ${e.supplier_invoice_number || ''}`
      if (!haystack.toLowerCase().includes(term)) return false
    }
    return true
  })

  const overdueCount = expenses.filter((e) => e.days_overdue > 0).length

  const getStatusBadge = (expense: ExpenseListItem) => {
    if (expense.status === 'cancelled') return <Badge variant="outline">Anulado</Badge>
    if (expense.days_overdue > 0) {
      return <Badge className="bg-red-500">Vencido ({expense.days_overdue}d)</Badge>
    }
    if (expense.status === 'paid') return <Badge className="bg-green-500">Pagado</Badge>
    if (expense.status === 'partial') return <Badge className="bg-blue-500">Abonado</Badge>
    return <Badge className="bg-yellow-500">Pendiente</Badge>
  }

  if (accessError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acceso restringido</AlertTitle>
        <AlertDescription>{accessError}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facturacion">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gastos y Proveedores</h1>
            <p className="text-muted-foreground">
              Lo que paga la clínica y cuánto dinero queda realmente
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[160px]">
              {/* Se pasa el texto explicito: en SSR el Select no puede resolver
                  la etiqueta del item y el contenido no coincidiria al hidratar */}
              <SelectValue>{periodLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
              <SelectItem value="all">Histórico</SelectItem>
              {/* Meses cerrados, para revisar lo que paso antes */}
              {monthOptions.slice(1).map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <GastosFijosDialog recurring={recurring} periodLabel={cashFlow?.period_label || ''} />
          <NuevoGastoDialog onCreated={loadData} />
        </div>
      </div>

      {/* Los fijos del mes que faltan por registrar: un clic los crea todos */}
      {pendingRecurring.length > 0 && (
        <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950">
          <Repeat className="h-4 w-4" />
          <AlertTitle>
            {pendingRecurring.length === 1
              ? 'Tienes 1 gasto fijo sin registrar este mes'
              : `Tienes ${pendingRecurring.length} gastos fijos sin registrar este mes`}
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {pendingRecurring.map((r) => r.concept).join(', ')} ·{' '}
              {formatCurrency(pendingRecurring.reduce((sum, r) => sum + r.amount, 0))}
            </span>
            <Button size="sm" onClick={handleGenerateRecurring} disabled={isPending}>
              Registrarlos
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Flujo de caja */}
      {cashFlow && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Flujo de caja</CardTitle>
            <CardDescription>{cashFlow.period_label}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowDownCircle className="h-4 w-4 text-green-600" />
                  Entró (cobrado)
                </div>
                <p className="mt-1 text-xl font-bold text-green-600 break-words">
                  {formatCurrency(cashFlow.income)}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowUpCircle className="h-4 w-4 text-red-600" />
                  Salió (pagado)
                </div>
                <p className="mt-1 text-xl font-bold text-red-600 break-words">
                  {formatCurrency(cashFlow.expenses)}
                </p>
              </div>
              <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  Queda
                </div>
                <p
                  className={`mt-1 text-xl font-bold break-words ${
                    cashFlow.balance >= 0 ? 'text-primary' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(cashFlow.balance)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
              <div className="flex justify-between rounded-md bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Por cobrar</span>
                <span className="font-medium">{formatCurrency(cashFlow.pending_to_collect)}</span>
              </div>
              <div className="flex justify-between rounded-md bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Por pagar</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(cashFlow.pending_to_pay)}
                </span>
              </div>
              <div className="flex justify-between rounded-md bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Proyectado
                </span>
                <span className="font-medium">{formatCurrency(cashFlow.projected_balance)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats de gastos */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total por pagar</CardDescription>
              <CardTitle className="text-lg sm:text-2xl break-words">{formatCurrency(stats.total_pending)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {stats.pending_count} gastos pendientes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Vencido
              </CardDescription>
              <CardTitle className="text-lg sm:text-2xl text-red-600 break-words">
                {formatCurrency(stats.total_overdue)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stats.overdue_count} gastos vencidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pagado este mes</CardDescription>
              <CardTitle className="text-lg sm:text-2xl text-primary break-words">
                {formatCurrency(stats.paid_this_month)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {stats.paid_count_this_month} pagos realizados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Por categoria */}
      {stats && stats.by_category.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Gastos por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.by_category.map((c) => (
                <div key={c.category} className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">
                    {EXPENSE_CATEGORY_LABELS[c.category] || c.category}
                  </p>
                  <p className="text-lg font-bold">{formatCurrency(c.total)}</p>
                  {c.pending > 0 && (
                    <p className="text-xs text-red-600">
                      {formatCurrency(c.pending)} pendiente
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Que se mira: lo que se paga o lo que se factura */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'gastos' | 'facturacion')}>
        <TabsList>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
          <TabsTrigger value="facturacion">Facturación</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === 'facturacion' && <FacturacionMes income={income} />}

      {view === 'gastos' && (
      <>
      {/* Tabs + filtros */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="overdue">
            Vencidos
            {overdueCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {overdueCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">Por pagar</TabsTrigger>
          <TabsTrigger value="paid">Pagados</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por proveedor, concepto o número..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue>
              {categoryFilter === 'all'
                ? 'Todas las categorías'
                : EXPENSE_CATEGORY_LABELS[categoryFilter as ExpenseCategoryKey] || categoryFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {EXPENSE_CATEGORIES.map((c) => (
              <SelectItem key={c.key} value={c.key}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Actualizando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {expenses.length === 0
                      ? 'Aún no hay gastos registrados. Agrega el primero con "Nuevo Gasto".'
                      : 'Ningún gasto coincide con el filtro.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <p className="font-medium">{expense.supplier_display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {expense.expense_number}
                        {expense.supplier_invoice_number && ` · ${expense.supplier_invoice_number}`}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <p className="truncate">{expense.concept}</p>
                      {expense.subcategory && (
                        <p className="text-xs text-muted-foreground">{expense.subcategory}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {EXPENSE_CATEGORY_LABELS[expense.category] || expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(expense.total)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {expense.pending_amount > 0 ? (
                        <span className="text-red-600">
                          {formatCurrency(expense.pending_amount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDayMonth(expense.due_date)}
                    </TableCell>
                    <TableCell>{getStatusBadge(expense)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={expense.pending_amount <= 0}
                            onClick={() => {
                              setPayingExpense(expense)
                              setPayDialogOpen(true)
                            }}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Registrar pago
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(expense)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      </>
      )}

      <PagarGastoDialog
        expense={payingExpense}
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
        onPaid={loadData}
      />

      <p className="text-xs text-muted-foreground">
        El flujo de caja cuenta el dinero cuando se mueve: solo cobros y pagos reales.
        Lo facturado sin cobrar aparece aparte como &quot;Por cobrar&quot;.
      </p>
    </div>
  )
}
