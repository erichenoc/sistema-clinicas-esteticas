'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Calendar,
  Package,
  FileText,
  DollarSign,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
} from '@/actions/notifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

function getNotificationIcon(type: string) {
  switch (type) {
    case 'appointment_new':
    case 'appointment_reminder':
      return <Calendar className="h-5 w-5 text-blue-500" />
    case 'appointment_cancelled':
      return <AlertCircle className="h-5 w-5 text-red-500" />
    case 'stock_low':
      return <Package className="h-5 w-5 text-amber-500" />
    case 'quotation_sent':
    case 'quotation_accepted':
    case 'quotation_rejected':
    case 'quotation_expiring':
      return <FileText className="h-5 w-5 text-purple-500" />
    case 'invoice_created':
    case 'payment_received':
      return <DollarSign className="h-5 w-5 text-green-500" />
    default:
      return <Bell className="h-5 w-5 text-[#A67C52]" />
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'urgent':
      return <Badge variant="destructive">Urgente</Badge>
    case 'high':
      return <Badge className="bg-amber-500">Alta</Badge>
    case 'normal':
      return <Badge variant="secondary">Normal</Badge>
    case 'low':
      return <Badge variant="outline">Baja</Badge>
    default:
      return null
  }
}

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    loadNotifications()
  }, [filter])

  async function loadNotifications() {
    setIsLoading(true)
    try {
      const data = await getNotifications({
        unreadOnly: filter === 'unread',
        limit: 100,
      })
      setNotifications(data)
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Error al cargar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMarkAsRead(id: string) {
    startTransition(async () => {
      const result = await markNotificationAsRead(id)
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        )
      }
    })
  }

  async function handleMarkAllAsRead() {
    startTransition(async () => {
      const result = await markAllNotificationsAsRead()
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        toast.success('Todas las notificaciones marcadas como leidas')
      }
    })
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteNotification(id)
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== id))
        toast.success('Notificacion eliminada')
      }
    })
  }

  const filteredNotifications = notifications.filter(n => {
    if (typeFilter === 'all') return true
    return n.type.startsWith(typeFilter)
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} notificaciones sin leer`
                : 'Todas las notificaciones leidas'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleMarkAllAsRead}
          disabled={isPending || unreadCount === 0}
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Marcar todas como leidas
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="unread">
                  Sin leer
                  {unreadCount > 0 && (
                    <Badge className="ml-2 bg-[#A67C52]">{unreadCount}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="appointment">Citas</SelectItem>
                <SelectItem value="stock">Inventario</SelectItem>
                <SelectItem value="quotation">Cotizaciones</SelectItem>
                <SelectItem value="invoice">Facturas</SelectItem>
                <SelectItem value="payment">Pagos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Notificaciones</CardTitle>
          <CardDescription>
            Todas tus notificaciones recientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#A67C52]" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay notificaciones</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    notification.is_read
                      ? 'bg-background'
                      : 'bg-[#A67C52]/5 border-[#A67C52]/20'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {getPriorityBadge(notification.priority)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                      {notification.link && (
                        <Link
                          href={notification.link}
                          className="text-[#A67C52] hover:underline"
                        >
                          Ver detalles
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(notification.id)}
                      disabled={isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
