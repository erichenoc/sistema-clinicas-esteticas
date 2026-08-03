'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileSignature,
  User,
  FileText,
  Eraser,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CONSENT_CATEGORIES, replaceTemplateVariables } from '@/types/consents'
import { getConsentTemplates, signConsent } from '@/actions/consents'
import { getPatients } from '@/actions/medical-history'

// Paciente y plantilla tal como se necesitan en esta pantalla
interface PatientOption {
  id: string
  name: string
  document: string
  phone: string
  birthDate: string | null
}

interface TemplateOption {
  id: string
  name: string
  description: string | null
  category: string
  content: string
  version: number
  expiryDays: number | null
}

const STEPS = [
  { id: 1, title: 'Selección', description: 'Paciente y plantilla' },
  { id: 2, title: 'Revisión', description: 'Leer contenido' },
  { id: 3, title: 'Firma', description: 'Capturar firma' },
]

export default function FirmarConsentimientoPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [hasSignature, setHasSignature] = useState(false)
  const [patientOpen, setPatientOpen] = useState(false)

  // Datos reales
  const [patients, setPatients] = useState<PatientOption[]>([])
  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPatients(), getConsentTemplates({ isActive: true })])
      .then(([dbPatients, dbTemplates]) => {
        setPatients(
          dbPatients.map((p) => ({
            id: p.id,
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Paciente',
            document: p.document_number || 'Sin documento',
            phone: p.phone || '',
            birthDate: p.date_of_birth || null,
          }))
        )
        setTemplates(
          dbTemplates.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category || 'general',
            content: t.content,
            version: t.version || 1,
            expiryDays: t.expiry_days,
          }))
        )
      })
      .catch(() => toast.error('Error al cargar pacientes y plantillas'))
      .finally(() => setIsLoading(false))
  }, [])

  const patient = patients.find((p) => p.id === selectedPatient)
  const template = templates.find((t) => t.id === selectedTemplate)

  // Canvas drawing functions
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(true)
    setHasSignature(true)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [])

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }, [isDrawing])

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }, [])

  const getSignatureDataUrl = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.toDataURL('image/png')
  }, [])

  // Content with replaced variables
  const getProcessedContent = () => {
    if (!template || !patient) return ''

    const age = patient.birthDate
      ? `${Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / 31557600000)} años`
      : ''
    const now = new Date()

    const variables: Record<string, string> = {
      '{{patient_name}}': patient.name,
      '{{patient_document}}': patient.document,
      '{{patient_birthdate}}': patient.birthDate
        ? new Date(patient.birthDate).toLocaleDateString('es-DO')
        : '',
      '{{patient_age}}': age,
      '{{treatment_name}}': '',
      '{{professional_name}}': '',
      '{{professional_license}}': '',
      '{{date}}': now.toLocaleDateString('es-DO'),
      '{{time}}': now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      '{{clinic_name}}': 'Med Luxe Aesthetics',
      '{{branch_name}}': '',
      '{{branch_address}}': '',
    }

    return replaceTemplateVariables(template.content, variables)
  }

  // Validation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return Boolean(selectedPatient && selectedTemplate)
      case 2:
        return true
      case 3:
        return hasSignature
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!hasSignature || !selectedPatient || !selectedTemplate) return

    const signatureData = getSignatureDataUrl()
    if (!signatureData) {
      toast.error('No se pudo capturar la firma')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await signConsent({
        patientId: selectedPatient,
        templateId: selectedTemplate,
        patientSignatureData: signatureData,
      })

      if (error) {
        toast.error(error)
        return
      }

      toast.success('Consentimiento firmado y archivado')
      router.push('/consentimientos')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/consentimientos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Firmar Consentimiento Informado</h1>
          <p className="text-muted-foreground">
            Captura la firma digital del paciente
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors',
                  currentStep === step.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : currentStep > step.id
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <div className="hidden sm:block ml-2 mr-4">
                <p className={cn(
                  'text-sm font-medium',
                  currentStep === step.id ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-8 sm:w-12 h-0.5 mx-2',
                    currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-3xl mx-auto">
        {/* Step 1: Selection */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Selección de Paciente y Plantilla
              </CardTitle>
              <CardDescription>
                Selecciona el paciente y el tipo de consentimiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <Popover open={patientOpen} onOpenChange={setPatientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={patientOpen}
                      className="w-full justify-between"
                    >
                      {patient ? (
                        <span>
                          {patient.name} - {patient.document}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Buscar paciente...</span>
                      )}
                      <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar por nombre o documento..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron pacientes</CommandEmpty>
                        <CommandGroup>
                          {patients.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={() => {
                                setSelectedPatient(p.id)
                                setPatientOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedPatient === p.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div>
                                <p className="font-medium">{p.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {p.document} · {p.phone}
                                </p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Plantilla de Consentimiento *</Label>
                {!isLoading && templates.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No hay plantillas activas</AlertTitle>
                    <AlertDescription>
                      Crea una plantilla en Consentimientos &gt; Plantillas antes de poder firmar.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-3">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={cn(
                        'p-4 border rounded-lg cursor-pointer transition-colors',
                        selectedTemplate === t.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-sm text-muted-foreground">{t.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {CONSENT_CATEGORIES.find((c) => c.value === t.category)?.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              v{t.version}
                            </span>
                            {t.expiryDays && (
                              <span className="text-xs text-muted-foreground">
                                · Vigencia: {t.expiryDays} días
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedTemplate === t.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => setCurrentStep(2)} disabled={!canProceed()}>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Review Content */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Revisión del Consentimiento
              </CardTitle>
              <CardDescription>
                Lea cuidadosamente el contenido antes de continuar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none bg-muted/50 p-6 rounded-lg max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {getProcessedContent()}
                </pre>

              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button onClick={() => setCurrentStep(3)}>
                He leído y entendido
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Signature */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Firma del Paciente
              </CardTitle>
              <CardDescription>
                El paciente debe firmar en el recuadro de abajo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  Al firmar, <strong>{patient?.name}</strong> confirma que ha leído, entendido y acepta
                  los términos del consentimiento &quot;{template?.name}&quot;.
                </AlertDescription>
              </Alert>

              {/* Signature Canvas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Firma del paciente *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSignature}
                  >
                    <Eraser className="mr-2 h-4 w-4" />
                    Limpiar
                  </Button>
                </div>
                <div className="border-2 border-dashed rounded-lg p-1 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full touch-none cursor-crosshair bg-white"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Firme con el dedo o el mouse dentro del recuadro
                </p>
              </div>

            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!hasSignature || isSubmitting}
                className="min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirmar y Guardar
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
