'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Camera,
  CheckCircle,
  AlertCircle,
  Syringe,
  Star,
  Edit,
  Printer,
  ClipboardList,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { SESSION_STATUS_OPTIONS, formatSessionDuration } from '@/types/sessions'
import {
  TreatmentTemplateSelector,
  hasTreatmentTemplate,
} from '@/components/treatment-templates'
import type { TreatmentTemplateData } from '@/types/treatment-templates'

// Mock session data
const mockSession = {
  id: '1',
  clinicId: '1',
  branchId: null,
  appointmentId: '1',
  patientId: '1',
  professionalId: '1',
  treatmentId: '1',
  treatmentName: 'Limpieza Facial Profunda',
  packageSessionId: null,
  startedAt: '2024-01-15T09:00:00',
  endedAt: '2024-01-15T10:00:00',
  durationMinutes: 60,
  status: 'completed',
  treatedZones: [
    { zone: 'face_full', label: 'Rostro completo' },
    { zone: 'face_forehead', label: 'Frente' },
    { zone: 'face_cheeks', label: 'Mejillas' },
  ],
  technicalParameters: {
    skinType: 'Mixta',
    protocol: 'Limpieza profunda con extracción',
    products: 'Espuma limpiadora, Tónico, Mascarilla purificante',
    treatmentTemplate: null as TreatmentTemplateData | null, // Will be populated when template is used
  },
  productsUsed: [
    { id: '1', name: 'Espuma Limpiadora Premium', quantity: 1, lot: 'LOT2024-001', unitCost: 15 },
    { id: '2', name: 'Tónico Facial', quantity: 1, lot: 'LOT2024-002', unitCost: 8 },
    { id: '3', name: 'Mascarilla Purificante', quantity: 1, lot: 'LOT2024-003', unitCost: 12 },
  ],
  observations: 'Piel sensible, se aplicó protocolo suave. Paciente presentó ligera rojez en zona de mejillas que cedió al finalizar el tratamiento.',
  patientFeedback: 'Muy satisfecha con el resultado. Sintió la piel muy limpia y fresca.',
  adverseReactions: null,
  resultRating: 5,
  resultNotes: 'Excelentes resultados, piel visiblemente más limpia y luminosa.',
  patientSignatureUrl: '/signatures/patient-1.png',
  professionalSignatureUrl: '/signatures/professional-1.png',
  signedAt: '2024-01-15T10:05:00',
  followUpRequired: true,
  followUpNotes: 'Se recomienda siguiente sesión en 4 semanas para mantenimiento.',
  nextSessionRecommendedAt: '2024-02-15',
  createdAt: '2024-01-15T09:00:00',
  updatedAt: '2024-01-15T10:05:00',
  createdBy: '1',
  // Related data
  patient: {
    id: '1',
    firstName: 'María',
    lastName: 'García López',
    phone: '8095551234',
    email: 'maria.garcia@email.com',
    avatar: null,
    gender: 'female' as const,
  },
  professional: {
    id: '1',
    name: 'Dra. María García',
    specialty: 'Dermatología Estética',
    avatar: null,
  },
  treatment: {
    id: '1',
    name: 'Limpieza Facial Profunda',
    price: 80,
    categoryName: 'Facial',
    categoryColor: '#ec4899',
  },
  clinicalNotes: [
    {
      id: '1',
      type: 'observation',
      content: 'Paciente refiere piel grasa en zona T',
      createdAt: '2024-01-15T09:15:00',
      createdBy: 'Dra. María García',
    },
    {
      id: '2',
      type: 'procedure',
      content: 'Se realizó extracción de comedones en nariz y mentón',
      createdAt: '2024-01-15T09:30:00',
      createdBy: 'Dra. María García',
    },
  ],
  images: [
    { id: '1', type: 'before', url: '/images/before-1.jpg', zone: 'Rostro frontal' },
    { id: '2', type: 'after', url: '/images/after-1.jpg', zone: 'Rostro frontal' },
    { id: '3', type: 'before', url: '/images/before-2.jpg', zone: 'Perfil derecho' },
    { id: '4', type: 'after', url: '/images/after-2.jpg', zone: 'Perfil derecho' },
  ],
}

export default function SesionDetallePage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('resumen')

  const session = mockSession

  const getStatusBadge = (status: string) => {
    const config = SESSION_STATUS_OPTIONS.find((s) => s.value === status)
    if (!config) return null
    return (
      <Badge style={{ backgroundColor: config.color }} className="text-white">
        {config.label}
      </Badge>
    )
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      dateStyle: 'long',
      timeStyle: 'short',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(price)
  }

  const totalProductCost = session.productsUsed.reduce(
    (acc, p) => acc + p.quantity * p.unitCost,
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sesiones">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Sesión #{session.id}</h1>
              {getStatusBadge(session.status)}
            </div>
            <p className="text-muted-foreground">
              {formatDateTime(session.startedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              {hasTreatmentTemplate(session.treatmentName) && (
                <TabsTrigger value="plantilla">
                  <ClipboardList className="h-4 w-4 mr-1" />
                  Plantilla
                </TabsTrigger>
              )}
              <TabsTrigger value="notas">Notas Clínicas</TabsTrigger>
              <TabsTrigger value="productos">Productos</TabsTrigger>
              <TabsTrigger value="fotos">Fotos</TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="space-y-6">
              {/* Treatment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Syringe className="h-5 w-5" />
                    Tratamiento Realizado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: session.treatment.categoryColor }}
                    />
                    <div>
                      <p className="font-medium">{session.treatment.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.treatment.categoryName} • {formatPrice(session.treatment.price)}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Duración</p>
                      <p className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatSessionDuration(session.durationMinutes)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Calificación</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= (session.resultRating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Zonas tratadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Zonas Tratadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {session.treatedZones.map((zone, index) => (
                      <Badge key={index} variant="secondary">
                        {zone.label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Parámetros Técnicos */}
              <Card>
                <CardHeader>
                  <CardTitle>Parámetros Técnicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(session.technicalParameters)
                      .filter(([key]) => key !== 'treatmentTemplate')
                      .map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="font-medium">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Observaciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Observaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notas del profesional</p>
                    <p>{session.observations || 'Sin observaciones'}</p>
                  </div>
                  {session.patientFeedback && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Feedback del paciente</p>
                      <p>{session.patientFeedback}</p>
                    </div>
                  )}
                  {session.adverseReactions && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Reacciones Adversas
                      </p>
                      <p className="text-red-700 mt-1">{session.adverseReactions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Seguimiento */}
              {session.followUpRequired && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Calendar className="h-5 w-5" />
                      Seguimiento Requerido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-700">{session.followUpNotes}</p>
                    {session.nextSessionRecommendedAt && (
                      <p className="mt-2 font-medium text-blue-800">
                        Próxima sesión recomendada: {new Date(session.nextSessionRecommendedAt).toLocaleDateString('es-MX', { dateStyle: 'long' })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Treatment Template Tab */}
            {hasTreatmentTemplate(session.treatmentName) && (
              <TabsContent value="plantilla" className="space-y-4">
                <TreatmentTemplateSelector
                  treatmentName={session.treatmentName}
                  data={session.technicalParameters.treatmentTemplate}
                  onChange={() => {}} // Read-only in detail view
                  readOnly={true}
                  patientId={session.patient.id}
                  patientGender={session.patient.gender}
                />
              </TabsContent>
            )}

            <TabsContent value="notas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notas Clínicas</CardTitle>
                  <CardDescription>Registro detallado de la sesión</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {session.clinicalNotes.map((note) => (
                      <div key={note.id} className="border-l-2 border-primary pl-4 py-2">
                        <p className="text-sm text-muted-foreground">
                          {new Date(note.createdAt).toLocaleTimeString('es-MX', { timeStyle: 'short' })} - {note.createdBy}
                        </p>
                        <Badge variant="outline" className="my-1">
                          {note.type === 'observation' ? 'Observación' : 'Procedimiento'}
                        </Badge>
                        <p className="mt-1">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="productos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Productos Utilizados</CardTitle>
                  <CardDescription>Insumos consumidos durante la sesión</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {session.productsUsed.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Lote: {product.lot} • Cantidad: {product.quantity}
                          </p>
                        </div>
                        <p className="font-medium">{formatPrice(product.quantity * product.unitCost)}</p>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between font-medium">
                      <span>Total Productos</span>
                      <span>{formatPrice(totalProductCost)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fotos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Fotografías
                  </CardTitle>
                  <CardDescription>Registro visual antes y después</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {session.images.length > 0 ? (
                      session.images.map((image) => (
                        <div key={image.id} className="border rounded-lg overflow-hidden">
                          <div className="aspect-square bg-muted flex items-center justify-center">
                            <Camera className="h-12 w-12 text-muted-foreground" />
                          </div>
                          <div className="p-2 text-sm">
                            <Badge variant={image.type === 'before' ? 'secondary' : 'default'}>
                              {image.type === 'before' ? 'Antes' : 'Después'}
                            </Badge>
                            <p className="mt-1 text-muted-foreground">{image.zone}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="col-span-2 text-center py-8 text-muted-foreground">
                        No hay fotografías registradas
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Patient Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={session.patient.avatar || undefined} />
                  <AvatarFallback>
                    {session.patient.firstName[0]}
                    {session.patient.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {session.patient.firstName} {session.patient.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{session.patient.phone}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link href={`/pacientes/${session.patient.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Ver Perfil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Professional Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profesional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={session.professional.avatar || undefined} />
                  <AvatarFallback>
                    {session.professional.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{session.professional.name}</p>
                  <p className="text-sm text-muted-foreground">{session.professional.specialty}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signatures */}
          {session.signedAt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Firmas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Paciente</p>
                  <div className="h-16 border rounded bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Firma registrada</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profesional</p>
                  <div className="h-16 border rounded bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Firma registrada</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Firmado el {formatDateTime(session.signedAt)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tratamiento</span>
                <span>{formatPrice(session.treatment.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Productos</span>
                <span>-{formatPrice(totalProductCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Margen</span>
                <span className="text-green-600">
                  {formatPrice(session.treatment.price - totalProductCost)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
