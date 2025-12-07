'use client'

import { useState, useRef, useCallback } from 'react'
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
  Download,
  Camera,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { ConsentTemplate, SignedConsentInput } from '@/types/consents'
import { CONSENT_CATEGORIES, replaceTemplateVariables, DEFAULT_CONSENT_TEMPLATE } from '@/types/consents'

// Mock data
const mockPatients = [
  { id: 'p1', name: 'María García López', document: '12345678A', phone: '5512345678' },
  { id: 'p2', name: 'Carlos Rodríguez', document: '87654321B', phone: '5598765432' },
  { id: 'p3', name: 'Laura Fernández', document: '11223344C', phone: '5511223344' },
  { id: 'p4', name: 'Ana Martínez Ruiz', document: '55667788D', phone: '5555667788' },
]

const mockTemplates: ConsentTemplate[] = [
  {
    id: '1',
    clinicId: '1',
    name: 'Consentimiento General de Tratamiento',
    code: 'CON-001',
    description: 'Consentimiento básico para todos los tratamientos',
    category: 'general',
    treatmentIds: [],
    content: DEFAULT_CONSENT_TEMPLATE,
    risksSection: null,
    alternativesSection: null,
    contraindicationsSection: null,
    aftercareSection: null,
    requiredFields: [
      { key: 'allergies_confirmed', label: 'He informado sobre todas mis alergias', type: 'boolean', required: true },
      { key: 'medications_confirmed', label: 'He informado sobre todos mis medicamentos', type: 'boolean', required: true },
    ],
    version: 1,
    isCurrent: true,
    previousVersionId: null,
    isActive: true,
    isRequired: true,
    requiresWitness: false,
    requiresPhotoId: false,
    expiryDays: 365,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    createdBy: '1',
  },
  {
    id: '2',
    clinicId: '1',
    name: 'Consentimiento para Botox',
    code: 'CON-002',
    description: 'Consentimiento específico para aplicación de toxina botulínica',
    category: 'inyectable',
    treatmentIds: [],
    content: '# Consentimiento para Botox\n\nYo, {{patient_name}}, autorizo...',
    risksSection: 'Posibles efectos secundarios incluyen: hinchazón temporal, moretones...',
    alternativesSection: null,
    contraindicationsSection: 'No se debe aplicar si: está embarazada, en lactancia...',
    aftercareSection: 'Evitar ejercicio intenso por 24 horas...',
    requiredFields: [
      { key: 'pregnant', label: '¿Está embarazada o en período de lactancia?', type: 'boolean', required: true },
      { key: 'previous_botox', label: '¿Ha tenido aplicaciones previas de Botox?', type: 'boolean', required: true },
    ],
    version: 2,
    isCurrent: true,
    previousVersionId: null,
    isActive: true,
    isRequired: true,
    requiresWitness: false,
    requiresPhotoId: false,
    expiryDays: 180,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z',
    createdBy: '1',
  },
]

const STEPS = [
  { id: 1, title: 'Selección', description: 'Paciente y plantilla' },
  { id: 2, title: 'Revisión', description: 'Leer contenido' },
  { id: 3, title: 'Campos', description: 'Información adicional' },
  { id: 4, title: 'Firma', description: 'Capturar firma' },
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
  const [additionalFields, setAdditionalFields] = useState<Record<string, unknown>>({})
  const [hasSignature, setHasSignature] = useState(false)
  const [patientOpen, setPatientOpen] = useState(false)

  const patient = mockPatients.find((p) => p.id === selectedPatient)
  const template = mockTemplates.find((t) => t.id === selectedTemplate)

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

    const variables: Record<string, string> = {
      '{{patient_name}}': patient.name,
      '{{patient_document}}': patient.document,
      '{{patient_birthdate}}': '15/03/1990', // Mock
      '{{patient_age}}': '34 años', // Mock
      '{{treatment_name}}': 'Tratamiento seleccionado',
      '{{professional_name}}': 'Dr. Juan Pérez', // Mock
      '{{professional_license}}': '12345678', // Mock
      '{{date}}': new Date().toLocaleDateString('es-MX'),
      '{{time}}': new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      '{{clinic_name}}': 'Clínica Estética', // Mock
      '{{branch_name}}': 'Sucursal Centro', // Mock
      '{{branch_address}}': 'Av. Principal 123', // Mock
    }

    return replaceTemplateVariables(template.content, variables)
  }

  // Validation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPatient && selectedTemplate
      case 2:
        return true
      case 3:
        if (!template) return true
        const requiredFields = template.requiredFields.filter((f) => f.required)
        return requiredFields.every((f) => {
          const value = additionalFields[f.key]
          if (f.type === 'boolean') return value === true || value === false
          return value !== undefined && value !== ''
        })
      case 4:
        return hasSignature
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!hasSignature || !selectedPatient || !selectedTemplate) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const signatureData = getSignatureDataUrl()
    console.log('Consent data:', {
      patientId: selectedPatient,
      templateId: selectedTemplate,
      additionalFields,
      signatureDataUrl: signatureData?.substring(0, 50) + '...',
    })

    setIsSubmitting(false)
    router.push('/consentimientos?success=true')
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
                          {mockPatients.map((p) => (
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
                <div className="grid gap-3">
                  {mockTemplates.map((t) => (
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

                {template?.risksSection && (
                  <>
                    <Separator className="my-4" />
                    <h4 className="text-red-600">Riesgos del Procedimiento</h4>
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {template.risksSection}
                    </pre>
                  </>
                )}

                {template?.contraindicationsSection && (
                  <>
                    <Separator className="my-4" />
                    <h4 className="text-amber-600">Contraindicaciones</h4>
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {template.contraindicationsSection}
                    </pre>
                  </>
                )}

                {template?.aftercareSection && (
                  <>
                    <Separator className="my-4" />
                    <h4 className="text-green-600">Cuidados Post-tratamiento</h4>
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {template.aftercareSection}
                    </pre>
                  </>
                )}
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

        {/* Step 3: Additional Fields */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
              <CardDescription>
                Complete los siguientes campos requeridos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {template?.requiredFields && template.requiredFields.length > 0 ? (
                template.requiredFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    {field.type === 'boolean' ? (
                      <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <Checkbox
                          id={field.key}
                          checked={additionalFields[field.key] === true}
                          onCheckedChange={(checked) =>
                            setAdditionalFields({
                              ...additionalFields,
                              [field.key]: checked,
                            })
                          }
                        />
                        <Label htmlFor={field.key} className="cursor-pointer">
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                      </div>
                    ) : (
                      <>
                        <Label htmlFor={field.key}>
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Input
                          id={field.key}
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          placeholder={field.placeholder}
                          value={(additionalFields[field.key] as string) || ''}
                          onChange={(e) =>
                            setAdditionalFields({
                              ...additionalFields,
                              [field.key]: e.target.value,
                            })
                          }
                        />
                      </>
                    )}
                  </div>
                ))
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Sin campos adicionales</AlertTitle>
                  <AlertDescription>
                    Esta plantilla no requiere información adicional. Continúe al siguiente paso.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button onClick={() => setCurrentStep(4)} disabled={!canProceed()}>
                Continuar a Firma
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Signature */}
        {currentStep === 4 && (
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

              {/* Photo ID (if required) */}
              {template?.requiresPhotoId && (
                <div className="space-y-2">
                  <Label>Foto de identificación</Label>
                  <Button variant="outline" className="w-full h-32 flex-col gap-2">
                    <Camera className="h-8 w-8" />
                    <span>Capturar foto de identificación</span>
                  </Button>
                </div>
              )}

              {/* Witness (if required) */}
              {template?.requiresWitness && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Testigo</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nombre del testigo *</Label>
                      <Input placeholder="Nombre completo" />
                    </div>
                    <div className="space-y-2">
                      <Label>Documento de identidad *</Label>
                      <Input placeholder="Número de documento" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Firma del testigo</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 h-32 flex items-center justify-center text-muted-foreground">
                      Área de firma del testigo
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
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
