'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  RefreshCw,
  Save,
  History,
  TrendingUp,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  getCurrentExchangeRate,
  saveExchangeRate,
  getExchangeRateHistory,
  type CurrencyConversion,
  type ExchangeRate,
} from '@/actions/exchange-rates'
import { CurrencyConverter } from '@/components/currency/currency-converter'

export default function TasasCambioPage() {
  const [currentRate, setCurrentRate] = useState<CurrencyConversion | null>(null)
  const [history, setHistory] = useState<ExchangeRate[]>([])
  const [newRate, setNewRate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rate, rateHistory] = await Promise.all([
        getCurrentExchangeRate('USD', 'DOP'),
        getExchangeRateHistory('USD', 'DOP', 10),
      ])
      setCurrentRate(rate)
      setHistory(rateHistory)
      if (rate) {
        setNewRate(rate.rate.toString())
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar las tasas de cambio')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveRate = async () => {
    const rate = parseFloat(newRate)
    if (isNaN(rate) || rate <= 0) {
      toast.error('Por favor ingresa una tasa valida')
      return
    }

    setSaving(true)
    toast.loading('Guardando tasa de cambio...', { id: 'save-rate' })

    try {
      const result = await saveExchangeRate({
        fromCurrency: 'USD',
        toCurrency: 'DOP',
        rate,
        source: 'manual',
      })

      toast.dismiss('save-rate')

      if (result.success) {
        toast.success('Tasa de cambio actualizada')
        await loadData()
      } else {
        toast.error(result.error || 'Error al guardar la tasa')
      }
    } catch (error) {
      toast.dismiss('save-rate')
      toast.error('Error al guardar la tasa de cambio')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
          <h1 className="text-3xl font-bold">Tasas de Cambio</h1>
          <p className="text-muted-foreground">
            Administra las tasas de cambio USD/DOP para cotizaciones y cobros
          </p>
        </div>
      </div>

      {/* Alert informativo */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          La tasa de cambio se utiliza para convertir automaticamente entre dolares (USD) y pesos dominicanos (DOP)
          en cotizaciones y pagos. Actualiza la tasa diariamente para mantener precios precisos.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasa Actual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Tasa Actual
            </CardTitle>
            <CardDescription>
              Configurar la tasa de cambio del dia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tasa actual mostrada */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">1 USD =</p>
                  <p className="text-3xl font-bold">
                    RD${currentRate?.rate.toFixed(2) || '...'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={currentRate?.source === 'api' ? 'default' : 'secondary'}>
                    {currentRate?.source === 'api' ? 'API' : 'Manual'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentRate ? formatDate(currentRate.effectiveDate) : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Input para nueva tasa */}
            <div className="space-y-3">
              <Label htmlFor="new-rate">Nueva Tasa de Cambio</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    RD$
                  </span>
                  <Input
                    id="new-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="pl-12"
                    placeholder="60.50"
                  />
                </div>
                <Button onClick={handleSaveRate} disabled={saving || loading}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ingresa la tasa de cambio del dia (cuantos pesos por 1 dolar)
              </p>
            </div>

            {/* Botón refresh */}
            <Button
              variant="outline"
              className="w-full"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </CardContent>
        </Card>

        {/* Calculadora */}
        <CurrencyConverter showCard={true} compact={false} />
      </div>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Tasas
          </CardTitle>
          <CardDescription>
            Ultimas tasas de cambio registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay historial de tasas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Efectiva</TableHead>
                  <TableHead>Tasa (RD$ por USD)</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Registrado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(rate.effective_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-medium">
                        RD${Number(rate.rate).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rate.source === 'api' ? 'default' : 'secondary'}>
                        {rate.source === 'api' ? 'API' : 'Manual'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(rate.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Información sobre APIs */}
      <Card>
        <CardHeader>
          <CardTitle>Configuracion de API (Opcional)</CardTitle>
          <CardDescription>
            Para obtener tasas automaticamente, configura una API key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">ExchangeRate-API</p>
                <p className="text-sm text-muted-foreground">
                  1,500 requests/mes gratis - Incluye DOP
                </p>
              </div>
              <Badge variant="outline">Recomendado</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Para activar la actualizacion automatica, agrega la variable de entorno{' '}
              <code className="bg-muted px-1 rounded">EXCHANGE_RATE_API_KEY</code> con tu API key.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://www.exchangerate-api.com/" target="_blank" rel="noopener noreferrer">
                Obtener API Key Gratis
              </a>
            </Button>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div>
              <p className="font-medium">Open Exchange Rates</p>
              <p className="text-sm text-muted-foreground">
                1,000 requests/mes gratis - Alternativa
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Variable de entorno:{' '}
              <code className="bg-muted px-1 rounded">OPEN_EXCHANGE_RATES_API_KEY</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
