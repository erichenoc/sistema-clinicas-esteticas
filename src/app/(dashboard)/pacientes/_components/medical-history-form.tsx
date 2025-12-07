'use client'

import { useState } from 'react'
import { X, Plus, AlertCircle, Heart, Pill, Scissors, Sparkles, Sun, Baby, FileText, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

export interface MedicalHistoryData {
  id?: string
  patientId: string
  allergies: string[]
  currentMedications: string[]
  chronicConditions: string[]
  previousSurgeries: string[]
  previousAestheticTreatments: string[]
  isPregnant: boolean
  isBreastfeeding: boolean
  usesRetinoids: boolean
  sunExposureLevel: string
  additionalNotes: string
}

interface MedicalHistoryFormProps {
  patientId: string
  initialData?: Partial<MedicalHistoryData>
  onSave?: (data: MedicalHistoryData) => Promise<void>
  readOnly?: boolean
}

const sunExposureLevels = [
  { value: 'low', label: 'Bajo - Usa protector solar regularmente' },
  { value: 'moderate', label: 'Moderado - Exposición ocasional' },
  { value: 'high', label: 'Alto - Exposición frecuente sin protección' },
]

function TagInput({
  label,
  icon: Icon,
  values,
  onChange,
  placeholder,
  variant = 'default',
  readOnly = false,
}: {
  label: string
  icon: React.ElementType
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
  variant?: 'default' | 'destructive'
  readOnly?: boolean
}) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    if (inputValue.trim() && !values.includes(inputValue.trim())) {
      onChange([...values, inputValue.trim()])
      setInputValue('')
    }
  }

  const handleRemove = (value: string) => {
    onChange(values.filter((v) => v !== value))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${variant === 'destructive' ? 'text-red-500' : ''}`} />
        {label}
      </Label>
      {!readOnly && (
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={handleAdd} disabled={!inputValue.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {values.length > 0 ? (
          values.map((value) => (
            <Badge
              key={value}
              variant={variant === 'destructive' ? 'destructive' : 'secondary'}
              className="gap-1 pr-1"
            >
              {value}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemove(value)}
                  className="ml-1 rounded-full hover:bg-black/10 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">
            {readOnly ? 'Sin registros' : 'Sin registros - Agrega uno'}
          </span>
        )}
      </div>
    </div>
  )
}

export function MedicalHistoryForm({
  patientId,
  initialData,
  onSave,
  readOnly = false,
}: MedicalHistoryFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<MedicalHistoryData>({
    patientId,
    allergies: initialData?.allergies || [],
    currentMedications: initialData?.currentMedications || [],
    chronicConditions: initialData?.chronicConditions || [],
    previousSurgeries: initialData?.previousSurgeries || [],
    previousAestheticTreatments: initialData?.previousAestheticTreatments || [],
    isPregnant: initialData?.isPregnant || false,
    isBreastfeeding: initialData?.isBreastfeeding || false,
    usesRetinoids: initialData?.usesRetinoids || false,
    sunExposureLevel: initialData?.sunExposureLevel || '',
    additionalNotes: initialData?.additionalNotes || '',
  })

  const handleSave = async () => {
    if (!onSave) return
    setIsLoading(true)
    try {
      await onSave(formData)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Alertas Importantes */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alertas Importantes
          </CardTitle>
          <CardDescription>Información crítica para el tratamiento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TagInput
            label="Alergias"
            icon={AlertCircle}
            values={formData.allergies}
            onChange={(allergies) => setFormData({ ...formData, allergies })}
            placeholder="Ej: Lidocaína, Penicilina..."
            variant="destructive"
            readOnly={readOnly}
          />
        </CardContent>
      </Card>

      {/* Condiciones y Medicamentos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Condiciones Crónicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              label=""
              icon={Heart}
              values={formData.chronicConditions}
              onChange={(chronicConditions) => setFormData({ ...formData, chronicConditions })}
              placeholder="Ej: Diabetes, Hipertensión..."
              readOnly={readOnly}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-blue-500" />
              Medicamentos Actuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              label=""
              icon={Pill}
              values={formData.currentMedications}
              onChange={(currentMedications) => setFormData({ ...formData, currentMedications })}
              placeholder="Ej: Metformina 500mg..."
              readOnly={readOnly}
            />
          </CardContent>
        </Card>
      </div>

      {/* Historial Quirúrgico y Estético */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-gray-500" />
              Cirugías Previas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              label=""
              icon={Scissors}
              values={formData.previousSurgeries}
              onChange={(previousSurgeries) => setFormData({ ...formData, previousSurgeries })}
              placeholder="Ej: Colecistectomía 2020..."
              readOnly={readOnly}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Tratamientos Estéticos Previos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              label=""
              icon={Sparkles}
              values={formData.previousAestheticTreatments}
              onChange={(previousAestheticTreatments) =>
                setFormData({ ...formData, previousAestheticTreatments })
              }
              placeholder="Ej: Botox 2023, Ácido hialurónico..."
              readOnly={readOnly}
            />
          </CardContent>
        </Card>
      </div>

      {/* Condiciones Especiales y Exposición Solar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-pink-400" />
            Condiciones Especiales
          </CardTitle>
          <CardDescription>Factores importantes para tratamientos estéticos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="pregnant" className="cursor-pointer">
                ¿Embarazada?
              </Label>
              <Switch
                id="pregnant"
                checked={formData.isPregnant}
                onCheckedChange={(isPregnant) => setFormData({ ...formData, isPregnant })}
                disabled={readOnly}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="breastfeeding" className="cursor-pointer">
                ¿Lactando?
              </Label>
              <Switch
                id="breastfeeding"
                checked={formData.isBreastfeeding}
                onCheckedChange={(isBreastfeeding) => setFormData({ ...formData, isBreastfeeding })}
                disabled={readOnly}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="retinoids" className="cursor-pointer">
                ¿Usa Retinoides?
              </Label>
              <Switch
                id="retinoids"
                checked={formData.usesRetinoids}
                onCheckedChange={(usesRetinoids) => setFormData({ ...formData, usesRetinoids })}
                disabled={readOnly}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-yellow-500" />
              Nivel de Exposición Solar
            </Label>
            <Select
              value={formData.sunExposureLevel}
              onValueChange={(sunExposureLevel) => setFormData({ ...formData, sunExposureLevel })}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nivel de exposición" />
              </SelectTrigger>
              <SelectContent>
                {sunExposureLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notas Adicionales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            Notas Adicionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.additionalNotes}
            onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
            placeholder="Observaciones importantes, antecedentes familiares, recomendaciones especiales..."
            rows={4}
            disabled={readOnly}
          />
        </CardContent>
      </Card>

      {/* Botón Guardar */}
      {!readOnly && onSave && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Historial Médico
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

interface MedicalHistoryDialogProps {
  patientId: string
  patientName: string
  initialData?: Partial<MedicalHistoryData>
  onSave?: (data: MedicalHistoryData) => Promise<void>
  trigger?: React.ReactNode
}

export function MedicalHistoryDialog({
  patientId,
  patientName,
  initialData,
  onSave,
  trigger,
}: MedicalHistoryDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSave = async (data: MedicalHistoryData) => {
    if (onSave) {
      await onSave(data)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Editar Historial Médico
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial Médico - {patientName}</DialogTitle>
          <DialogDescription>
            Complete o actualice el historial médico del paciente
          </DialogDescription>
        </DialogHeader>
        <MedicalHistoryForm
          patientId={patientId}
          initialData={initialData}
          onSave={handleSave}
        />
      </DialogContent>
    </Dialog>
  )
}
