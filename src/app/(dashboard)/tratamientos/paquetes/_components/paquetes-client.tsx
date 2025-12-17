'use client'

import { useState, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Package,
  Loader2,
  X,
  Calendar,
  Percent,
  Clock,
  Mail,
  Download,
  Search,
  UserPlus,
  User,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  createPackage,
  updatePackage,
  deletePackage,
  sendPackageEmail,
  type PackageData,
  type TreatmentForPackage,
} from '@/actions/treatments'
import {
  searchPatients,
  createPatient,
  type PatientData,
  type CreatePatientInput,
} from '@/actions/patients'
import { DownloadPackagePDF } from '@/components/pdf/download-package-pdf'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'

// Schema para el formulario
const packageFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['bundle', 'sessions_pack']),
  items: z.array(z.object({
    treatmentId: z.string().min(1, 'Selecciona un tratamiento'),
    quantity: z.number().int().min(1, 'Mínimo 1'),
  })).min(1, 'Agrega al menos un tratamiento'),
  regularPrice: z.number().positive('Debe ser mayor a 0'),
  salePrice: z.number().positive('Debe ser mayor a 0'),
  validityDays: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean(),
})

type PackageFormValues = z.infer<typeof packageFormSchema>

interface PaquetesClientProps {
  packages: PackageData[]
  treatments: TreatmentForPackage[]
}

export function PaquetesClient({ packages: initialPackages, treatments }: PaquetesClientProps) {
  const [packages, setPackages] = useState(initialPackages)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PackageData | null>(null)
  const [isPending, startTransition] = useTransition()

  // Email dialog state
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [selectedPackageForEmail, setSelectedPackageForEmail] = useState<PackageData | null>(null)
  const [emailForm, setEmailForm] = useState({ email: '', name: '' })
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Patient search state
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [patientSearchResults, setPatientSearchResults] = useState<PatientData[]>([])
  const [isSearchingPatients, setIsSearchingPatients] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null)
  const [emailDialogTab, setEmailDialogTab] = useState<'existing' | 'new'>('existing')

  // New patient form state
  const [newPatientForm, setNewPatientForm] = useState<CreatePatientInput>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })
  const [isCreatingPatient, setIsCreatingPatient] = useState(false)

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'sessions_pack',
      items: [{ treatmentId: '', quantity: 1 }],
      regularPrice: 0,
      salePrice: 0,
      validityDays: 90,
      isActive: true,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const watchItems = form.watch('items')
  const watchType = form.watch('type')

  // Calcular precio regular automáticamente
  const calculateRegularPrice = () => {
    return watchItems.reduce((total, item) => {
      const treatment = treatments.find((t) => t.id === item.treatmentId)
      return total + (treatment?.price || 0) * (item.quantity || 0)
    }, 0)
  }

  const calculateDiscount = () => {
    const regular = form.watch('regularPrice')
    const sale = form.watch('salePrice')
    if (regular > 0 && sale > 0) {
      return Math.round(((regular - sale) / regular) * 100)
    }
    return 0
  }

  const openCreateDialog = () => {
    setEditingPackage(null)
    form.reset({
      name: '',
      description: '',
      type: 'sessions_pack',
      items: [{ treatmentId: '', quantity: 1 }],
      regularPrice: 0,
      salePrice: 0,
      validityDays: 90,
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (pkg: PackageData) => {
    setEditingPackage(pkg)
    form.reset({
      name: pkg.name,
      description: pkg.description || '',
      type: pkg.type,
      items: pkg.items.map((item) => ({
        treatmentId: item.treatmentId,
        quantity: item.quantity,
      })),
      regularPrice: pkg.regularPrice,
      salePrice: pkg.salePrice,
      validityDays: pkg.validityDays,
      isActive: pkg.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deletePackage(id)
      if (result.success) {
        setPackages(packages.filter((p) => p.id !== id))
        toast.success('Paquete eliminado')
      } else {
        toast.error(result.error || 'Error al eliminar')
      }
    })
  }

  const openEmailDialog = (pkg: PackageData) => {
    setSelectedPackageForEmail(pkg)
    setEmailForm({ email: '', name: '' })
    setSelectedPatient(null)
    setPatientSearchQuery('')
    setPatientSearchResults([])
    setEmailDialogTab('existing')
    setNewPatientForm({ first_name: '', last_name: '', email: '', phone: '' })
    setIsEmailDialogOpen(true)
  }

  // Debounced patient search
  const handlePatientSearch = useCallback(async (query: string) => {
    setPatientSearchQuery(query)
    if (query.length < 2) {
      setPatientSearchResults([])
      return
    }

    setIsSearchingPatients(true)
    try {
      const results = await searchPatients(query)
      setPatientSearchResults(results)
    } catch (error) {
      console.error('Error searching patients:', error)
      setPatientSearchResults([])
    } finally {
      setIsSearchingPatients(false)
    }
  }, [])

  const selectPatient = (patient: PatientData) => {
    setSelectedPatient(patient)
    setEmailForm({
      name: `${patient.first_name} ${patient.last_name}`,
      email: patient.email || '',
    })
    setPatientSearchResults([])
    setPatientSearchQuery('')
  }

  const clearSelectedPatient = () => {
    setSelectedPatient(null)
    setEmailForm({ email: '', name: '' })
  }

  const handleCreateNewPatient = async () => {
    if (!newPatientForm.first_name || !newPatientForm.last_name || !newPatientForm.email || !newPatientForm.phone) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    setIsCreatingPatient(true)
    try {
      const result = await createPatient(newPatientForm)
      if (result.data) {
        toast.success('Paciente creado exitosamente')
        selectPatient(result.data)
        setEmailDialogTab('existing')
      } else {
        toast.error(result.error || 'Error al crear el paciente')
      }
    } catch (error) {
      toast.error('Error al crear el paciente')
    } finally {
      setIsCreatingPatient(false)
    }
  }

  const handleSendEmail = async () => {
    if (!selectedPackageForEmail || !emailForm.email || !emailForm.name) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setIsSendingEmail(true)
    toast.loading('Enviando email...', { id: 'send-email' })

    try {
      const result = await sendPackageEmail({
        packageId: selectedPackageForEmail.id,
        recipientEmail: emailForm.email,
        recipientName: emailForm.name,
      })

      toast.dismiss('send-email')

      if (result.success) {
        toast.success('Email enviado exitosamente')
        setIsEmailDialogOpen(false)
      } else {
        toast.error(result.error || 'Error al enviar el email')
      }
    } catch (error) {
      toast.dismiss('send-email')
      toast.error('Error al enviar el email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleAutoPrice = () => {
    const regularPrice = calculateRegularPrice()
    form.setValue('regularPrice', regularPrice)
    form.setValue('salePrice', Math.round(regularPrice * 0.85)) // 15% descuento por defecto
  }

  async function onSubmit(data: PackageFormValues) {
    startTransition(async () => {
      if (editingPackage) {
        const result = await updatePackage(editingPackage.id, {
          name: data.name,
          description: data.description,
          type: data.type,
          items: data.items,
          regularPrice: data.regularPrice,
          salePrice: data.salePrice,
          validityDays: data.validityDays ?? 90,
          isActive: data.isActive,
        })
        if (result.data) {
          setPackages(packages.map((p) => p.id === editingPackage.id ? result.data! : p))
          toast.success('Paquete actualizado')
          setIsDialogOpen(false)
        } else {
          toast.error(result.error || 'Error al actualizar')
        }
      } else {
        const result = await createPackage({
          name: data.name,
          description: data.description,
          type: data.type,
          items: data.items,
          regularPrice: data.regularPrice,
          salePrice: data.salePrice,
          validityDays: data.validityDays ?? 90,
          isActive: data.isActive,
        })
        if (result.data) {
          setPackages([...packages, result.data])
          toast.success('Paquete creado')
          setIsDialogOpen(false)
          form.reset()
        } else {
          toast.error(result.error || 'Error al crear')
        }
      }
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tratamientos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Paquetes</h1>
            <p className="text-muted-foreground">
              Crea paquetes y bonos de tratamientos
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Paquete
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? 'Editar Paquete' : 'Nuevo Paquete'}
              </DialogTitle>
              <DialogDescription>
                {editingPackage
                  ? 'Modifica los datos del paquete'
                  : 'Crea un paquete o bono combinando tratamientos'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Paquete Facial Completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción del paquete..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Paquete *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sessions_pack">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Bono de Sesiones
                              </div>
                            </SelectItem>
                            <SelectItem value="bundle">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Pack Combinado
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {watchType === 'sessions_pack'
                            ? 'Múltiples sesiones del mismo tratamiento'
                            : 'Combinación de diferentes tratamientos'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Tratamientos incluidos */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>Tratamientos incluidos *</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ treatmentId: '', quantity: 1 })}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Agregar
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-start">
                      <FormField
                        control={form.control}
                        name={`items.${index}.treatmentId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona tratamiento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {treatments.map((treatment) => (
                                  <SelectItem
                                    key={treatment.id}
                                    value={treatment.id}
                                  >
                                    <div className="flex justify-between items-center gap-4 w-full">
                                      <span>{treatment.name}</span>
                                      <span className="text-muted-foreground">
                                        {formatPrice(treatment.price)}
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
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                placeholder="Cant."
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 1)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAutoPrice}
                    className="w-full"
                  >
                    <Percent className="mr-2 h-4 w-4" />
                    Calcular precio automático (15% desc.)
                  </Button>
                </div>

                <Separator />

                {/* Precios */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="regularPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Regular *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              className="pl-7"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio de Venta *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              className="pl-7"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {calculateDiscount() > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400">
                    <Percent className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {calculateDiscount()}% de descuento
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="validityDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vigencia (días)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min={1}
                              className="pl-10"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : null
                                )
                              }
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Días para usar el paquete desde la compra
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Estado</FormLabel>
                        <div className="flex items-center gap-3 rounded-lg border p-3">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <span className="text-sm">
                            {field.value ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingPackage ? 'Guardar' : 'Crear'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de paquetes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`relative overflow-hidden ${
              !pkg.isActive ? 'opacity-60' : ''
            }`}
          >
            {/* Badge de descuento */}
            {pkg.regularPrice > pkg.salePrice && (
              <div className="absolute top-3 right-3">
                <Badge variant="destructive">
                  -{Math.round(((pkg.regularPrice - pkg.salePrice) / pkg.regularPrice) * 100)}%
                </Badge>
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {pkg.type === 'sessions_pack'
                        ? 'Bono de Sesiones'
                        : 'Pack Combinado'}
                    </Badge>
                  </div>
                </div>
              </div>
              {pkg.description && (
                <CardDescription className="mt-2">
                  {pkg.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Tratamientos incluidos */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  Incluye:
                </span>
                <ul className="space-y-1">
                  {pkg.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-sm flex items-center justify-between"
                    >
                      <span className="truncate">
                        {item.quantity}x {item.treatmentName}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Precios */}
              <div className="flex items-end justify-between">
                <div>
                  {pkg.regularPrice !== pkg.salePrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(pkg.regularPrice)}
                    </span>
                  )}
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(pkg.salePrice)}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {pkg.validityDays} días
                  </div>
                  <div>{pkg.salesCount} vendidos</div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEmailDialog(pkg)}
                >
                  <Mail className="mr-1 h-3 w-3" />
                  Email
                </Button>
                <DownloadPackagePDF
                  data={{
                    name: pkg.name,
                    description: pkg.description,
                    type: pkg.type,
                    items: pkg.items,
                    regularPrice: pkg.regularPrice,
                    salePrice: pkg.salePrice,
                    validityDays: pkg.validityDays,
                    currency: 'DOP',
                  }}
                  variant="outline"
                  size="sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(pkg)}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Editar
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar paquete?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Los paquetes ya
                        vendidos a pacientes no se verán afectados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(pkg.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Card para crear nuevo */}
        <Card
          className="flex items-center justify-center min-h-[300px] border-dashed cursor-pointer hover:border-primary transition-colors"
          onClick={openCreateDialog}
        >
          <div className="text-center text-muted-foreground">
            <Plus className="h-10 w-10 mx-auto mb-2" />
            <p className="font-medium">Crear nuevo paquete</p>
          </div>
        </Card>
      </div>

      {/* Empty state */}
      {packages.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No hay paquetes</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primer paquete combinando tratamientos
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Paquete
          </Button>
        </div>
      )}

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enviar paquete por email</DialogTitle>
            <DialogDescription>
              {selectedPackageForEmail?.name}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={emailDialogTab} onValueChange={(v) => setEmailDialogTab(v as 'existing' | 'new')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">
                <User className="mr-2 h-4 w-4" />
                Paciente Existente
              </TabsTrigger>
              <TabsTrigger value="new">
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo Paciente
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4 mt-4">
              {/* Selected patient display */}
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPatient.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearSelectedPatient}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  {/* Patient search */}
                  <div className="space-y-2">
                    <Label>Buscar paciente</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={patientSearchQuery}
                        onChange={(e) => handlePatientSearch(e.target.value)}
                        className="pl-9"
                      />
                      {isSearchingPatients && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                      )}
                    </div>

                    {/* Search results */}
                    {patientSearchResults.length > 0 && (
                      <div className="border rounded-lg max-h-48 overflow-y-auto">
                        {patientSearchResults.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => selectPatient(patient)}
                            className="w-full p-3 text-left hover:bg-muted transition-colors border-b last:border-b-0 flex items-center gap-3"
                          >
                            <div className="p-1.5 bg-muted rounded-full">
                              <User className="h-3 w-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {patient.first_name} {patient.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {patient.email || patient.phone}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {patientSearchQuery.length >= 2 && patientSearchResults.length === 0 && !isSearchingPatients && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No se encontraron pacientes. Puedes crear uno nuevo.
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Manual entry fallback */}
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">O ingresa los datos manualmente:</p>
                    <div className="space-y-2">
                      <Label htmlFor="manual-name">Nombre</Label>
                      <Input
                        id="manual-name"
                        placeholder="Nombre del destinatario"
                        value={emailForm.name}
                        onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-email">Email</Label>
                      <Input
                        id="manual-email"
                        type="email"
                        placeholder="email@ejemplo.com"
                        value={emailForm.email}
                        onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="new" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="new-first-name">Nombre *</Label>
                  <Input
                    id="new-first-name"
                    placeholder="Nombre"
                    value={newPatientForm.first_name}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-last-name">Apellido *</Label>
                  <Input
                    id="new-last-name"
                    placeholder="Apellido"
                    value={newPatientForm.last_name}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Email *</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={newPatientForm.email}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-phone">Teléfono *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-phone"
                    placeholder="809-000-0000"
                    value={newPatientForm.phone}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="new-dob">Fecha de Nacimiento</Label>
                  <Input
                    id="new-dob"
                    type="date"
                    value={newPatientForm.date_of_birth || ''}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-gender">Género</Label>
                  <Select
                    value={newPatientForm.gender || ''}
                    onValueChange={(v) => setNewPatientForm({ ...newPatientForm, gender: v })}
                  >
                    <SelectTrigger id="new-gender">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Femenino</SelectItem>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={handleCreateNewPatient}
                disabled={isCreatingPatient}
              >
                {isCreatingPatient && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Paciente y Seleccionar
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail || !emailForm.email || !emailForm.name}
            >
              {isSendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Mail className="mr-2 h-4 w-4" />
              Enviar Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
