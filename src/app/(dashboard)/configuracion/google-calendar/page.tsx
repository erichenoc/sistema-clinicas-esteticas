'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Link2,
  Link2Off,
  Check,
  X,
  ExternalLink,
  Loader2,
  RefreshCw,
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
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  getGoogleCalendarAuthUrl,
  isGoogleCalendarConnected,
  disconnectGoogleCalendar,
} from '@/actions/google-calendar'

const BRAND_COLOR = '#A67C52'
const BRAND_HOVER_COLOR = '#8a6543'

interface ConnectionStatus {
  connected: boolean
  loading: boolean
}

export default function GoogleCalendarPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false, loading: true })
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const loadStatus = useCallback(async (uid: string) => {
    setStatus(prev => ({ ...prev, loading: true }))
    try {
      const connected = await isGoogleCalendarConnected(uid)
      setStatus({ connected, loading: false })
    } catch (error) {
      console.error('Error checking Google Calendar status:', error)
      setStatus({ connected: false, loading: false })
      toast.error('Error al verificar el estado de la conexion')
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        loadStatus(user.id)
      } else {
        setStatus({ connected: false, loading: false })
      }
    })
  }, [loadStatus])

  const handleConnect = async () => {
    if (!userId) {
      toast.error('No se pudo obtener el usuario actual')
      return
    }

    setIsConnecting(true)
    try {
      const authUrl = await getGoogleCalendarAuthUrl(userId)
      window.location.href = authUrl
    } catch (error) {
      console.error('Error getting Google Calendar auth URL:', error)
      toast.error('Error al iniciar la conexion con Google Calendar')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!userId) {
      toast.error('No se pudo obtener el usuario actual')
      return
    }

    setIsDisconnecting(true)
    toast.loading('Desconectando Google Calendar...', { id: 'disconnect-calendar' })

    try {
      const result = await disconnectGoogleCalendar(userId)
      toast.dismiss('disconnect-calendar')

      if (result.success) {
        toast.success('Google Calendar desconectado correctamente')
        setStatus({ connected: false, loading: false })
      } else {
        toast.error(result.error || 'Error al desconectar Google Calendar')
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error)
      toast.dismiss('disconnect-calendar')
      toast.error('Error al desconectar Google Calendar')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleRefresh = () => {
    if (userId) {
      loadStatus(userId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con boton de regreso */}
      <div className="flex items-center gap-4">
        <Link href="/configuracion">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Google Calendar</h1>
          <p className="text-muted-foreground">
            Sincroniza tus citas automaticamente con Google Calendar
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Estado de Conexion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Estado de Conexion
            </CardTitle>
            <CardDescription>
              Vincula tu cuenta de Google para sincronizar citas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Indicador de estado */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      status.loading
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : status.connected
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                    }`}
                  >
                    {status.loading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : status.connected ? (
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">Google Calendar</p>
                    {status.loading ? (
                      <p className="text-xs text-muted-foreground">Verificando...</p>
                    ) : (
                      <Badge
                        variant={status.connected ? 'default' : 'secondary'}
                        className={
                          status.connected
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100'
                            : ''
                        }
                      >
                        {status.connected ? 'Conectado' : 'No conectado'}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={status.loading}
                  aria-label="Actualizar estado de conexion"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${status.loading ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>
            </div>

            {/* Acciones */}
            <div className="space-y-3">
              {status.connected ? (
                <Button
                  variant="outline"
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting || status.loading}
                >
                  {isDisconnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Desconectando...
                    </>
                  ) : (
                    <>
                      <Link2Off className="mr-2 h-4 w-4" />
                      Desconectar
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full text-white transition-colors"
                  style={{ backgroundColor: BRAND_COLOR }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      BRAND_HOVER_COLOR
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = BRAND_COLOR
                  }}
                  onClick={handleConnect}
                  disabled={isConnecting || status.loading}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Link2 className="mr-2 h-4 w-4" />
                      Conectar Google Calendar
                    </>
                  )}
                </Button>
              )}

              <Button variant="outline" className="w-full" asChild>
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir Google Calendar
                </a>
              </Button>
            </div>

            {/* Nota de privacidad */}
            <p className="text-xs text-muted-foreground text-center">
              Solo se accede a tu calendario para crear, editar y eliminar eventos relacionados
              con tus citas. Ningun otro dato de tu cuenta de Google es accedido.
            </p>
          </CardContent>
        </Card>

        {/* Funcionalidades de la integracion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Que incluye esta integracion?
            </CardTitle>
            <CardDescription>
              Mantente al dia con tus citas en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-4" role="list">
              <li className="flex items-start gap-3">
                <div
                  className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${BRAND_COLOR}20` }}
                >
                  <Check className="h-3 w-3" style={{ color: BRAND_COLOR }} />
                </div>
                <div>
                  <p className="text-sm font-medium">Sincronizacion automatica de citas nuevas</p>
                  <p className="text-xs text-muted-foreground">
                    Cada cita creada en el sistema se agrega automaticamente a tu Google Calendar
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div
                  className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${BRAND_COLOR}20` }}
                >
                  <Check className="h-3 w-3" style={{ color: BRAND_COLOR }} />
                </div>
                <div>
                  <p className="text-sm font-medium">Actualizacion al reprogramar citas</p>
                  <p className="text-xs text-muted-foreground">
                    Si una cita cambia de fecha u hora, el evento en Google Calendar se actualiza
                    automaticamente
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div
                  className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${BRAND_COLOR}20` }}
                >
                  <Check className="h-3 w-3" style={{ color: BRAND_COLOR }} />
                </div>
                <div>
                  <p className="text-sm font-medium">Eliminacion al cancelar citas</p>
                  <p className="text-xs text-muted-foreground">
                    Cuando se cancela una cita, el evento correspondiente se elimina de tu
                    Google Calendar
                  </p>
                </div>
              </li>
            </ul>

            {/* Separador */}
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                La sincronizacion aplica unicamente al profesional que conecta su cuenta. Cada
                profesional debe conectar su propia cuenta de Google Calendar de forma individual.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instrucciones de uso */}
      <Card>
        <CardHeader>
          <CardTitle>Como funciona</CardTitle>
          <CardDescription>
            Pasos para conectar y usar Google Calendar con el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4" role="list">
            <li className="flex items-start gap-4">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                style={{ backgroundColor: BRAND_COLOR }}
                aria-hidden="true"
              >
                1
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-medium">Conecta tu cuenta de Google</p>
                <p className="text-xs text-muted-foreground">
                  Haz clic en "Conectar Google Calendar" y autoriza el acceso a tu cuenta de
                  Google. Seras redirigido a Google para completar la autorizacion.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                style={{ backgroundColor: BRAND_COLOR }}
                aria-hidden="true"
              >
                2
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-medium">Crea y gestiona citas desde el sistema</p>
                <p className="text-xs text-muted-foreground">
                  Una vez conectado, todas las citas que crees o modifiques en la agenda del
                  sistema se reflejaran automaticamente en tu Google Calendar.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                style={{ backgroundColor: BRAND_COLOR }}
                aria-hidden="true"
              >
                3
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-medium">Recibe recordatorios en tu dispositivo</p>
                <p className="text-xs text-muted-foreground">
                  Google Calendar enviara notificaciones y recordatorios de tus citas
                  directamente a tu telefono y computadora.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
