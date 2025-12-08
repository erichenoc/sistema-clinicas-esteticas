'use client'

import { use } from 'react'
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
  Image as ImageIcon,
  Trash2,
  Copy,
  ToggleLeft,
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
import type { Treatment, TreatmentCategory, TreatmentProtocolStep } from '@/types/treatments'

// Mock data
const mockCategories: Record<string, TreatmentCategory> = {
  'facial': {
    id: 'facial',
    clinicId: '1',
    name: 'Facial',
    slug: 'facial',
    description: 'Tratamientos faciales',
    icon: 'sparkles',
    color: '#ec4899',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'inyectables': {
    id: 'inyectables',
    clinicId: '1',
    name: 'Inyectables',
    slug: 'inyectables',
    description: 'Tratamientos inyectables',
    icon: 'syringe',
    color: '#06b6d4',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'laser': {
    id: 'laser',
    clinicId: '1',
    name: 'Láser',
    slug: 'laser',
    description: 'Tratamientos láser',
    icon: 'zap',
    color: '#ef4444',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}

const mockTreatments: Record<string, Treatment> = {
  '1': {
    id: '1',
    clinicId: '1',
    categoryId: 'facial',
    name: 'Limpieza Facial Profunda',
    slug: 'limpieza-facial-profunda',
    description: 'Tratamiento completo de limpieza facial que incluye extracción de comedones, exfoliación y mascarilla hidratante.',
    descriptionInternal: 'Usar productos de la línea Dermalogica. Para pieles sensibles, usar la línea UltraCalming.',
    durationMinutes: 60,
    bufferMinutes: 10,
    price: 1200,
    priceFrom: null,
    cost: 250,
    recommendedSessions: 4,
    sessionIntervalDays: 30,
    contraindications: [
      'Rosácea activa',
      'Herpes labial activo',
      'Tratamiento con Isotretinoína',
      'Quemaduras solares recientes',
    ],
    aftercareInstructions: 'Evitar exposición solar directa por 24 horas. Usar protector solar SPF 50. No usar maquillaje por 12 horas.',
    requiredConsentId: null,
    allowedProfessionalIds: ['1', '2', '3'],
    requiredRoomTypes: ['cabin'],
    requiredEquipmentIds: [],
    consumables: [
      { productId: 'prod-1', quantity: 1 },
      { productId: 'prod-2', quantity: 2 },
    ],
    protocolSteps: [
      { order: 1, title: 'Desmaquillado', description: 'Limpieza inicial con leche limpiadora', durationMinutes: 5 },
      { order: 2, title: 'Análisis de piel', description: 'Evaluación con lámpara de Wood', durationMinutes: 5 },
      { order: 3, title: 'Vapor y extracción', description: 'Apertura de poros y extracción de comedones', durationMinutes: 20 },
      { order: 4, title: 'Exfoliación', description: 'Exfoliación enzimática según tipo de piel', durationMinutes: 10 },
      { order: 5, title: 'Mascarilla', description: 'Aplicación de mascarilla hidratante', durationMinutes: 15 },
      { order: 6, title: 'Finalización', description: 'Tónico, sérum y protector solar', durationMinutes: 5 },
    ],
    imageUrl: null,
    galleryUrls: [],
    isPublic: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories['facial'],
  },
  '2': {
    id: '2',
    clinicId: '1',
    categoryId: 'inyectables',
    name: 'Botox - Frente',
    slug: 'botox-frente',
    description: 'Aplicación de toxina botulínica en la zona de la frente para suavizar líneas de expresión.',
    descriptionInternal: 'Dosis recomendada: 10-20 unidades. Evaluar movilidad y ajustar según necesidad.',
    durationMinutes: 30,
    bufferMinutes: 15,
    price: 5500,
    priceFrom: null,
    cost: 1800,
    recommendedSessions: 3,
    sessionIntervalDays: 120,
    contraindications: [
      'Embarazo o lactancia',
      'Enfermedades neuromusculares',
      'Alergia a la toxina botulínica',
      'Infección en zona de aplicación',
    ],
    aftercareInstructions: 'No tocar ni masajear la zona tratada por 4 horas. No realizar ejercicio intenso por 24 horas. No acostarse por 4 horas.',
    requiredConsentId: 'consent-botox',
    allowedProfessionalIds: ['1', '2'],
    requiredRoomTypes: ['cabin', 'consultation'],
    requiredEquipmentIds: [],
    consumables: [
      { productId: 'botox-100u', quantity: 1 },
    ],
    protocolSteps: [
      { order: 1, title: 'Fotografía', description: 'Tomar fotos pre-procedimiento', durationMinutes: 2 },
      { order: 2, title: 'Limpieza', description: 'Desinfección de la zona', durationMinutes: 3 },
      { order: 3, title: 'Marcación', description: 'Marcar puntos de aplicación', durationMinutes: 5 },
      { order: 4, title: 'Aplicación', description: 'Inyección de toxina botulínica', durationMinutes: 15 },
      { order: 5, title: 'Post-cuidados', description: 'Explicar cuidados e indicaciones', durationMinutes: 5 },
    ],
    imageUrl: null,
    galleryUrls: [],
    isPublic: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories['inyectables'],
  },
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TreatmentDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const treatment = mockTreatments[id]

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
                style={{ backgroundColor: treatment.category?.color || '#6366f1' }}
              />
              <Badge variant="outline">{treatment.category?.name}</Badge>
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

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Precio</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              RD${treatment.price.toLocaleString('es-MX')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Duración</span>
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
              RD${treatment.cost.toLocaleString('es-MX')}
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
              RD${margin.toLocaleString('es-MX')} por sesión
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
                  <CardTitle>Descripción Interna</CardTitle>
                  <CardDescription>
                    Solo visible para el personal de la clínica
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {treatment.descriptionInternal || 'Sin descripción interna'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cuidados Post-Tratamiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {treatment.aftercareInstructions || 'Sin indicaciones específicas'}
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
                          <p className="text-sm text-muted-foreground">días entre sesiones</p>
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
                    Productos utilizados en cada sesión
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
                              Se usa en cada sesión
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
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-700">
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
                      className="flex items-start gap-2 text-sm text-amber-700"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-amber-700">Sin contraindicaciones registradas</p>
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
                {treatment.allowedProfessionalIds.length} profesionales autorizados
              </p>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link href={`/tratamientos/${treatment.id}/editar#profesionales`}>
                  Gestionar profesionales
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Acciones rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
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
