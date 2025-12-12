'use client'

import { useState } from 'react'
import {
  Building2,
  MapPin,
  Users,
  Shield,
  MessageSquare,
  Plug,
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
  Palette,
  Check,
  X,
  Copy,
  ExternalLink,
  Key,
  Smartphone,
  Calendar,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  type ClinicSettings,
  type Branch,
  updateClinicSettings,
  createBranch,
  updateBranch,
  deleteBranch,
} from '@/actions/settings'

interface SettingsClientProps {
  initialClinic: ClinicSettings | null
  initialBranches: Branch[]
}

export function SettingsClient({ initialClinic, initialBranches }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState('clinica')
  const [isSaving, setIsSaving] = useState(false)

  // Clinic state
  const [clinic, setClinic] = useState<ClinicSettings | null>(initialClinic)
  const [formData, setFormData] = useState({
    name: initialClinic?.name || '',
    legal_name: initialClinic?.legal_name || '',
    tax_id: initialClinic?.tax_id || '',
    email: initialClinic?.email || '',
    phone: initialClinic?.phone || '',
    website: initialClinic?.website || '',
    instagram: initialClinic?.instagram || '',
    facebook: initialClinic?.facebook || '',
    address: initialClinic?.address || '',
    city: initialClinic?.city || '',
    state: initialClinic?.state || '',
    postal_code: initialClinic?.postal_code || '',
    country: initialClinic?.country || 'Republica Dominicana',
    timezone: initialClinic?.timezone || 'America/Santo_Domingo',
    currency: initialClinic?.currency || 'DOP',
  })

  const [settings, setSettings] = useState({
    allow_online_booking: initialClinic?.settings?.allow_online_booking ?? true,
    auto_reminders: initialClinic?.settings?.auto_reminders ?? true,
  })

  // Branches state
  const [branches, setBranches] = useState<Branch[]>(initialBranches)
  const [isNewBranchDialogOpen, setIsNewBranchDialogOpen] = useState(false)
  const [newBranchData, setNewBranchData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    rooms_count: 1,
  })
  const [isCreatingBranch, setIsCreatingBranch] = useState(false)
  const [deleteBranchId, setDeleteBranchId] = useState<string | null>(null)
  const [isDeletingBranch, setIsDeletingBranch] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    toast.loading('Guardando configuracion...', { id: 'save-settings' })

    try {
      const result = await updateClinicSettings({
        ...formData,
        settings: settings,
      })

      toast.dismiss('save-settings')

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Configuracion guardada exitosamente')
        if (result.data) {
          setClinic(result.data)
        }
      }
    } catch (error) {
      toast.dismiss('save-settings')
      toast.error('Error al guardar la configuracion')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateBranch = async () => {
    if (!newBranchData.name.trim()) {
      toast.error('El nombre de la sucursal es requerido')
      return
    }

    setIsCreatingBranch(true)
    toast.loading('Creando sucursal...', { id: 'create-branch' })

    try {
      const result = await createBranch(newBranchData)
      toast.dismiss('create-branch')

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Sucursal creada exitosamente')
        if (result.data) {
          setBranches(prev => [...prev, result.data!])
        }
        setIsNewBranchDialogOpen(false)
        setNewBranchData({ name: '', address: '', phone: '', email: '', rooms_count: 1 })
      }
    } catch (error) {
      toast.dismiss('create-branch')
      toast.error('Error al crear la sucursal')
      console.error(error)
    } finally {
      setIsCreatingBranch(false)
    }
  }

  const handleDeleteBranch = async () => {
    if (!deleteBranchId) return

    setIsDeletingBranch(true)
    toast.loading('Eliminando sucursal...', { id: 'delete-branch' })

    try {
      const result = await deleteBranch(deleteBranchId)
      toast.dismiss('delete-branch')

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Sucursal eliminada')
        setBranches(prev => prev.filter(b => b.id !== deleteBranchId))
      }
    } catch (error) {
      toast.dismiss('delete-branch')
      toast.error('Error al eliminar la sucursal')
      console.error(error)
    } finally {
      setIsDeletingBranch(false)
      setDeleteBranchId(null)
    }
  }

  const handleToggleBranchStatus = async (branch: Branch) => {
    toast.loading(branch.is_active ? 'Desactivando...' : 'Activando...', { id: 'toggle-branch' })

    try {
      const result = await updateBranch(branch.id, { is_active: !branch.is_active })
      toast.dismiss('toggle-branch')

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Sucursal ${branch.is_active ? 'desactivada' : 'activada'}`)
        setBranches(prev =>
          prev.map(b => (b.id === branch.id ? { ...b, is_active: !b.is_active } : b))
        )
      }
    } catch (error) {
      toast.dismiss('toggle-branch')
      toast.error('Error al cambiar estado')
      console.error(error)
    }
  }

  // Mock data for users/roles/messages/integrations (estos se pueden implementar despues)
  const users = [
    { id: '1', name: 'Admin Usuario', email: 'admin@medluxe.com', role: 'admin', status: 'active', lastLogin: '2024-12-07 10:30' },
    { id: '2', name: 'Dra. Pamela Moquete', email: 'pamela@medluxe.com', role: 'professional', status: 'active', lastLogin: '2024-12-07 09:15' },
  ]

  const roles = [
    { id: 'admin', name: 'Administrador', description: 'Acceso completo', permissions: ['all'], usersCount: 1, color: 'bg-red-500' },
    { id: 'professional', name: 'Profesional', description: 'Agenda, pacientes, sesiones', permissions: ['patients', 'appointments'], usersCount: 5, color: 'bg-blue-500' },
  ]

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    professional: 'bg-blue-100 text-blue-700',
    receptionist: 'bg-green-100 text-green-700',
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    professional: 'Profesional',
    receptionist: 'Recepcionista',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuracion</h1>
          <p className="text-muted-foreground">Administra la configuracion de tu clinica</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto gap-1">
          <TabsTrigger value="clinica" className="gap-1 sm:gap-2 py-2 sm:py-1.5">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clinica</span>
          </TabsTrigger>
          <TabsTrigger value="sucursales" className="gap-1 sm:gap-2 py-2 sm:py-1.5">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Sucursales</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-1 sm:gap-2 py-2 sm:py-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1 sm:gap-2 py-2 sm:py-1.5">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="mensajes" className="gap-1 sm:gap-2 py-2 sm:py-1.5">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Mensajes</span>
          </TabsTrigger>
          <TabsTrigger value="integraciones" className="gap-1 sm:gap-2 py-2 sm:py-1.5">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Integraciones</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Clinica */}
        <TabsContent value="clinica" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Informacion General */}
            <Card>
              <CardHeader>
                <CardTitle>Informacion General</CardTitle>
                <CardDescription>Datos basicos de tu clinica</CardDescription>
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
                    <p className="text-sm font-medium">Logo de la Clinica</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG hasta 2MB</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Comercial</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legal_name">Razon Social</Label>
                    <Input
                      id="legal_name"
                      value={formData.legal_name}
                      onChange={(e) => handleInputChange('legal_name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_id">RNC</Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => handleInputChange('tax_id', e.target.value)}
                    placeholder="Ej: 131456789"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contacto */}
            <Card>
              <CardHeader>
                <CardTitle>Contacto</CardTitle>
                <CardDescription>Informacion de contacto principal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-10"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="website"
                      className="pl-10"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="instagram"
                        className="pl-10"
                        value={formData.instagram}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="facebook"
                        className="pl-10"
                        value={formData.facebook}
                        onChange={(e) => handleInputChange('facebook', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Direccion */}
            <Card>
              <CardHeader>
                <CardTitle>Direccion Principal</CardTitle>
                <CardDescription>Ubicacion de la sede principal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Direccion</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado/Provincia</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Codigo Postal</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Pais</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferencias */}
            <Card>
              <CardHeader>
                <CardTitle>Preferencias</CardTitle>
                <CardDescription>Configuracion regional y del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => handleInputChange('timezone', value)}
                    >
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
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleInputChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOP">Peso Dominicano (RD$)</SelectItem>
                        <SelectItem value="USD">Dolar Estadounidense (US$)</SelectItem>
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
                    <Switch
                      checked={settings.allow_online_booking}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, allow_online_booking: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Recordatorios automaticos</Label>
                      <p className="text-xs text-muted-foreground">Enviar recordatorios de citas</p>
                    </div>
                    <Switch
                      checked={settings.auto_reminders}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, auto_reminders: checked }))
                      }
                    />
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>

            {/* Tasas de Cambio */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Tasas de Cambio
                </CardTitle>
                <CardDescription>Configurar conversion USD/DOP para cotizaciones y cobros</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      Administra las tasas de cambio entre dolares y pesos dominicanos
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Se utiliza para calcular automaticamente conversiones en el POS y cotizaciones
                    </p>
                  </div>
                  <Link href="/configuracion/tasas-cambio">
                    <Button>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Configurar Tasas
                    </Button>
                  </Link>
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
                <CardDescription>Administra las ubicaciones de tu clinica</CardDescription>
              </div>
              <Dialog open={isNewBranchDialogOpen} onOpenChange={setIsNewBranchDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Sucursal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Sucursal</DialogTitle>
                    <DialogDescription>Agrega una nueva ubicacion para tu clinica</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="branch-name">Nombre *</Label>
                      <Input
                        id="branch-name"
                        placeholder="Ej: Sucursal Centro"
                        value={newBranchData.name}
                        onChange={(e) => setNewBranchData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-address">Direccion</Label>
                      <Input
                        id="branch-address"
                        placeholder="Calle y numero"
                        value={newBranchData.address}
                        onChange={(e) => setNewBranchData(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="branch-phone">Telefono</Label>
                        <Input
                          id="branch-phone"
                          placeholder="1-809-555-0000"
                          value={newBranchData.phone}
                          onChange={(e) => setNewBranchData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="branch-email">Email</Label>
                        <Input
                          id="branch-email"
                          placeholder="sucursal@clinica.com"
                          value={newBranchData.email}
                          onChange={(e) => setNewBranchData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-rooms">Numero de Salas</Label>
                      <Input
                        id="branch-rooms"
                        type="number"
                        min={1}
                        value={newBranchData.rooms_count}
                        onChange={(e) => setNewBranchData(prev => ({ ...prev, rooms_count: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewBranchDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateBranch} disabled={isCreatingBranch}>
                      {isCreatingBranch ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        'Crear Sucursal'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {branches.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay sucursales registradas</p>
                  <Button className="mt-4" onClick={() => setIsNewBranchDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primera sucursal
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {branches.map((branch) => (
                    <Card key={branch.id} className={!branch.is_active ? 'opacity-60' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{branch.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {branch.address || 'Sin direccion'}
                            </CardDescription>
                          </div>
                          <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                            {branch.is_active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {branch.phone || '-'}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {branch.email?.split('@')[0] || '-'}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Salas:</span>
                          <span className="font-medium">{branch.rooms_count || 1}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleToggleBranchStatus(branch)}
                          >
                            {branch.is_active ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteBranchId(branch.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Branch Dialog */}
          <AlertDialog open={!!deleteBranchId} onOpenChange={() => setDeleteBranchId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar sucursal?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion eliminara permanentemente la sucursal. Esta accion no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingBranch}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteBranch}
                  disabled={isDeletingBranch}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingBranch ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* Tab: Usuarios (simplificado por ahora) */}
        <TabsContent value="usuarios" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>Administra el acceso al sistema</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Invitar Usuario
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
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
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
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
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Pencil className="mr-1 h-3 w-3" />
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Mensajes */}
        <TabsContent value="mensajes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Mensajes</CardTitle>
              <CardDescription>Configura los mensajes automaticos (proximamente)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configuracion de mensajes disponible proximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Integraciones */}
        <TabsContent value="integraciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integraciones</CardTitle>
              <CardDescription>Conecta servicios externos (proximamente)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Integraciones disponibles proximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
