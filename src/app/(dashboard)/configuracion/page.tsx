'use client'

import { useState } from 'react'
import {
  Building2,
  MapPin,
  Users,
  Shield,
  MessageSquare,
  Plug,
  Settings,
  Save,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Clock,
  Mail,
  Phone,
  Globe,
  Instagram,
  Facebook,
  CreditCard,
  Bell,
  Palette,
  FileText,
  Check,
  X,
  Copy,
  ExternalLink,
  Key,
  Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'

// Mock data
const clinicData = {
  name: 'MED LUXE Aesthetics & Wellness',
  legalName: 'MED LUXE SRL',
  rnc: '131456789',
  email: 'contacto@medluxe.com.do',
  phone: '1-809-555-1234',
  website: 'www.medluxe.com.do',
  instagram: '@medluxeaesthetics',
  facebook: 'medluxeaesthetics',
  address: 'Av. Abraham Lincoln 456, Piantini',
  city: 'Santo Domingo',
  state: 'Distrito Nacional',
  zipCode: '10147',
  country: 'República Dominicana',
  timezone: 'America/Santo_Domingo',
  currency: 'DOP',
  logo: null,
}

const branches = [
  {
    id: '1',
    name: 'Sucursal Piantini',
    address: 'Av. Abraham Lincoln 456',
    phone: '1-809-555-1111',
    email: 'piantini@medluxe.com.do',
    manager: 'Dra. Pamela Moquete',
    status: 'active',
    rooms: 5,
  },
  {
    id: '2',
    name: 'Sucursal Naco',
    address: 'Av. Tiradentes 123, Plaza Naco',
    phone: '1-829-555-2222',
    email: 'naco@medluxe.com.do',
    manager: 'Dra. Pamela Moquete',
    status: 'active',
    rooms: 3,
  },
  {
    id: '3',
    name: 'Sucursal Santiago',
    address: 'Av. 27 de Febrero 789',
    phone: '1-809-555-3333',
    email: 'santiago@medluxe.com.do',
    manager: 'Dra. Pamela Moquete',
    status: 'inactive',
    rooms: 4,
  },
]

const users = [
  {
    id: '1',
    name: 'Admin Usuario',
    email: 'admin@bellavida.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-12-07 10:30',
    avatar: null,
  },
  {
    id: '2',
    name: 'Dra. Pamela Moquete',
    email: 'ana.lopez@bellavida.com',
    role: 'professional',
    status: 'active',
    lastLogin: '2024-12-07 09:15',
    avatar: null,
  },
  {
    id: '3',
    name: 'María Recepción',
    email: 'recepcion@bellavida.com',
    role: 'receptionist',
    status: 'active',
    lastLogin: '2024-12-07 08:00',
    avatar: null,
  },
  {
    id: '4',
    name: 'Carlos Inventario',
    email: 'inventario@bellavida.com',
    role: 'inventory',
    status: 'inactive',
    lastLogin: '2024-12-01 14:20',
    avatar: null,
  },
]

const roles = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acceso completo al sistema',
    permissions: ['all'],
    usersCount: 1,
    color: 'bg-red-500',
  },
  {
    id: 'professional',
    name: 'Profesional',
    description: 'Acceso a agenda, pacientes y sesiones',
    permissions: ['patients', 'appointments', 'sessions', 'pos'],
    usersCount: 5,
    color: 'bg-blue-500',
  },
  {
    id: 'receptionist',
    name: 'Recepcionista',
    description: 'Acceso a agenda y punto de venta',
    permissions: ['appointments', 'pos', 'patients_view'],
    usersCount: 3,
    color: 'bg-green-500',
  },
  {
    id: 'inventory',
    name: 'Inventario',
    description: 'Gestión de productos y stock',
    permissions: ['inventory', 'suppliers'],
    usersCount: 2,
    color: 'bg-amber-500',
  },
]

const messageTemplates = [
  {
    id: '1',
    name: 'Confirmación de Cita',
    type: 'appointment_confirmation',
    channel: 'whatsapp',
    content: 'Hola {{nombre}}, tu cita para {{tratamiento}} está confirmada para el {{fecha}} a las {{hora}}. Te esperamos en {{sucursal}}.',
    isActive: true,
  },
  {
    id: '2',
    name: 'Recordatorio 24h',
    type: 'appointment_reminder',
    channel: 'whatsapp',
    content: 'Hola {{nombre}}, te recordamos que mañana tienes cita a las {{hora}} para {{tratamiento}}. Si necesitas reagendar, contáctanos.',
    isActive: true,
  },
  {
    id: '3',
    name: 'Recordatorio 1h',
    type: 'appointment_reminder',
    channel: 'sms',
    content: 'Recordatorio: Tu cita en Bella Vida es en 1 hora. Te esperamos!',
    isActive: true,
  },
  {
    id: '4',
    name: 'Agradecimiento Post-Cita',
    type: 'post_appointment',
    channel: 'email',
    content: 'Gracias por visitarnos, {{nombre}}. Esperamos que tu experiencia haya sido excelente. ¿Nos dejas una reseña?',
    isActive: false,
  },
  {
    id: '5',
    name: 'Promoción Cumpleaños',
    type: 'birthday',
    channel: 'whatsapp',
    content: '¡Feliz cumpleaños {{nombre}}! 🎂 Te regalamos 20% de descuento en tu próximo tratamiento. Válido este mes.',
    isActive: true,
  },
]

const integrations = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Envío de mensajes y recordatorios',
    icon: Smartphone,
    status: 'connected',
    config: { phone: '1-809-555-1234' },
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Procesamiento de pagos con tarjeta',
    icon: CreditCard,
    status: 'connected',
    config: { lastDigits: '4242' },
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sincronización de agenda',
    icon: Calendar,
    status: 'disconnected',
    config: null,
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing y campañas',
    icon: Mail,
    status: 'disconnected',
    config: null,
  },
]

// Import Calendar icon for integrations
import { Calendar } from 'lucide-react'

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  professional: 'bg-blue-100 text-blue-700',
  receptionist: 'bg-green-100 text-green-700',
  inventory: 'bg-amber-100 text-amber-700',
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  professional: 'Profesional',
  receptionist: 'Recepcionista',
  inventory: 'Inventario',
}

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('clinica')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Administra la configuración de tu clínica</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      {/* Tabs de Configuración */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="clinica" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clínica</span>
          </TabsTrigger>
          <TabsTrigger value="sucursales" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Sucursales</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="mensajes" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Mensajes</span>
          </TabsTrigger>
          <TabsTrigger value="integraciones" className="gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Integraciones</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Datos de la Clínica */}
        <TabsContent value="clinica" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Información General */}
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Datos básicos de tu clínica</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted">
                      <Upload className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <Button size="sm" variant="outline" className="absolute -bottom-2 -right-2 h-7 w-7 p-0">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Logo de la Clínica</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG hasta 2MB. Recomendado 200x200px</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Comercial</Label>
                    <Input id="name" defaultValue={clinicData.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Razón Social</Label>
                    <Input id="legalName" defaultValue={clinicData.legalName} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rnc">RNC</Label>
                  <Input id="rnc" defaultValue={clinicData.rnc} placeholder="Ej: 131456789" />
                </div>
              </CardContent>
            </Card>

            {/* Contacto */}
            <Card>
              <CardHeader>
                <CardTitle>Contacto</CardTitle>
                <CardDescription>Información de contacto principal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" className="pl-10" defaultValue={clinicData.email} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="phone" className="pl-10" defaultValue={clinicData.phone} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="website" className="pl-10" defaultValue={clinicData.website} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="instagram" className="pl-10" defaultValue={clinicData.instagram} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="facebook" className="pl-10" defaultValue={clinicData.facebook} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dirección */}
            <Card>
              <CardHeader>
                <CardTitle>Dirección Principal</CardTitle>
                <CardDescription>Ubicación de la sede principal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" defaultValue={clinicData.address} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input id="city" defaultValue={clinicData.city} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" defaultValue={clinicData.state} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Código Postal</Label>
                    <Input id="zipCode" defaultValue={clinicData.zipCode} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input id="country" defaultValue={clinicData.country} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferencias */}
            <Card>
              <CardHeader>
                <CardTitle>Preferencias</CardTitle>
                <CardDescription>Configuración regional y del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <Select defaultValue={clinicData.timezone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Santo_Domingo">Santo Domingo (GMT-4)</SelectItem>
                        <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select defaultValue={clinicData.currency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOP">Peso Dominicano (RD$)</SelectItem>
                        <SelectItem value="USD">Dólar Estadounidense (US$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Permitir citas online</Label>
                      <p className="text-xs text-muted-foreground">Los pacientes pueden agendar desde la web</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Recordatorios automáticos</Label>
                      <p className="text-xs text-muted-foreground">Enviar recordatorios de citas</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Sucursales */}
        <TabsContent value="sucursales" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sucursales</CardTitle>
                <CardDescription>Administra las ubicaciones de tu clínica</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Sucursal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Sucursal</DialogTitle>
                    <DialogDescription>Agrega una nueva ubicación para tu clínica</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="branch-name">Nombre</Label>
                      <Input id="branch-name" placeholder="Ej: Sucursal Centro" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-address">Dirección</Label>
                      <Input id="branch-address" placeholder="Calle y número" />
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="branch-phone">Teléfono</Label>
                        <Input id="branch-phone" placeholder="1-809-555-0000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="branch-email">Email</Label>
                        <Input id="branch-email" placeholder="sucursal@clinica.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-rooms">Número de Salas</Label>
                      <Input id="branch-rooms" type="number" placeholder="3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Crear Sucursal</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {branches.map((branch) => (
                  <Card key={branch.id} className={branch.status === 'inactive' ? 'opacity-60' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{branch.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {branch.address}
                          </CardDescription>
                        </div>
                        <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                          {branch.status === 'active' ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {branch.phone}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {branch.email.split('@')[0]}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Encargado:</span>
                        <span className="font-medium">{branch.manager}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Salas:</span>
                        <span className="font-medium">{branch.rooms}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Pencil className="mr-1 h-3 w-3" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Clock className="mr-1 h-3 w-3" />
                          Horarios
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuarios */}
        <TabsContent value="usuarios" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>Administra el acceso al sistema</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Invitar Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invitar Usuario</DialogTitle>
                    <DialogDescription>Envía una invitación por email para unirse al sistema</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-name">Nombre Completo</Label>
                      <Input id="user-name" placeholder="Juan Pérez" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-email">Email</Label>
                      <Input id="user-email" type="email" placeholder="juan@clinica.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-role">Rol</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-branch">Sucursal</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas las sucursales" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las sucursales</SelectItem>
                          {branches.filter(b => b.status === 'active').map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Enviar Invitación</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastLogin}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Roles */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Roles y Permisos</CardTitle>
                <CardDescription>Define los niveles de acceso del sistema</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Rol
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {roles.map((role) => (
                  <Card key={role.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg ${role.color} flex items-center justify-center`}>
                            <Shield className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{role.name}</CardTitle>
                            <CardDescription>{role.description}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline">{role.usersCount} usuarios</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Permisos:</p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.includes('all') ? (
                            <Badge variant="secondary">Acceso Total</Badge>
                          ) : (
                            role.permissions.map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {perm.replace('_', ' ')}
                              </Badge>
                            ))
                          )}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Pencil className="mr-1 h-3 w-3" />
                            Editar
                          </Button>
                          {role.id !== 'admin' && (
                            <Button variant="outline" size="sm" className="text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Plantillas de Mensajes */}
        <TabsContent value="mensajes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Plantillas de Mensajes</CardTitle>
                <CardDescription>Configura los mensajes automáticos</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Plantilla
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messageTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      template.isActive ? 'bg-background' : 'bg-muted/50'
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      template.channel === 'whatsapp' ? 'bg-green-100 text-green-600' :
                      template.channel === 'sms' ? 'bg-blue-100 text-blue-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {template.channel === 'whatsapp' ? <Smartphone className="h-5 w-5" /> :
                       template.channel === 'sms' ? <MessageSquare className="h-5 w-5" /> :
                       <Mail className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {template.channel.toUpperCase()}
                        </Badge>
                        {!template.isActive && (
                          <Badge variant="secondary" className="text-xs">Inactiva</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{template.content}</p>
                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline" className="text-xs">
                          {'{{nombre}}'} {'{{fecha}}'} {'{{hora}}'} {'{{tratamiento}}'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={template.isActive} />
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Variables Disponibles</h4>
                <div className="flex flex-wrap gap-2">
                  {['{{nombre}}', '{{fecha}}', '{{hora}}', '{{tratamiento}}', '{{sucursal}}', '{{profesional}}', '{{precio}}', '{{telefono}}'].map((variable) => (
                    <Badge key={variable} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Integraciones */}
        <TabsContent value="integraciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integraciones</CardTitle>
              <CardDescription>Conecta servicios externos para expandir las funcionalidades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {integrations.map((integration) => (
                  <Card key={integration.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                            integration.status === 'connected' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            <integration.icon className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{integration.name}</CardTitle>
                            <CardDescription>{integration.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {integration.status === 'connected' ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-green-600 font-medium">Conectado</span>
                          </div>
                          {integration.config && (
                            <p className="text-xs text-muted-foreground">
                              {integration.id === 'whatsapp' && `Teléfono: ${integration.config.phone}`}
                              {integration.id === 'stripe' && `Tarjeta: •••• ${integration.config.lastDigits}`}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Settings className="mr-1 h-3 w-3" />
                              Configurar
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <X className="h-4 w-4" />
                            <span>No conectado</span>
                          </div>
                          <Button className="w-full" size="sm">
                            <Plug className="mr-2 h-4 w-4" />
                            Conectar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* API Keys */}
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      API Keys
                    </CardTitle>
                    <CardDescription>Claves de acceso para integraciones personalizadas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">API Key de Producción</p>
                        <code className="text-xs text-muted-foreground">sk_live_••••••••••••••••</code>
                      </div>
                      <Button variant="outline" size="sm">
                        <Copy className="mr-1 h-3 w-3" />
                        Copiar
                      </Button>
                      <Button variant="outline" size="sm">
                        Regenerar
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">API Key de Pruebas</p>
                        <code className="text-xs text-muted-foreground">sk_test_••••••••••••••••</code>
                      </div>
                      <Button variant="outline" size="sm">
                        <Copy className="mr-1 h-3 w-3" />
                        Copiar
                      </Button>
                      <Button variant="outline" size="sm">
                        Regenerar
                      </Button>
                    </div>
                    <Button variant="link" className="p-0 h-auto text-sm">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Ver documentación de la API
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
