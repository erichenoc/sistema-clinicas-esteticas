'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Calendar,
  Save,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export default function NuevoProfesionalPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    licenseNumber: '',
    specialties: [] as string[],
    bio: '',
    employmentType: 'employee',
    hireDate: '',
    baseSalary: '',
    salaryType: 'monthly',
    commissionRate: '15',
    commissionType: 'percentage',
    maxDailyAppointments: '20',
    appointmentBufferMinutes: '15',
    acceptsWalkIns: true,
    canViewAllPatients: false,
    canModifyPrices: false,
    canGiveDiscounts: false,
    maxDiscountPercent: '0',
    showOnBooking: true,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Aquí iría la lógica para guardar en Supabase
      // Por ahora simulamos el guardado
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success('Profesional creado exitosamente')
      router.push('/profesionales')
    } catch (error) {
      console.error('Error creating professional:', error)
      toast.error('Error al crear el profesional')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/profesionales">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Profesional</h1>
          <p className="text-muted-foreground">
            Registra un nuevo miembro del equipo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="profesional">
              <Briefcase className="h-4 w-4 mr-2" />
              Profesional
            </TabsTrigger>
            <TabsTrigger value="compensacion">
              <DollarSign className="h-4 w-4 mr-2" />
              Compensacion
            </TabsTrigger>
            <TabsTrigger value="permisos">
              <Calendar className="h-4 w-4 mr-2" />
              Permisos
            </TabsTrigger>
          </TabsList>

          {/* Personal Tab */}
          <TabsContent value="personal" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informacion Personal</CardTitle>
                <CardDescription>
                  Datos basicos del profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Nombre"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Apellido"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="809-000-0000"
                        className="pl-10"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Breve descripcion del profesional..."
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profesional Tab */}
          <TabsContent value="profesional" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informacion Profesional</CardTitle>
                <CardDescription>
                  Credenciales y especialidades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titulo Profesional</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Ej: Dra., Lic., Esp."
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">Numero de Licencia</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      placeholder="Numero de exequatur o licencia"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Tipo de Empleo *</Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(value) =>
                        handleSelectChange('employmentType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Empleado</SelectItem>
                        <SelectItem value="contractor">Contratista</SelectItem>
                        <SelectItem value="partner">Socio</SelectItem>
                        <SelectItem value="owner">Propietario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Fecha de Ingreso</Label>
                    <Input
                      id="hireDate"
                      name="hireDate"
                      type="date"
                      value={formData.hireDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Especialidades</Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[80px]">
                    {[
                      'Medicina Estetica',
                      'Dermatologia',
                      'Cirugia Plastica',
                      'Cosmetologia',
                      'Masoterapia',
                      'Nutricion',
                    ].map((specialty) => (
                      <Button
                        key={specialty}
                        type="button"
                        variant={
                          formData.specialties.includes(specialty)
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            specialties: prev.specialties.includes(specialty)
                              ? prev.specialties.filter((s) => s !== specialty)
                              : [...prev.specialties, specialty],
                          }))
                        }}
                      >
                        {specialty}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compensacion Tab */}
          <TabsContent value="compensacion" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Compensacion y Comisiones</CardTitle>
                <CardDescription>
                  Configuracion de salario y comisiones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseSalary">Salario Base (RD$)</Label>
                    <Input
                      id="baseSalary"
                      name="baseSalary"
                      type="number"
                      placeholder="0.00"
                      value={formData.baseSalary}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryType">Tipo de Salario</Label>
                    <Select
                      value={formData.salaryType}
                      onValueChange={(value) =>
                        handleSelectChange('salaryType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="biweekly">Quincenal</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="hourly">Por hora</SelectItem>
                        <SelectItem value="commission_only">Solo comisiones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">Tasa de Comision (%)</Label>
                    <Input
                      id="commissionRate"
                      name="commissionRate"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="15"
                      value={formData.commissionRate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commissionType">Tipo de Comision</Label>
                    <Select
                      value={formData.commissionType}
                      onValueChange={(value) =>
                        handleSelectChange('commissionType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentaje</SelectItem>
                        <SelectItem value="fixed">Monto fijo</SelectItem>
                        <SelectItem value="tiered">Escalonado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permisos Tab */}
          <TabsContent value="permisos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Permisos y Configuracion</CardTitle>
                <CardDescription>
                  Control de acceso y preferencias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxDailyAppointments">
                      Maximo Citas por Dia
                    </Label>
                    <Input
                      id="maxDailyAppointments"
                      name="maxDailyAppointments"
                      type="number"
                      min="1"
                      value={formData.maxDailyAppointments}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointmentBufferMinutes">
                      Buffer entre Citas (min)
                    </Label>
                    <Input
                      id="appointmentBufferMinutes"
                      name="appointmentBufferMinutes"
                      type="number"
                      min="0"
                      value={formData.appointmentBufferMinutes}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Acepta Walk-ins</Label>
                      <p className="text-sm text-muted-foreground">
                        Puede atender pacientes sin cita previa
                      </p>
                    </div>
                    <Switch
                      checked={formData.acceptsWalkIns}
                      onCheckedChange={(checked) =>
                        handleSwitchChange('acceptsWalkIns', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mostrar en Reservas Online</Label>
                      <p className="text-sm text-muted-foreground">
                        Aparece como opcion para citas online
                      </p>
                    </div>
                    <Switch
                      checked={formData.showOnBooking}
                      onCheckedChange={(checked) =>
                        handleSwitchChange('showOnBooking', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Ver Todos los Pacientes</Label>
                      <p className="text-sm text-muted-foreground">
                        Acceso al historial de todos los pacientes
                      </p>
                    </div>
                    <Switch
                      checked={formData.canViewAllPatients}
                      onCheckedChange={(checked) =>
                        handleSwitchChange('canViewAllPatients', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Modificar Precios</Label>
                      <p className="text-sm text-muted-foreground">
                        Puede cambiar precios de servicios
                      </p>
                    </div>
                    <Switch
                      checked={formData.canModifyPrices}
                      onCheckedChange={(checked) =>
                        handleSwitchChange('canModifyPrices', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dar Descuentos</Label>
                      <p className="text-sm text-muted-foreground">
                        Puede aplicar descuentos a pacientes
                      </p>
                    </div>
                    <Switch
                      checked={formData.canGiveDiscounts}
                      onCheckedChange={(checked) =>
                        handleSwitchChange('canGiveDiscounts', checked)
                      }
                    />
                  </div>

                  {formData.canGiveDiscounts && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="maxDiscountPercent">
                        Maximo Descuento Permitido (%)
                      </Label>
                      <Input
                        id="maxDiscountPercent"
                        name="maxDiscountPercent"
                        type="number"
                        min="0"
                        max="100"
                        className="w-32"
                        value={formData.maxDiscountPercent}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/profesionales">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Profesional
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
