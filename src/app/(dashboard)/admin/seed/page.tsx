'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, Database, Sparkles } from 'lucide-react'
import { seedTreatments } from '@/actions/seed-treatments'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    created: number
  } | null>(null)

  const handleSeedTreatments = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await seedTreatments()
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error}`,
        created: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administración de Datos</h1>
        <p className="text-muted-foreground">
          Herramientas para inicializar y gestionar datos del sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Cargar Tratamientos de Dra. Pamela Moquete
            </CardTitle>
            <CardDescription>
              Importa los 39 tratamientos del catálogo de drapamelamoquete.com incluyendo
              tratamientos faciales y corporales con descripciones, precios y sesiones recomendadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p><strong>Tratamientos Faciales (17):</strong></p>
              <p className="text-muted-foreground text-xs">
                HIFU, Limpieza Facial, Microdermoabrasión, Dermapen, Mesoterapia, Peelings,
                Rellenos, Toxina Botulínica, Hilos Tensores, y más...
              </p>
              <p className="mt-2"><strong>Tratamientos Corporales (22):</strong></p>
              <p className="text-muted-foreground text-xs">
                Emsculpt, Celulitis, Lipoláser, Drenaje Linfático, Radiofrecuencia,
                Ultracavitación, Masajes, y más...
              </p>
            </div>

            <Button
              onClick={handleSeedTreatments}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando tratamientos...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Cargar Tratamientos
                </>
              )}
            </Button>

            {result && (
              <div
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  result.success
                    ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
                    : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">{result.success ? 'Éxito' : 'Error'}</p>
                  <p className="text-sm">{result.message}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
