'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRightLeft, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentExchangeRate, type CurrencyConversion } from '@/actions/exchange-rates'

interface CurrencyConverterProps {
  onConversion?: (result: {
    usdAmount: number
    dopAmount: number
    rate: number
  }) => void
  defaultAmount?: number
  showCard?: boolean
  compact?: boolean
}

export function CurrencyConverter({
  onConversion,
  defaultAmount = 0,
  showCard = true,
  compact = false,
}: CurrencyConverterProps) {
  const [usdAmount, setUsdAmount] = useState<string>(defaultAmount.toString())
  const [dopAmount, setDopAmount] = useState<string>('0')
  const [rate, setRate] = useState<CurrencyConversion | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastField, setLastField] = useState<'usd' | 'dop'>('usd')

  const loadRate = useCallback(async () => {
    setLoading(true)
    const currentRate = await getCurrentExchangeRate('USD', 'DOP')
    setRate(currentRate)
    setLoading(false)
    return currentRate
  }, [])

  useEffect(() => {
    loadRate()
  }, [loadRate])

  // Recalcular cuando cambia la tasa
  useEffect(() => {
    if (rate) {
      if (lastField === 'usd') {
        const usd = parseFloat(usdAmount) || 0
        const dop = usd * rate.rate
        setDopAmount(dop.toFixed(2))
        onConversion?.({ usdAmount: usd, dopAmount: dop, rate: rate.rate })
      } else {
        const dop = parseFloat(dopAmount) || 0
        const usd = dop / rate.rate
        setUsdAmount(usd.toFixed(2))
        onConversion?.({ usdAmount: usd, dopAmount: dop, rate: rate.rate })
      }
    }
  }, [rate, usdAmount, dopAmount, lastField, onConversion])

  const handleUsdChange = (value: string) => {
    setUsdAmount(value)
    setLastField('usd')
    if (rate) {
      const usd = parseFloat(value) || 0
      const dop = usd * rate.rate
      setDopAmount(dop.toFixed(2))
      onConversion?.({ usdAmount: usd, dopAmount: dop, rate: rate.rate })
    }
  }

  const handleDopChange = (value: string) => {
    setDopAmount(value)
    setLastField('dop')
    if (rate) {
      const dop = parseFloat(value) || 0
      const usd = dop / rate.rate
      setUsdAmount(usd.toFixed(2))
      onConversion?.({ usdAmount: usd, dopAmount: dop, rate: rate.rate })
    }
  }

  const content = (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Tasa actual */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Tasa del dia: <span className="font-medium text-foreground">1 USD = RD${rate?.rate.toFixed(2) || '...'}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadRate}
          disabled={loading}
          className="h-7 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Campos de conversion */}
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="usd-amount" className="text-xs">
            Dolares (USD)
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="usd-amount"
              type="number"
              step="0.01"
              min="0"
              value={usdAmount}
              onChange={(e) => handleUsdChange(e.target.value)}
              className="pl-7"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="pb-2">
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1 space-y-1.5">
          <Label htmlFor="dop-amount" className="text-xs">
            Pesos (DOP)
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">RD$</span>
            <Input
              id="dop-amount"
              type="number"
              step="0.01"
              min="0"
              value={dopAmount}
              onChange={(e) => handleDopChange(e.target.value)}
              className="pl-11"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Info de la fuente */}
      {!compact && rate && (
        <p className="text-xs text-muted-foreground">
          Fuente: {rate.source === 'manual' ? 'Manual' : 'API'} |
          Fecha: {new Date(rate.effectiveDate).toLocaleDateString('es-DO')}
        </p>
      )}
    </div>
  )

  if (!showCard) {
    return content
  }

  return (
    <Card>
      <CardHeader className={compact ? 'pb-3' : ''}>
        <CardTitle className={compact ? 'text-base' : ''}>
          Conversion de Moneda
        </CardTitle>
        {!compact && (
          <CardDescription>
            Convierte entre dolares americanos y pesos dominicanos
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
}
