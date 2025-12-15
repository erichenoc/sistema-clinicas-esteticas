'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  AlertCircle,
  Heart,
  Pill,
  Scissors,
  Sparkles,
  Sun,
  Baby,
  FileText,
  Save,
  Loader2,
  Check,
  ChevronDown,
  Zap,
  Shield,
  Activity,
  Cigarette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { QuickTagSelector } from './quick-tag-selector'
import { cn } from '@/lib/utils'
import {
  COMMON_ALLERGIES,
  CHRONIC_CONDITIONS_OPTIONS,
  FITZPATRICK_OPTIONS,
} from '@/types/patients'

// Opciones predefinidas adicionales
const COMMON_MEDICATIONS = [
  'Metformina',
  'Losartán',
  'Aspirina',
  'Omeprazol',
  'Atorvastatina',
  'Levotiroxina',
  'Lisinopril',
  'Amlodipino',
  'Ibuprofeno',
  'Paracetamol',
  'Anticonceptivos orales',
  'Antidepresivos',
  'Ansiolíticos',
  'Anticoagulantes',
  'Corticosteroides',
]

const COMMON_SURGERIES = [
  'Apendicectomía',
  'Colecistectomía',
  'Cesárea',
  'Histerectomía',
  'Cirugía de tiroides',
  'Cirugía de hernia',
  'Cirugía bariátrica',
  'Liposucción',
  'Rinoplastia',
  'Blefaroplastia',
  'Mastoplastia',
  'Abdominoplastia',
]

const AESTHETIC_TREATMENTS = [
  'Botox',
  'Ácido hialurónico',
  'Plasma rico en plaquetas (PRP)',
  'Peeling químico',
  'Microdermoabrasión',
  'Láser CO2',
  'IPL (Luz pulsada)',
  'Radiofrecuencia',
  'Mesoterapia',
  'Hilos tensores',
  'Criolipólisis',
  'Ultracavitación',
  'Carboxiterapia',
]

const SUN_EXPOSURE_LEVELS = [
  { value: 'low', label: 'Bajo', description: 'Usa protector solar regularmente, evita el sol' },
  { value: 'moderate', label: 'Moderado', description: 'Exposición ocasional, usa protector a veces' },
  { value: 'high', label: 'Alto', description: 'Exposición frecuente sin protección' },
]

export interface MedicalHistoryFormData {
  patientId: string
  allergies: string[]
  currentMedications: string[]
  chronicConditions: string[]
  previousSurgeries: string[]
  previousAestheticTreatments: string[]
  isPregnant: boolean
  isBreastfeeding: boolean
  usesRetinoids: boolean
  hasPacemaker: boolean
  hasMetalImplants: boolean
  hasKeloidTendency: boolean
  isSmoker: boolean
  skinTypeFitzpatrick: string
  sunExposureLevel: string
  additionalNotes: string
}

interface MedicalHistoryEnhancedProps {
  patientId: string
  patientName: string
  initialData?: Partial<MedicalHistoryFormData>
  onSave: (data: MedicalHistoryFormData) => Promise<void>
  onSaveSection?: (section: string, data: Partial<MedicalHistoryFormData>) => Promise<void>
  mode?: 'full' | 'compact'
}

interface SectionStatus {
  hasData: boolean
  isComplete: boolean
}

export function MedicalHistoryEnhanced({
  patientId,
  patientName,
  initialData,
  onSave,
  onSaveSection,
  mode = 'full',
}: MedicalHistoryEnhancedProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [openSections, setOpenSections] = useState<string[]>(['alerts'])

  const [formData, setFormData] = useState<MedicalHistoryFormData>({
    patientId,
    allergies: initialData?.allergies || [],
    currentMedications: initialData?.currentMedications || [],
    chronicConditions: initialData?.chronicConditions || [],
    previousSurgeries: initialData?.previousSurgeries || [],
    previousAestheticTreatments: initialData?.previousAestheticTreatments || [],
    isPregnant: initialData?.isPregnant || false,
    isBreastfeeding: initialData?.isBreastfeeding || false,
    usesRetinoids: initialData?.usesRetinoids || false,
    hasPacemaker: initialData?.hasPacemaker || false,
    hasMetalImplants: initialData?.hasMetalImplants || false,
    hasKeloidTendency: initialData?.hasKeloidTendency || false,
    isSmoker: initialData?.isSmoker || false,
    skinTypeFitzpatrick: initialData?.skinTypeFitzpatrick || '',
    sunExposureLevel: initialData?.sunExposureLevel || '',
    additionalNotes: initialData?.additionalNotes || '',
  })

  // Calculate section status
  const getSectionStatus = useCallback((): Record<string, SectionStatus> => {
    return {
      alerts: {
        hasData: formData.allergies.length > 0 || formData.isPregnant || formData.isBreastfeeding,
        isComplete: true, // Alerts are always "complete"
      },
      conditions: {
        hasData: formData.chronicConditions.length > 0 || formData.currentMedications.length > 0,
        isComplete: true,
      },
      contraindications: {
        hasData: formData.hasPacemaker || formData.hasMetalImplants || formData.hasKeloidTendency || formData.isSmoker,
        isComplete: true,
      },
      history: {
        hasData: formData.previousSurgeries.length > 0 || formData.previousAestheticTreatments.length > 0,
        isComplete: true,
      },
      skin: {
        hasData: !!formData.skinTypeFitzpatrick || !!formData.sunExposureLevel || formData.usesRetinoids,
        isComplete: !!formData.skinTypeFitzpatrick,
      },
      notes: {
        hasData: !!formData.additionalNotes,
        isComplete: true,
      },
    }
  }, [formData])

  const sectionStatus = getSectionStatus()

  // Count alerts for prominent display
  const alertCount = [
    formData.allergies.length > 0,
    formData.isPregnant,
    formData.isBreastfeeding,
    formData.hasPacemaker,
    formData.hasMetalImplants,
  ].filter(Boolean).length

  const handleSaveAll = async () => {
    setIsLoading(true)
    try {
      await onSave(formData)
      setLastSaved(new Date())
      toast.success('Historial médico guardado correctamente')
    } catch {
      toast.error('Error al guardar el historial médico')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSection = async (section: string) => {
    if (!onSaveSection) return
    setSavingSection(section)
    try {
      await onSaveSection(section, formData)
      setLastSaved(new Date())
      toast.success('Sección guardada')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSavingSection(null)
    }
  }

  const updateField = <K extends keyof MedicalHistoryFormData>(
    field: K,
    value: MedicalHistoryFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const SectionHeader = ({
    icon: Icon,
    title,
    subtitle,
    status,
    alertBadge,
    iconColor,
  }: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    subtitle?: string
    status?: SectionStatus
    alertBadge?: number
    iconColor?: string
  }) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', iconColor || 'bg-muted')}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{title}</span>
            {alertBadge && alertBadge > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5">
                {alertBadge}
              </Badge>
            )}
          </div>
          {subtitle && (
            <span className="text-sm text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </div>
      {status && (
        <div className="flex items-center gap-2 mr-4">
          {status.hasData && (
            <Badge variant="outline" className="gap-1">
              <Check className="h-3 w-3" />
              Datos
            </Badge>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header with Patient Name and Save Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Historial Médico</h2>
          <p className="text-sm text-muted-foreground">{patientName}</p>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Guardado: {lastSaved.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button onClick={handleSaveAll} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Todo
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner - Always Visible */}
      {alertCount > 0 && (
        <Card className="border-red-300 bg-gradient-to-r from-red-50 to-orange-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 mb-2">
                  {alertCount} Alerta{alertCount > 1 ? 's' : ''} Importante{alertCount > 1 ? 's' : ''}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.map((allergy) => (
                    <Badge key={allergy} variant="destructive">
                      Alergia: {allergy}
                    </Badge>
                  ))}
                  {formData.isPregnant && (
                    <Badge className="bg-pink-500">Embarazada</Badge>
                  )}
                  {formData.isBreastfeeding && (
                    <Badge className="bg-pink-500">Lactando</Badge>
                  )}
                  {formData.hasPacemaker && (
                    <Badge variant="destructive">Marcapasos</Badge>
                  )}
                  {formData.hasMetalImplants && (
                    <Badge variant="destructive">Implantes Metálicos</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accordion Sections */}
      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="space-y-3"
      >
        {/* Section 1: Alertas y Alergias */}
        <AccordionItem value="alerts" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <SectionHeader
              icon={AlertCircle}
              title="Alertas y Alergias"
              subtitle="Información crítica de seguridad"
              status={sectionStatus.alerts}
              alertBadge={formData.allergies.length}
              iconColor="bg-red-100 text-red-600"
            />
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <div className="space-y-6">
              <QuickTagSelector
                label="Alergias Conocidas"
                selectedTags={formData.allergies}
                suggestedTags={COMMON_ALLERGIES}
                onChange={(tags) => updateField('allergies', tags)}
                placeholder="Buscar alergia o escribir nueva..."
                variant="destructive"
              />

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <Card className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  formData.isPregnant && 'ring-2 ring-pink-500 bg-pink-50'
                )}
                onClick={() => updateField('isPregnant', !formData.isPregnant)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Baby className="h-5 w-5 text-pink-500" />
                      <div>
                        <p className="font-medium">Embarazada</p>
                        <p className="text-xs text-muted-foreground">Contraindicaciones especiales</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.isPregnant}
                      onCheckedChange={(v) => updateField('isPregnant', v)}
                    />
                  </CardContent>
                </Card>

                <Card className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  formData.isBreastfeeding && 'ring-2 ring-pink-500 bg-pink-50'
                )}
                onClick={() => updateField('isBreastfeeding', !formData.isBreastfeeding)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Baby className="h-5 w-5 text-pink-500" />
                      <div>
                        <p className="font-medium">Lactando</p>
                        <p className="text-xs text-muted-foreground">Período de lactancia</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.isBreastfeeding}
                      onCheckedChange={(v) => updateField('isBreastfeeding', v)}
                    />
                  </CardContent>
                </Card>
              </div>

              {onSaveSection && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveSection('alerts')}
                    disabled={savingSection === 'alerts'}
                  >
                    {savingSection === 'alerts' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Guardar sección'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: Contraindicaciones */}
        <AccordionItem value="contraindications" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <SectionHeader
              icon={Shield}
              title="Contraindicaciones"
              subtitle="Condiciones que afectan tratamientos"
              status={sectionStatus.contraindications}
              iconColor="bg-orange-100 text-orange-600"
            />
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { field: 'hasPacemaker' as const, label: 'Marcapasos', icon: Zap, desc: 'Dispositivo cardíaco implantado' },
                { field: 'hasMetalImplants' as const, label: 'Implantes Metálicos', icon: Shield, desc: 'Placas, tornillos, prótesis' },
                { field: 'hasKeloidTendency' as const, label: 'Tendencia a Queloides', icon: Activity, desc: 'Cicatrización anormal' },
                { field: 'isSmoker' as const, label: 'Fumador', icon: Cigarette, desc: 'Afecta cicatrización y recuperación' },
              ].map(({ field, label, icon: Icon, desc }) => (
                <Card
                  key={field}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    formData[field] && 'ring-2 ring-orange-500 bg-orange-50'
                  )}
                  onClick={() => updateField(field, !formData[field])}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData[field]}
                      onCheckedChange={(v) => updateField(field, v)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Condiciones y Medicamentos */}
        <AccordionItem value="conditions" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <SectionHeader
              icon={Heart}
              title="Condiciones y Medicamentos"
              subtitle="Enfermedades crónicas y tratamientos actuales"
              status={sectionStatus.conditions}
              iconColor="bg-pink-100 text-pink-600"
            />
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <div className="space-y-6">
              <QuickTagSelector
                label="Condiciones Crónicas"
                selectedTags={formData.chronicConditions}
                suggestedTags={CHRONIC_CONDITIONS_OPTIONS}
                onChange={(tags) => updateField('chronicConditions', tags)}
                placeholder="Buscar condición o escribir nueva..."
              />

              <Separator />

              <QuickTagSelector
                label="Medicamentos Actuales"
                selectedTags={formData.currentMedications}
                suggestedTags={COMMON_MEDICATIONS}
                onChange={(tags) => updateField('currentMedications', tags)}
                placeholder="Buscar medicamento o escribir nuevo..."
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: Historial Quirúrgico y Estético */}
        <AccordionItem value="history" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <SectionHeader
              icon={Scissors}
              title="Historial Quirúrgico y Estético"
              subtitle="Procedimientos anteriores"
              status={sectionStatus.history}
              iconColor="bg-purple-100 text-purple-600"
            />
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <div className="space-y-6">
              <QuickTagSelector
                label="Cirugías Previas"
                selectedTags={formData.previousSurgeries}
                suggestedTags={COMMON_SURGERIES}
                onChange={(tags) => updateField('previousSurgeries', tags)}
                placeholder="Buscar cirugía o escribir nueva..."
              />

              <Separator />

              <QuickTagSelector
                label="Tratamientos Estéticos Previos"
                selectedTags={formData.previousAestheticTreatments}
                suggestedTags={AESTHETIC_TREATMENTS}
                onChange={(tags) => updateField('previousAestheticTreatments', tags)}
                placeholder="Buscar tratamiento o escribir nuevo..."
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: Información Dermatológica */}
        <AccordionItem value="skin" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <SectionHeader
              icon={Sun}
              title="Información Dermatológica"
              subtitle="Tipo de piel y exposición solar"
              status={sectionStatus.skin}
              iconColor="bg-yellow-100 text-yellow-600"
            />
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <div className="space-y-6">
              {/* Fitzpatrick Skin Type - Visual Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Fototipo de Piel (Fitzpatrick)</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  {FITZPATRICK_OPTIONS.map((option) => (
                    <Card
                      key={option.value}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-md',
                        formData.skinTypeFitzpatrick === option.value && 'ring-2 ring-primary bg-primary/5'
                      )}
                      onClick={() => updateField('skinTypeFitzpatrick', option.value)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="h-4 w-4 rounded-full border"
                            style={{
                              backgroundColor: {
                                I: '#FFE4D1',
                                II: '#F5D5C8',
                                III: '#D4A574',
                                IV: '#B07D4F',
                                V: '#8B5A2B',
                                VI: '#5D3A1A',
                              }[option.value],
                            }}
                          />
                          <span className="font-medium">{option.label}</span>
                          {formData.skinTypeFitzpatrick === option.value && (
                            <Check className="h-4 w-4 text-primary ml-auto" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Sun Exposure Level */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Nivel de Exposición Solar</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  {SUN_EXPOSURE_LEVELS.map((level) => (
                    <Card
                      key={level.value}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-md',
                        formData.sunExposureLevel === level.value && 'ring-2 ring-yellow-500 bg-yellow-50'
                      )}
                      onClick={() => updateField('sunExposureLevel', level.value)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{level.label}</span>
                          {formData.sunExposureLevel === level.value && (
                            <Check className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{level.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Retinoids Usage */}
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  formData.usesRetinoids && 'ring-2 ring-blue-500 bg-blue-50'
                )}
                onClick={() => updateField('usesRetinoids', !formData.usesRetinoids)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Usa Retinoides</p>
                      <p className="text-xs text-muted-foreground">
                        Tretinoína, Adapaleno, Retinol u otros derivados de vitamina A
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.usesRetinoids}
                    onCheckedChange={(v) => updateField('usesRetinoids', v)}
                  />
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 6: Notas Adicionales */}
        <AccordionItem value="notes" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <SectionHeader
              icon={FileText}
              title="Notas Adicionales"
              subtitle="Observaciones y comentarios importantes"
              status={sectionStatus.notes}
              iconColor="bg-gray-100 text-gray-600"
            />
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <Textarea
              value={formData.additionalNotes}
              onChange={(e) => updateField('additionalNotes', e.target.value)}
              placeholder="Antecedentes familiares, observaciones especiales, recomendaciones del médico..."
              rows={5}
              className="resize-none"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Floating Save Button on Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button
          onClick={handleSaveAll}
          disabled={isLoading}
          size="lg"
          className="rounded-full shadow-lg h-14 w-14 p-0"
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Save className="h-6 w-6" />
          )}
        </Button>
      </div>
    </div>
  )
}
