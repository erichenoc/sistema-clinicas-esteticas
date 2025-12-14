'use client'

import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  Package,
  Calendar,
  DollarSign,
  FileText,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import {
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert,
  generateInventoryAlerts,
  type Alert,
  type AlertPriority,
} from '@/actions/alerts'

const priorityConfig: Record<AlertPriority, { color: string; bg: string; label: string }> = {
  critical: { color: 'text-red-600', bg: 'bg-red-100', label: 'Critico' },
  high: { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Alto' },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Medio' },
  low: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Bajo' },
}

const typeIcons: Record<string, React.ReactNode> = {
  stock_low: <Package className="h-5 w-5" />,
  stock_critical: <Package className="h-5 w-5" />,
  product_expiring: <Package className="h-5 w-5" />,
  product_expired: <Package className="h-5 w-5" />,
  appointment_reminder: <Calendar className="h-5 w-5" />,
  appointment_cancelled: <Calendar className="h-5 w-5" />,
  payment_pending: <DollarSign className="h-5 w-5" />,
  payment_overdue: <DollarSign className="h-5 w-5" />,
  commission_pending: <DollarSign className="h-5 w-5" />,
  document_expiring: <FileText className="h-5 w-5" />,
  consent_expiring: <FileText className="h-5 w-5" />,
  system: <Bell className="h-5 w-5" />,
}

interface AlertsPanelProps {
  showTrigger?: boolean
}

export function AlertsPanel({ showTrigger = true }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadAlerts = async () => {
    try {
      const data = await getAlerts({ limit: 50 })
      setAlerts(data)
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAlerts()
    setIsRefreshing(false)
    toast.success('Alertas actualizadas')
  }

  const handleGenerateAlerts = async () => {
    setIsRefreshing(true)
    toast.loading('Verificando inventario...', { id: 'generate-alerts' })

    try {
      const count = await generateInventoryAlerts()
      toast.dismiss('generate-alerts')

      if (count > 0) {
        toast.success(`Se generaron ${count} nuevas alertas`)
      } else {
        toast.info('No se encontraron nuevas alertas')
      }

      await loadAlerts()
    } catch (error) {
      toast.dismiss('generate-alerts')
      toast.error('Error al verificar alertas')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleAcknowledge = async (alertId: string) => {
    const result = await acknowledgeAlert(alertId, 'current-user')
    if (result.success) {
      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, status: 'acknowledged' as const } : a
      ))
      toast.success('Alerta marcada como vista')
    }
  }

  const handleResolve = async (alertId: string) => {
    const result = await resolveAlert(alertId)
    if (result.success) {
      setAlerts(prev => prev.filter(a => a.id !== alertId))
      toast.success('Alerta resuelta')
    }
  }

  const handleDismiss = async (alertId: string) => {
    const result = await dismissAlert(alertId)
    if (result.success) {
      setAlerts(prev => prev.filter(a => a.id !== alertId))
      toast.success('Alerta descartada')
    }
  }

  const criticalCount = alerts.filter(a => a.priority === 'critical' && a.status === 'active').length
  const highCount = alerts.filter(a => a.priority === 'high' && a.status === 'active').length
  const activeCount = alerts.filter(a => a.status === 'active').length

  const alertsContent = (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-red-50">
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          <p className="text-xs text-red-600">Criticas</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-orange-50">
          <p className="text-2xl font-bold text-orange-600">{highCount}</p>
          <p className="text-xs text-orange-600">Altas</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-blue-50">
          <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
          <p className="text-xs text-blue-600">Activas</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Actualizar</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleGenerateAlerts}
          disabled={isRefreshing}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Verificar
        </Button>
      </div>

      <Separator />

      {/* Alerts List */}
      <ScrollArea className="h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay alertas activas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => {
              const config = priorityConfig[alert.priority]

              return (
                <Card key={alert.id} className={alert.status === 'acknowledged' ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg ${config.bg} flex items-center justify-center ${config.color}`}>
                        {typeIcons[alert.type] || <Bell className="h-5 w-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${config.bg} ${config.color} border-0`}>
                            {config.label}
                          </Badge>
                          {alert.status === 'acknowledged' && (
                            <Badge variant="outline" className="text-xs">Vista</Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.createdAt).toLocaleString('es-DO')}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        {alert.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleAcknowledge(alert.id)}
                            title="Marcar como vista"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleResolve(alert.id)}
                          title="Resolver"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDismiss(alert.id)}
                          title="Descartar"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    {alert.link && (
                      <Button variant="link" size="sm" className="mt-2 p-0 h-auto" asChild>
                        <a href={alert.link}>
                          Ver detalles
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )

  if (!showTrigger) {
    return alertsContent
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-medium">
              {activeCount > 99 ? '99+' : activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Centro de Alertas
          </SheetTitle>
          <SheetDescription>
            Gestiona las alertas y notificaciones del sistema
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {alertsContent}
        </div>
      </SheetContent>
    </Sheet>
  )
}
