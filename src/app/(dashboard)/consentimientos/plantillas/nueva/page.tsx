'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  Info,
  FileText,
  AlertTriangle,
  Heart,
  Shield,
  GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { consentTemplateSchema, type ConsentTemplateFormData } from '@/lib/validations/consents'
import { CONSENT_CATEGORIES, TEMPLATE_VARIABLES, DEFAULT_CONSENT_TEMPLATE } from '@/types/consents'

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'boolean', label: 'Sí/No' },
  { value: 'select', label: 'Selección' },
]

export default function NuevaPlantillaPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('content')
  const [showPreview, setShowPreview] = useState(false)

  const form = useForm<ConsentTemplateFormData>({
    resolver: zodResolver(consentTemplateSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      category: 'general',
      treatmentIds: [],
      content: DEFAULT_CONSENT_TEMPLATE,
      risksSection: '',
      alternativesSection: '',
      contraindicationsSection: '',
      aftercareSection: '',
      requiredFields: [],
      isActive: true,
      isRequired: false,
      requiresWitness: false,
      requiresPhotoId: false,
      expiryDays: 365,
    },
  })

  const { fields: requiredFields, append: addField, remove: removeField } = useFieldArray({
    control: form.control,
    name: 'requiredFields',
  })

  const onSubmit = (data: ConsentTemplateFormData) => {
    console.log('Nueva plantilla:', data)
    // TODO: Enviar a API
    router.push('/consentimientos')
  }

  const insertVariable = (variable: string) => {
    const currentContent = form.getValues('content')
    form.setValue('content', currentContent + variable)
  }

  const previewContent = () => {
    let content = form.getValues('content')
    // Reemplazar variables con ejemplos
    TEMPLATE_VARIABLES.forEach((v) => {
      content = content.replace(new RegExp(v.key.replace(/[{}]/g, '\\$&'), 'g'), v.example)
    })
    return content
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
          <h1 className="text-2xl font-bold tracking-tight">Nueva Plantilla de Consentimiento</h1>
          <p className="text-muted-foreground">
            Crea una plantilla reutilizable para consentimientos informados
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
          <Eye className="mr-2 h-4 w-4" />
          {showPreview ? 'Ocultar' : 'Vista Previa'}
        </Button>
        <Button onClick={form.handleSubmit(onSubmit)}>
          <Save className="mr-2 h-4 w-4" />
          Guardar Plantilla
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información básica */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la plantilla *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Consentimiento para Botox" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: CON-001" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>Identificador único interno</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe brevemente el propósito de esta plantilla..."
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CONSENT_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  <div>
                                    <span>{cat.label}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {cat.description}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expiryDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vigencia (días)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="365"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormDescription>Dejar vacío para vigencia indefinida</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contenido de la plantilla */}
              <Card>
                <CardHeader>
                  <CardTitle>Contenido del Consentimiento</CardTitle>
                  <CardDescription>
                    Usa las variables para personalizar el contenido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="content">
                        <FileText className="mr-2 h-4 w-4" />
                        Contenido Principal
                      </TabsTrigger>
                      <TabsTrigger value="risks">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Riesgos
                      </TabsTrigger>
                      <TabsTrigger value="care">
                        <Heart className="mr-2 h-4 w-4" />
                        Cuidados
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4">
                      {/* Variables disponibles */}
                      <div className="rounded-lg border p-3 bg-muted/50">
                        <p className="text-sm font-medium mb-2">Variables disponibles:</p>
                        <div className="flex flex-wrap gap-1">
                          {TEMPLATE_VARIABLES.slice(0, 8).map((v) => (
                            <Button
                              key={v.key}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => insertVariable(v.key)}
                            >
                              {v.key}
                            </Button>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                          >
                            Ver todas...
                          </Button>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Escribe el contenido del consentimiento..."
                                className="min-h-[400px] font-mono text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Soporta formato Markdown. Usa las variables entre llaves dobles.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="risks" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="risksSection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Riesgos del Procedimiento</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe los posibles riesgos y efectos secundarios..."
                                className="min-h-[200px]"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contraindicationsSection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraindicaciones</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Lista las contraindicaciones del tratamiento..."
                                className="min-h-[150px]"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="alternativesSection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alternativas al Tratamiento</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Menciona las alternativas disponibles..."
                                className="min-h-[100px]"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="care" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="aftercareSection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cuidados Post-tratamiento</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Instrucciones de cuidado después del tratamiento..."
                                className="min-h-[300px]"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormDescription>
                              Estas instrucciones se incluirán en el consentimiento
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Campos adicionales */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Campos Adicionales</CardTitle>
                      <CardDescription>
                        Campos personalizados que el paciente debe completar
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        addField({
                          key: '',
                          label: '',
                          type: 'text',
                          required: false,
                        })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Campo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {requiredFields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No hay campos adicionales configurados</p>
                      <p className="text-sm">
                        Agrega campos para recopilar información específica del paciente
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requiredFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-start gap-4 p-4 border rounded-lg"
                        >
                          <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                          <div className="flex-1 grid gap-4 sm:grid-cols-4">
                            <FormField
                              control={form.control}
                              name={`requiredFields.${index}.key`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Clave</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="peso_kg"
                                      {...field}
                                      className="font-mono text-sm"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`requiredFields.${index}.label`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Etiqueta</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Peso (kg)" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`requiredFields.${index}.type`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Tipo</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {FIELD_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`requiredFields.${index}.required`}
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0 pt-6">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-xs">Obligatorio</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeField(index)}
                            className="mt-6"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Configuración */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Configuración
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Plantilla Activa</FormLabel>
                          <FormDescription className="text-xs">
                            Disponible para usar en consentimientos
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Obligatoria</FormLabel>
                          <FormDescription className="text-xs">
                            Requerida antes del tratamiento
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requiresWitness"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Requiere Testigo</FormLabel>
                          <FormDescription className="text-xs">
                            Firma de un testigo adicional
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requiresPhotoId"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Foto de Identificación</FormLabel>
                          <FormDescription className="text-xs">
                            Capturar foto del documento
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Preview */}
              {showPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Vista Previa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                        {previewContent()}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Variables Reference */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Variables Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="variables">
                      <AccordionTrigger className="text-sm">
                        Ver todas las variables
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {TEMPLATE_VARIABLES.map((v) => (
                            <div
                              key={v.key}
                              className="flex items-center justify-between text-xs"
                            >
                              <code className="bg-muted px-1 rounded">{v.key}</code>
                              <span className="text-muted-foreground">{v.label}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
