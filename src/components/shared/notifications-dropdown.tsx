'use client'

import { useEffect, useState, useTransition } from 'react'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from '@/actions/notifications'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'appointment_new':
    case 'appointment_reminder':
      return '📅'
    case 'appointment_cancelled':
      return '❌'
    case 'stock_low':
      return '📦'
    case 'quotation_sent':
    case 'quotation_accepted':
    case 'quotation_rejected':
    case 'quotation_expiring':
      return '📋'
    case 'invoice_created':
    case 'payment_received':
      return '💰'
    default:
      return '🔔'
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'text-red-600'
    case 'high':
      return 'text-orange-600'
    default:
      return 'text-[#3d3d3d]'
  }
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        getNotifications({ limit: 10 }),
        getUnreadNotificationCount(),
      ])
      setNotifications(notifs)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      await markNotificationAsRead(id)
      await loadNotifications()
    })
  }

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      await markAllNotificationsAsRead()
      await loadNotifications()
    })
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es,
      })
    } catch {
      return ''
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-xl text-[#998577] hover:text-[#A67C52] hover:bg-[#A67C52]/10"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-0.5 -top-0.5 h-5 w-5 rounded-full p-0 text-[10px] bg-[#e8a0c0] text-white border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-96 rounded-xl border-[#e8e4df] shadow-luxury-lg max-h-[500px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-2">
          <DropdownMenuLabel className="font-display text-[#3d3d3d] p-0">
            Notificaciones
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-[#A67C52] hover:text-[#8a6543] hover:bg-[#A67C52]/10"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="bg-[#e8e4df]" />

        <div className="max-h-[350px] overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-[#998577]">
              <div className="animate-pulse">Cargando...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-[#998577]">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-[#f5f3f0] transition-colors ${
                  !notification.is_read ? 'bg-[#A67C52]/5' : ''
                }`}
              >
                <span className="text-lg mt-0.5">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      className={`font-medium text-sm block truncate hover:underline ${getPriorityColor(notification.priority)}`}
                      onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                    >
                      {notification.title}
                    </Link>
                  ) : (
                    <span className={`font-medium text-sm block truncate ${getPriorityColor(notification.priority)}`}>
                      {notification.title}
                    </span>
                  )}
                  <p className="text-sm text-[#998577] truncate">
                    {notification.message}
                  </p>
                  <p className="text-xs text-[#998577]/70 mt-1">
                    {formatTime(notification.created_at)}
                  </p>
                </div>
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-[#998577] hover:text-[#A67C52] hover:bg-[#A67C52]/10 flex-shrink-0"
                    onClick={() => handleMarkAsRead(notification.id)}
                    disabled={isPending}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-[#e8e4df]" />
            <Link href="/notificaciones">
              <DropdownMenuItem className="text-center py-3 text-[#A67C52] hover:text-[#8a6543] cursor-pointer hover:bg-[#A67C52]/5 justify-center">
                Ver todas las notificaciones
              </DropdownMenuItem>
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
