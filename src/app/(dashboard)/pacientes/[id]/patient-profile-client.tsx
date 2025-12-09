'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Edit,
  MoreHorizontal,
  Clock,
  CreditCard,
  FileText,
  Camera,
  Activity,
  AlertCircle,
  Heart,
  Pill,
  User,
  Star,
  Plus,
  ChevronRight,
  MessageSquare,
  ClipboardEdit,
  ExternalLink,
  Shield,
  Zap,
  Cigarette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MedicalHistoryDialog, type MedicalHistoryData } from '../_components/medical-history-form'
export type { MedicalHistoryData }
import { toast } from 'sonner'
import { saveMedicalHistory } from '@/actions/medical-history'

export interface PatientData {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string
  phone_secondary: string | null
  date_of_birth: string | null
  birth_date?: string | null
  gender: string | null
  document_type: string | null
  document_number: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  source: string | null
  status: string
  tags: string[] | null
  notes: string | null
  avatar_url: string | null
  total_spent?: number
  visit_count?: number
  last_visit_at: string | null
  created_at: string
}

export interface MedicalHistoryDbData {
  id: string
  patient_id: string
  allergies: string[] | null
  current_medications: string[] | null
  chronic_conditions: string[] | null
  previous_surgeries: string[] | null
  previous_aesthetic_treatments: string[] | null
  is_pregnant: boolean
  is_breastfeeding: boolean
  uses_retinoids: boolean
  sun_exposure_level: string | null
  additional_notes: string | null
  skin_type_fitzpatrick: string | null
}

interface PatientProfileClientProps {
  patient: PatientData
  medicalHistory: MedicalHistoryDbData | null
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function PatientProfileClient({ patient, medicalHistory }: PatientProfileClientProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [isPending, startTransition] = useTransition()
  const [currentMedicalHistory, setCurrentMedicalHistory] = useState(medicalHistory)

  const age = calculateAge(patient.date_of_birth)

  const handleSaveMedicalHistory = async (data: MedicalHistoryData) => {
    startTransition(async () => {
      try {
        const result = await saveMedicalHistory({
          patient_id: patient.id,
          allergies: data.allergies,
          current_medications: data.currentMedications,
          chronic_conditions: data.chronicConditions,
          previous_surgeries: data.previousSurgeries,
          previous_aesthetic_treatments: data.previousAestheticTreatments,
          is_pregnant: data.isPregnant,
          is_breastfeeding: data.isBreastfeeding,
          uses_retinoids: data.usesRetinoids,
          sun_exposure_level: data.sunExposureLevel,
          additional_notes: data.additionalNotes,
        })
        
        setCurrentMedicalHistory(result)
        toast.success('Historial medico actualizado correctamente')
      } catch {
        toast.error('Error al guardar el historial medico')
      }
    })
  }

  const medicalHistoryForForm = currentMedicalHistory ? {
    patientId: patient.id,
    allergies: currentMedicalHistory.allergies || [],
    currentMedications: currentMedicalHistory.current_medications || [],
    chronicConditions: currentMedicalHistory.chronic_conditions || [],
    previousSurgeries: currentMedicalHistory.previous_surgeries || [],
    previousAestheticTreatments: currentMedicalHistory.previous_aesthetic_treatments || [],
    isPregnant: currentMedicalHistory.is_pregnant,
    isBreastfeeding: currentMedicalHistory.is_breastfeeding,
    usesRetinoids: currentMedicalHistory.uses_retinoids,
    sunExposureLevel: currentMedicalHistory.sun_exposure_level || '',
    additionalNotes: currentMedicalHistory.additional_notes || '',
  } : {
    patientId: patient.id,
    allergies: [],
    currentMedications: [],
    chronicConditions: [],
    previousSurgeries: [],
    previousAestheticTreatments: [],
    isPregnant: false,
    isBreastfeeding: false,
    usesRetinoids: false,
    sunExposureLevel: '',
    additionalNotes: '',
  }

  const displayMedicalHistory = currentMedicalHistory ? {
    allergies: currentMedicalHistory.allergies || [],
    chronicConditions: currentMedicalHistory.chronic_conditions || [],
    currentMedications: currentMedicalHistory.current_medications || [],
    previousSurgeries: currentMedicalHistory.previous_surgeries || [],
    previousAestheticTreatments: currentMedicalHistory.previous_aesthetic_treatments || [],
    isPregnant: currentMedicalHistory.is_pregnant,
    isBreastfeeding: currentMedicalHistory.is_breastfeeding,
    usesRetinoids: currentMedicalHistory.uses_retinoids,
    sunExposureLevel: currentMedicalHistory.sun_exposure_level || '',
    additionalNotes: currentMedicalHistory.additional_notes || '',
    skinType: currentMedicalHistory.skin_type_fitzpatrick,
  } : null

  const phoneClean = patient.phone.replace(/\s/g, '').replace(/[^0-9]/g, '')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/pacientes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Avatar className="h-16 w-16">
            <AvatarImage src={patient.avatar_url || undefined} />
            <AvatarFallback className="text-xl bg-primary/10">
              {patient.first_name[0]}{patient.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{patient.first_name} {patient.last_name}</h1>
              <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                {patient.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
              {patient.tags?.includes('vip') && (
                <Badge className="bg-amber-100 text-amber-700">VIP</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {age ? `${age} anos` : ''} {age ? '•' : ''} Paciente desde {formatDate(patient.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/agenda/nueva?patientId=${patient.id}`}>
              <Calendar className="mr-2 h-4 w-4" />
              Nueva Cita
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/pacientes/${patient.id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                if (patient.phone) {
                  window.open(`https://wa.me/${patient.phone.replace(/\D/g, '')}`, '_blank')
                } else {
                  toast.error('El paciente no tiene numero de telefono registrado')
                }
              }}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Enviar mensaje WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/consentimientos?paciente=${patient.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Ver consentimientos
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Galeria de fotos proximamente disponible')}>
                <Camera className="mr-2 h-4 w-4" />
                Galeria de fotos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => toast.warning('Funcion de desactivar paciente en desarrollo')}
              >
                Desactivar paciente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Citas</p>
                <p className="text-2xl font-bold">{patient.visit_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gastado</p>
                <p className="text-2xl font-bold">{formatCurrency(patient.total_spent ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ultima Visita</p>
                <p className="text-2xl font-bold">{formatDate(patient.last_visit_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proxima Cita</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="historial">Historial Medico</TabsTrigger>
          <TabsTrigger value="citas">Citas</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
        </TabsList>

        {/* Tab: General */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informacion Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre Completo</p>
                    <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                    <p className="font-medium">{formatDate(patient.date_of_birth)} {age ? `(${age} anos)` : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Genero</p>
                    <p className="font-medium">{patient.gender === 'female' ? 'Femenino' : patient.gender === 'male' ? 'Masculino' : patient.gender || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Documento</p>
                    <p className="font-medium">{patient.document_type || '-'}: {patient.document_number || '-'}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Etiquetas</p>
                  <div className="flex flex-wrap gap-2">
                    {patient.tags?.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    )) || <span className="text-muted-foreground">Sin etiquetas</span>}
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{patient.phone}</p>
                    <p className="text-sm text-muted-foreground">Telefono principal</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://wa.me/${phoneClean}`} target="_blank">
                      WhatsApp
                    </a>
                  </Button>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{patient.email}</p>
                      <p className="text-sm text-muted-foreground">Email</p>
                    </div>
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{patient.address}</p>
                      <p className="text-sm text-muted-foreground">{patient.city}, {patient.state} {patient.postal_code}</p>
                    </div>
                  </div>
                )}
                {patient.emergency_contact_name && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Contacto de Emergencia</p>
                      <p className="font-medium">{patient.emergency_contact_name}</p>
                      <p className="text-sm text-muted-foreground">{patient.emergency_contact_phone}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{patient.notes || 'Sin notas'}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Historial Medico */}
        <TabsContent value="historial" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Historial Medico Completo</h3>
              <p className="text-sm text-muted-foreground">
                Informacion medica importante para tratamientos esteticos
              </p>
            </div>
            <div className="flex gap-2">
              <MedicalHistoryDialog
                patientId={patient.id}
                patientName={`${patient.first_name} ${patient.last_name}`}
                initialData={medicalHistoryForForm}
                onSave={handleSaveMedicalHistory}
                trigger={
                  <Button variant="outline" disabled={isPending}>
                    <ClipboardEdit className="mr-2 h-4 w-4" />
                    Edicion Rapida
                  </Button>
                }
              />
              <Button asChild>
                <Link href={`/pacientes/${patient.id}/historial`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Formulario Completo
                </Link>
              </Button>
            </div>
          </div>

          {/* Critical Alerts Banner */}
          {displayMedicalHistory && (displayMedicalHistory.allergies.length > 0 ||
            displayMedicalHistory.isPregnant ||
            displayMedicalHistory.isBreastfeeding) && (
            <Card className="border-red-300 bg-gradient-to-r from-red-50 to-orange-50">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-700 mb-2">Alertas Importantes</p>
                    <div className="flex flex-wrap gap-2">
                      {displayMedicalHistory.allergies.map((allergy) => (
                        <Badge key={allergy} variant="destructive">Alergia: {allergy}</Badge>
                      ))}
                      {displayMedicalHistory.isPregnant && (
                        <Badge className="bg-pink-500 text-white">Embarazada</Badge>
                      )}
                      {displayMedicalHistory.isBreastfeeding && (
                        <Badge className="bg-pink-500 text-white">Lactando</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!displayMedicalHistory && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="font-medium mb-1">No hay historial medico registrado</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Completa el historial medico para una mejor atencion
                  </p>
                  <Button asChild>
                    <Link href={`/pacientes/${patient.id}/historial`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Completar Historial
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {displayMedicalHistory && (
            <>
              {/* Quick Stats Row */}
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-pink-50 to-pink-100/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-pink-600" />
                      <div>
                        <p className="text-2xl font-bold text-pink-700">
                          {displayMedicalHistory.chronicConditions.length}
                        </p>
                        <p className="text-xs text-pink-600">Condiciones</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Pill className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold text-blue-700">
                          {displayMedicalHistory.currentMedications.length}
                        </p>
                        <p className="text-xs text-blue-600">Medicamentos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold text-purple-700">
                          {displayMedicalHistory.previousAestheticTreatments.length}
                        </p>
                        <p className="text-xs text-purple-600">Tratamientos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-2xl font-bold text-yellow-700">
                          {displayMedicalHistory.skinType || '-'}
                        </p>
                        <p className="text-xs text-yellow-600">Fototipo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Grid */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Heart className="h-5 w-5 text-pink-500" />
                      Condiciones Cronicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {displayMedicalHistory.chronicConditions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {displayMedicalHistory.chronicConditions.map((condition) => (
                          <Badge key={condition} variant="secondary">{condition}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin condiciones cronicas registradas</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Pill className="h-5 w-5 text-blue-500" />
                      Medicamentos Actuales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {displayMedicalHistory.currentMedications.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {displayMedicalHistory.currentMedications.map((med) => (
                          <Badge key={med} variant="outline">{med}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin medicamentos registrados</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="h-5 w-5 text-purple-500" />
                      Tratamientos Esteticos Previos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {displayMedicalHistory.previousAestheticTreatments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {displayMedicalHistory.previousAestheticTreatments.map((treatment) => (
                          <Badge key={treatment} variant="outline" className="bg-purple-50">{treatment}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin tratamientos previos registrados</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Shield className="h-5 w-5 text-yellow-500" />
                      Informacion Dermatologica
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Fototipo</p>
                        <p className="font-medium">{displayMedicalHistory.skinType ? `Tipo ${displayMedicalHistory.skinType}` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Retinoides</p>
                        <p className="font-medium">{displayMedicalHistory.usesRetinoids ? 'Si' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sol</p>
                        <p className="font-medium capitalize">{displayMedicalHistory.sunExposureLevel || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {displayMedicalHistory.additionalNotes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-5 w-5" />
                      Notas Adicionales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {displayMedicalHistory.additionalNotes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Tab: Citas */}
        <TabsContent value="citas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historial de Citas</CardTitle>
              <Button asChild>
                <Link href={`/agenda/nueva?patientId=${patient.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Cita
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay citas registradas</p>
                <p className="text-sm">Las citas del paciente apareceran aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pagos */}
        <TabsContent value="pagos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>Total gastado: {formatCurrency(patient.total_spent ?? 0)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay pagos registrados</p>
                <p className="text-sm">Los pagos del paciente apareceran aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documentos y Consentimientos</CardTitle>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Subir Documento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay documentos registrados</p>
                <p className="text-sm">Los consentimientos firmados apareceran aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Fotos */}
        <TabsContent value="fotos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Galeria de Fotos</CardTitle>
              <Button variant="outline">
                <Camera className="mr-2 h-4 w-4" />
                Agregar Foto
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay fotos registradas</p>
                <p className="text-sm">Las fotos antes/despues apareceran aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
