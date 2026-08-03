export const dynamic = 'force-dynamic'

import { getExpenses } from '@/actions/expenses'
import { getCashFlowSummary, getExpenseStats, getIncomeDetail } from '@/actions/cashflow'
import type { CashFlowPeriod } from '@/actions/cashflow'
import { getRecurringExpenses } from '@/actions/recurring-expenses'
import { GastosClient } from './_components/gastos-client'

export const metadata = {
  title: 'Gastos y Proveedores',
}

const SHORTCUTS: CashFlowPeriod[] = ['month', 'quarter', 'year', 'all']
const MONTH_PATTERN = /^\d{4}-\d{2}$/

/** Mes actual en formato 'YYYY-MM' */
function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo } = await searchParams
  const isValid =
    periodo && (SHORTCUTS.includes(periodo as CashFlowPeriod) || MONTH_PATTERN.test(periodo))
  const period: CashFlowPeriod = isValid ? (periodo as CashFlowPeriod) : 'month'

  // Los gastos fijos se consultan contra un mes concreto; para los atajos se
  // usa el mes en curso
  const recurringPeriod = MONTH_PATTERN.test(period) ? period : currentMonth()

  const [expensesRes, cashFlowRes, statsRes, recurringRes, incomeRes] = await Promise.all([
    getExpenses(MONTH_PATTERN.test(period) ? { period } : undefined),
    getCashFlowSummary(period),
    getExpenseStats(period),
    getRecurringExpenses(recurringPeriod),
    getIncomeDetail(period),
  ])

  return (
    <GastosClient
      expenses={expensesRes.data}
      cashFlow={cashFlowRes.data}
      stats={statsRes.data}
      period={period}
      recurring={recurringRes.data}
      recurringPeriod={recurringPeriod}
      income={incomeRes.data}
      accessError={expensesRes.error}
    />
  )
}
