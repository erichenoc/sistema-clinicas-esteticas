'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ShieldAlert,
  Trash2,
  FileText,
  User,
  Calendar,
  Receipt,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { DeletedInvoiceAuditEntry } from '@/actions/billing'

interface AuditoriaClientProps {
  entries: DeletedInvoiceAuditEntry[]
  authorized: boolean
}

function formatMoney(amount: number | null, currency: string | null): string {
  if (amount == null) return '-'
  const symbol = currency === 'USD' ? 'US$' : 'RD$'
  return `${symbol}${amount.toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ActionBadge({ action }: { action: DeletedInvoiceAuditEntry['action'] }) {
  if (action === 'delete_invoice') {
    return (
      <Badge variant="destructive" className="gap-1">
        <Trash2 className="h-3 w-3" />
        Eliminada
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Ban className="h-3 w-3" />
      Anulada
    </Badge>
  )
}

export function AuditoriaClient({ entries, authorized }: AuditoriaClientProps) {
  const [selected, setSelected] = useState<DeletedInvoiceAuditEntry | null>(null)

  if (!authorized) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/configuracion">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Auditoria</h1>
        </div>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            No tienes permiso para ver esta seccion. Solo administradores pueden consultar el
            historial de auditoria de facturas.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/configuracion">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Auditoria de Facturas</h1>
          <p className="text-muted-foreground">
            Historial de facturas eliminadas y anuladas
          </p>
        </div>
      </div>

      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          Aqui queda registrado quien elimino o anulo cada factura, cuando, y una copia de su
          contenido. Las facturas eliminadas se borran de forma permanente junto con sus items y
          pagos; las anuladas permanecen pero se excluyen de las estadisticas.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Registro de Auditoria
          </CardTitle>
          <CardDescription>
            {entries.length} {entries.length === 1 ? 'registro' : 'registros'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay registros de auditoria</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Accion</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <ActionBadge action={entry.action} />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{entry.invoice_number || 'Sin numero'}</div>
                      {entry.ncf && (
                        <div className="text-xs text-muted-foreground">NCF: {entry.ncf}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatMoney(entry.total, entry.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {entry.deleted_by_name || 'Usuario desconocido'}
                      </div>
                      {entry.deleted_by_email && (
                        <div className="text-xs text-muted-foreground">{entry.deleted_by_email}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(entry.deleted_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(entry)}>
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detalle */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Factura {selected?.invoice_number || 'sin numero'}
              {selected && <ActionBadge action={selected.action} />}
            </DialogTitle>
            <DialogDescription>
              Detalle del registro de auditoria
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Eliminada por</p>
                    <p className="font-medium">{selected.deleted_by_name || 'Desconocido'}</p>
                    {selected.deleted_by_email && (
                      <p className="text-xs text-muted-foreground">{selected.deleted_by_email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha</p>
                    <p className="font-medium">{formatDateTime(selected.deleted_at)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Numero</span>
                  <span className="font-medium">{selected.invoice_number || '-'}</span>
                </div>
                {selected.ncf && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">NCF</span>
                    <span className="font-medium">{selected.ncf}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estado al eliminar</span>
                  <Badge variant="secondary">{selected.status || '-'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fecha de emision</span>
                  <span className="font-medium">{selected.issue_date || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-mono font-semibold">
                    {formatMoney(selected.total, selected.currency)}
                  </span>
                </div>
              </div>

              {selected.reason && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Motivo</p>
                  <p>{selected.reason}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Receipt className="h-4 w-4" />
                  {selected.items_count} items
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {selected.payments_count} pagos
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
