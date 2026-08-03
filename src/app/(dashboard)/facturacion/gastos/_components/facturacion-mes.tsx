'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/types/billing'
import type { IncomeDetail } from '@/actions/cashflow'
import { formatDayMonth } from '@/lib/periods'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  check: 'Cheque',
  other: 'Otro',
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pagada',
  partial: 'Abonada',
  pending: 'Pendiente',
  overdue: 'Vencida',
}

export function FacturacionMes({ income }: { income: IncomeDetail | null }) {
  if (!income) return null

  const { invoices, payments } = income

  return (
    <div className="space-y-4">
      {/* Resumen del mes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Facturado</CardDescription>
            <CardTitle className="text-lg sm:text-2xl break-words">
              {formatCurrency(income.totalInvoiced)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {invoices.length} {invoices.length === 1 ? 'factura emitida' : 'facturas emitidas'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cobrado</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-primary break-words">
              {formatCurrency(income.totalCollected)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {payments.length} {payments.length === 1 ? 'cobro recibido' : 'cobros recibidos'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Falta cobrar</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-red-600 break-words">
              {formatCurrency(income.pendingFromPeriod)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">de las facturas del período</p>
          </CardContent>
        </Card>
      </div>

      {/* Facturas emitidas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Facturas emitidas</CardTitle>
          <CardDescription>Lo que se facturó en el período</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Factura</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Pendiente</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                      No se emitieron facturas en este período
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <Link
                          href={`/facturacion/facturas/${inv.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">{inv.patientName}</TableCell>
                      <TableCell>{formatDayMonth(inv.issueDate)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(inv.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {inv.pendingAmount > 0 ? (
                          <span className="text-red-600">{formatCurrency(inv.pendingAmount)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {inv.status === 'paid' ? (
                          <Badge className="bg-green-500">Pagada</Badge>
                        ) : inv.status === 'partial' ? (
                          <Badge className="bg-blue-500">Abonada</Badge>
                        ) : (
                          <Badge className="bg-yellow-500">
                            {STATUS_LABELS[inv.status] || inv.status}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cobros recibidos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Cobros recibidos</CardTitle>
          <CardDescription>
            El dinero que entró en el período, aunque la factura sea de antes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                      No se recibieron cobros en este período
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDayMonth(p.paymentDate)}</TableCell>
                      <TableCell>{p.invoiceNumber}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{p.patientName}</TableCell>
                      <TableCell>{METHOD_LABELS[p.method] || p.method}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(p.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
