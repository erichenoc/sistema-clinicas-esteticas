'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  Loader2,
  ImagePlus,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SESSION_STATUS_OPTIONS, formatSessionDuration } from '@/types/sessions'
import {
  TreatmentTemplateSelector,
  hasTreatmentTemplate,
} from '@/components/treatment-templates'
import type { TreatmentTemplateData } from '@/types/treatment-templates'
import {
  getSessionById,
  getSessionImages,
  getSessionNotes,
  type SessionImageData,
  type SessionListItemData,
  type ClinicalNoteData,
} from '@/actions/sessions'

// Mock session data

// Body zones mapping
const BODY_ZONES: Record<string, string> = {
  face_full: 'Rostro completo',
  face_forehead: 'Frente',
  face_cheeks: 'Mejillas',
  face_chin: 'Menton',
  face_nose: 'Nariz',
  face_perioral: 'Zona Perioral',
  face_periocular: 'Zona Periocular',
  neck: 'Cuello',
  decolletage: 'Escote',
  hands: 'Manos',
  arms: 'Brazos',
  abdomen: 'Abdomen',
  back: 'Espalda',
  legs: 'Piernas',
  other: 'Otra zona',
}

export default function SesionDetallePage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const [activeTab, setActiveTab] = useState('resumen')
  const [sessionImages, setSessionImages] = useState<SessionImageData[]>([])
  const [selectedImage, setSelectedImage] = useState<SessionImageData | null>(null)
  const [isLoadingImages, setIsLoadingImages] = useState(true)

  const [dbSession, setDbSession] = useState<SessionListItemData | null>(null)
  const [notes, setNotes] = useState<ClinicalNoteData[]>([])

  // Load session, notes and images
  useEffect(() => {
    async function loadAll() {
      setIsLoadingImages(true)
      try {
        const [session, sessionNotes, images] = await Promise.all([
          getSessionById(sessionId),
          getSessionNotes(sessionId),
          getSessionImages(sessionId),
        ])
        setDbSession(session)
        setNotes(sessionNotes)
        setSessionImages(images)
      } catch (error) {
        console.error('Error loading session:', error)
      } finally {
        setIsLoadingImages(false)
      }
    }

    loadAll()
  }, [sessionId])

  // Group images by type
  const beforeImages = sessionImages.filter(img => img.type === 'before')
  const duringImages = sessionImages.filter(img => img.type === 'during')
  const afterImages = sessionImages.filter(img => img.type === 'after')

  // Sesion real: se arma con la misma forma que esperaba el render
  const session = dbSession
    ? {
        id: dbSession.id,
        treatmentName: dbSession.treatment_display_name || dbSession.treatment_name,
        startedAt: dbSession.started_at,
        durationMinutes: dbSession.duration_minutes,
        status: dbSession.status as string,
        treatedZones: (dbSession.treated_zones || []) as { zone: string; label: string }[],
        technicalParameters: (dbSession.technical_parameters || {}) as Record<string, unknown> & {
          treatmentTemplate?: TreatmentTemplateData | null
        },
        productsUsed: (dbSession.products_used || []) as {
          id: string
          name: string
          quantity: number
          lot?: string | null
          unitCost: number
        }[],
        observations: dbSession.observations,
        patientFeedback: dbSession.patient_feedback,
        adverseReactions: dbSession.adverse_reactions,
        resultRating: dbSession.result_rating,
        signedAt: dbSession.signed_at,
        followUpRequired: dbSession.follow_up_required,
        followUpNotes: dbSession.follow_up_notes,
        nextSessionRecommendedAt: dbSession.next_session_recommended_at,
        patient: {
          id: dbSession.patient_id,
          firstName: (dbSession.patient_name || '').split(' ')[0] || '',
          lastName: (dbSession.patient_name || '').split(' ').slice(1).join(' '),
          phone: dbSession.patient_phone,
          avatar: dbSession.patient_avatar,
          gender: 'female' as const,
        },
        professional: {
          id: dbSession.professional_id,
          name: dbSession.professional_name,
          specialty: null as string | null,
          avatar: null as string | null,
        },
        treatment: {
          id: dbSession.treatment_id,
          name: dbSession.treatment_display_name || dbSession.treatment_name,
          price: dbSession.treatment_price ?? 0,
          categoryName: dbSession.category_name,
          categoryColor: dbSession.category_color || '#A67C52',
        },
        clinicalNotes: notes.map((n) => ({
          id: n.id,
          type: n.note_type || 'general',
          content: n.content,
          createdAt: n.created_at,
          createdBy: 'Profesional',
        })),
      }
    : null


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

  const totalProductCost = (session?.productsUsed || []).reduce(
    (acc, p) => acc + p.quantity * p.unitCost,
    0
  )

  // Mientras carga, o si la sesion no existe, no hay nada que mostrar
  if (!session) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">
          {isLoadingImages ? 'Cargando sesión...' : 'La sesión no existe o fue eliminada'}
        </p>
      </div>
    )
  }

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
                  data={session.technicalParameters.treatmentTemplate ?? null}
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
                    Fotografias
                  </CardTitle>
                  <CardDescription>
                    Registro visual del antes, durante y despues
                    {sessionImages.length > 0 && ` (${sessionImages.length} fotos)`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingImages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : sessionImages.length > 0 ? (
                    <>
                      {/* Before Images */}
                      {beforeImages.length > 0 && (
                        <div className="space-y-3">
                          <Badge variant="secondary">Antes ({beforeImages.length})</Badge>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {beforeImages.map((image) => (
                              <button
                                key={image.id}
                                className="aspect-square rounded-lg overflow-hidden bg-muted border hover:border-primary transition-colors relative group"
                                onClick={() => setSelectedImage(image)}
                              >
                                <Image
                                  src={image.thumbnail_url || image.image_url}
                                  alt={image.caption || 'Antes'}
                                  fill
                                  className="object-cover"
                                />
                                {image.body_zone && (
                                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs px-1 py-0.5 truncate">
                                    {BODY_ZONES[image.body_zone] || image.body_zone}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* During Images */}
                      {duringImages.length > 0 && (
                        <div className="space-y-3">
                          <Badge variant="outline">Durante ({duringImages.length})</Badge>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {duringImages.map((image) => (
                              <button
                                key={image.id}
                                className="aspect-square rounded-lg overflow-hidden bg-muted border hover:border-primary transition-colors relative group"
                                onClick={() => setSelectedImage(image)}
                              >
                                <Image
                                  src={image.thumbnail_url || image.image_url}
                                  alt={image.caption || 'Durante'}
                                  fill
                                  className="object-cover"
                                />
                                {image.body_zone && (
                                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs px-1 py-0.5 truncate">
                                    {BODY_ZONES[image.body_zone] || image.body_zone}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* After Images */}
                      {afterImages.length > 0 && (
                        <div className="space-y-3">
                          <Badge>Despues ({afterImages.length})</Badge>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {afterImages.map((image) => (
                              <button
                                key={image.id}
                                className="aspect-square rounded-lg overflow-hidden bg-muted border hover:border-primary transition-colors relative group"
                                onClick={() => setSelectedImage(image)}
                              >
                                <Image
                                  src={image.thumbnail_url || image.image_url}
                                  alt={image.caption || 'Despues'}
                                  fill
                                  className="object-cover"
                                />
                                {image.body_zone && (
                                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs px-1 py-0.5 truncate">
                                    {BODY_ZONES[image.body_zone] || image.body_zone}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Camera className="h-12 w-12 mb-4" />
                      <p>No hay fotografias registradas</p>
                      {session.status === 'in_progress' && (
                        <Link href={`/sesiones/${sessionId}/completar`}>
                          <Button variant="outline" size="sm" className="mt-4">
                            <ImagePlus className="h-4 w-4 mr-2" />
                            Agregar fotos
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
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

      {/* Image Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant={selectedImage?.type === 'before' ? 'secondary' : selectedImage?.type === 'after' ? 'default' : 'outline'}>
                {selectedImage?.type === 'before' ? 'Antes' : selectedImage?.type === 'during' ? 'Durante' : 'Despues'}
              </Badge>
              {selectedImage?.body_zone && (
                <span className="text-muted-foreground font-normal">
                  - {BODY_ZONES[selectedImage.body_zone] || selectedImage.body_zone}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={selectedImage.image_url}
                alt={selectedImage.caption || 'Foto de sesion'}
                fill
                className="object-contain"
              />
            </div>
          )}
          {selectedImage?.caption && (
            <p className="text-sm text-muted-foreground text-center">
              {selectedImage.caption}
            </p>
          )}
          {selectedImage?.taken_at && (
            <p className="text-xs text-muted-foreground text-center">
              Tomada el {new Date(selectedImage.taken_at).toLocaleString('es-DO')}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
