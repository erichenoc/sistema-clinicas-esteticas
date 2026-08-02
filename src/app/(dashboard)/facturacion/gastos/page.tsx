export const dynamic = 'force-dynamic'

import { getExpenses } from '@/actions/expenses'
import { getCashFlowSummary, getExpenseStats } from '@/actions/cashflow'
import type { CashFlowPeriod } from '@/actions/cashflow'
import { GastosClient } from './_components/gastos-client'

export const metadata = {
  title: 'Gastos y Proveedores',
}

const VALID_PERIODS: CashFlowPeriod[] = ['month', 'quarter', 'year', 'all']

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo } = await searchParams
  const period: CashFlowPeriod = VALID_PERIODS.includes(periodo as CashFlowPeriod)
    ? (periodo as CashFlowPeriod)
    : 'month'

  const [expensesRes, cashFlowRes, statsRes] = await Promise.all([
    getExpenses(),
    getCashFlowSummary(period),
    getExpenseStats(),
  ])

  return (
    <GastosClient
      expenses={expensesRes.data}
      cashFlow={cashFlowRes.data}
      stats={statsRes.data}
      period={period}
      accessError={expensesRes.error}
    />
  )
}
