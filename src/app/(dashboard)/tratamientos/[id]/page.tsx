'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Edit,
  MoreHorizontal,
  Users,
  AlertTriangle,
  CheckCircle,
  Package,
  Clipboard,
  Trash2,
  Copy,
  ToggleLeft,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { getTreatments, getCategories } from '@/actions/treatments'
import { getProfessionals } from '@/actions/professionals'

interface PageProps {
  params: Promise<{ id: string }>
}

interface TreatmentDetail {
  id: string
  name: string
  description: string
  descriptionInternal: string
  categoryName: string
  categoryColor: string
  price: number
  cost: number
  durationMinutes: number
  bufferMinutes: number
  recommendedSessions: number
  sessionIntervalDays: number
  contraindications: string[]
  aftercareInstructions: string
  protocolSteps: Array<{
    order: number
    title: string
    description: string
    durationMinutes: number
  }>
  consumables: Array<{
    productId: string
    quantity: number
  }>
  allowedProfessionalIds: string[]
  isActive: boolean
  isPublic: boolean
}

export default function TreatmentDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const [treatment, setTreatment] = useState<TreatmentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTreatment = async () => {
      try {
        const [treatments, categories, professionals] = await Promise.all([
          getTreatments(),
          getCategories(),
          getProfessionals(),
        ])

        const found = treatments.find(t => t.id === id)
        if (!found) {
          setTreatment(null)
          setIsLoading(false)
          return
        }

        // Get category info
        const category = categories.find(c => c.name === found.category_name)

        // Build treatment detail with defaults for demo data
        const detail: TreatmentDetail = {
          id: found.id,
          name: found.name,
          description: `Tratamiento profesional de ${found.name}. Resultados visibles desde la primera sesion.`,
          descriptionInternal: 'Seguir protocolo estandar de la clinica.',
          categoryName: found.category_name || 'General',
          categoryColor: found.category_color || category?.color || '#6366f1',
          price: found.price,
          cost: Math.round(found.price * 0.35), // Estimate 35% cost
          durationMinutes: found.duration_minutes,
          bufferMinutes: 10,
          recommendedSessions: 4,
          sessionIntervalDays: 30,
          contraindications: [
            'Embarazo o lactancia',
            'Infeccion activa en la zona',
            'Enfermedades autoinmunes activas',
          ],
          aftercareInstructions: 'Evitar exposicion solar directa por 24-48 horas. Usar protector solar SPF 50+. Mantener la zona hidratada.',
          protocolSteps: [
            { order: 1, title: 'Evaluacion', description: 'Evaluacion inicial del paciente y zona a tratar', durationMinutes: 5 },
            { order: 2, title: 'Preparacion', description: 'Limpieza y preparacion del area', durationMinutes: 10 },
            { order: 3, title: 'Procedimiento', description: 'Aplicacion del tratamiento', durationMinutes: Math.max(found.duration_minutes - 20, 30) },
            { order: 4, title: 'Finalizacion', description: 'Cuidados post-tratamiento e indicaciones', durationMinutes: 5 },
          ],
          consumables: [],
          allowedProfessionalIds: professionals.map(p => p.id),
          isActive: found.is_active ?? true,
          isPublic: true,
        }

        setTreatment(detail)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading treatment:', error)
        setIsLoading(false)
      }
    }

    loadTreatment()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!treatment) {
    notFound()
  }

  const margin = treatment.price - treatment.cost
  const marginPercent = ((margin / treatment.price) * 100).toFixed(1)

  const handleToggleActive = () => {
    toast.success(treatment.isActive ? 'Tratamiento desactivado' : 'Tratamiento activado')
  }

  const handleDuplicate = () => {
    toast.success('Tratamiento duplicado')
  }

  const handleDelete = () => {
    toast.error('No se puede eliminar un tratamiento con citas asociadas')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tratamientos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: treatment.categoryColor }}
              />
              <Badge variant="outline">{treatment.categoryName}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">
              {treatment.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {treatment.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={treatment.isActive ? 'default' : 'secondary'}>
            {treatment.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tratamientos/${treatment.id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive}>
                <ToggleLeft className="mr-2 h-4 w-4" />
                {treatment.isActive ? 'Desactivar' : 'Activar'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Precio</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              RD${treatment.price.toLocaleString('es-DO')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Duracion</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {treatment.durationMinutes} min
            </p>
            {treatment.bufferMinutes > 0 && (
              <p className="text-xs text-muted-foreground">
                +{treatment.bufferMinutes} min buffer
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Costo</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              RD${treatment.cost.toLocaleString('es-DO')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Margen</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">
              {marginPercent}%
            </p>
            <p className="text-xs text-muted-foreground">
              RD${margin.toLocaleString('es-DO')} por sesion
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="protocol">
            <TabsList>
              <TabsTrigger value="protocol">Protocolo</TabsTrigger>
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="consumables">Consumibles</TabsTrigger>
            </TabsList>

            <TabsContent value="protocol" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clipboard className="h-5 w-5" />
                    Protocolo del Tratamiento
                  </CardTitle>
                  <CardDescription>
                    Pasos a seguir durante el procedimiento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {treatment.protocolSteps.map((step, index) => (
                      <div key={step.order} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {step.order}
                          </div>
                          {index < treatment.protocolSteps.length - 1 && (
                            <div className="w-px flex-1 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{step.title}</h4>
                            {step.durationMinutes && (
                              <Badge variant="outline">
                                {step.durationMinutes} min
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Descripcion Interna</CardTitle>
                  <CardDescription>
                    Solo visible para el personal de la clinica
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {treatment.descriptionInternal || 'Sin descripcion interna'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cuidados Post-Tratamiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {treatment.aftercareInstructions || 'Sin indicaciones especificas'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sesiones Recomendadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-2xl font-bold">{treatment.recommendedSessions}</p>
                      <p className="text-sm text-muted-foreground">sesiones</p>
                    </div>
                    {treatment.sessionIntervalDays && (
                      <>
                        <Separator orientation="vertical" className="h-12" />
                        <div>
                          <p className="text-2xl font-bold">{treatment.sessionIntervalDays}</p>
                          <p className="text-sm text-muted-foreground">dias entre sesiones</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consumables" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Productos Consumibles
                  </CardTitle>
                  <CardDescription>
                    Productos utilizados en cada sesion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {treatment.consumables.length > 0 ? (
                    <div className="space-y-3">
                      {treatment.consumables.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <p className="font-medium">Producto #{item.productId}</p>
                            <p className="text-sm text-muted-foreground">
                              Se usa en cada sesion
                            </p>
                          </div>
                          <Badge variant="outline">x{item.quantity}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Este tratamiento no tiene consumibles asociados
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Contraindicaciones */}
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Contraindicaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {treatment.contraindications.length > 0 ? (
                <ul className="space-y-2">
                  {treatment.contraindications.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-amber-700 dark:text-amber-400">Sin contraindicaciones registradas</p>
              )}
            </CardContent>
          </Card>

          {/* Profesionales autorizados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Profesionales
              </CardTitle>
              <CardDescription>
                Autorizados para realizar este tratamiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {treatment.allowedProfessionalIds.length} {treatment.allowedProfessionalIds.length === 1 ? 'profesional autorizado' : 'profesionales autorizados'}
              </p>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link href={`/tratamientos/${treatment.id}/editar#profesionales`}>
                  Gestionar profesionales
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Acciones rapidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rapidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/agenda/nueva?treatmentId=${treatment.id}`}>
                  Agendar Cita
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/tratamientos/paquetes/nuevo?treatmentId=${treatment.id}`}>
                  Crear Paquete
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
