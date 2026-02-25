'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Bell,
  Palette,
  Save,
  Camera,
  Building,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getProfile, updateProfile, changePassword } from '@/actions/auth'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  owner: 'Propietario',
  doctor: 'Doctor',
  nurse: 'Enfermera',
  receptionist: 'Recepcionista',
}

export default function PerfilPage() {
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'receptionist',
    avatar: null as string | null,
  })

  const [passwordFields, setPasswordFields] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    marketingEmails: false,
    darkMode: false,
  })

  // Load real profile data on mount
  useEffect(() => {
    async function loadProfile() {
      setIsLoadingProfile(true)
      try {
        const profile = await getProfile()
        if (profile) {
          setUser(prev => ({
            ...prev,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phone: profile.phone,
            role: profile.role,
          }))
        }
      } catch {
        toast.error('Error al cargar el perfil')
      } finally {
        setIsLoadingProfile(false)
      }
    }
    loadProfile()
  }, [])

  const handleSaveProfile = async () => {
    if (!user.firstName.trim() || !user.lastName.trim()) {
      toast.error('El nombre y apellido son requeridos')
      return
    }
    setIsSaving(true)
    try {
      const result = await updateProfile({
        firstName: user.firstName.trim(),
        lastName: user.lastName.trim(),
        phone: user.phone.trim(),
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Perfil actualizado correctamente')
      }
    } catch {
      toast.error('Error al actualizar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordFields.currentPassword) {
      toast.error('Ingresa tu contrasena actual')
      return
    }
    if (passwordFields.newPassword.length < 8) {
      toast.error('La nueva contrasena debe tener al menos 8 caracteres')
      return
    }
    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
      toast.error('Las contrasenas no coinciden')
      return
    }

    setIsChangingPassword(true)
    try {
      const result = await changePassword({
        currentPassword: passwordFields.currentPassword,
        newPassword: passwordFields.newPassword,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Contrasena actualizada correctamente')
        setShowPasswordDialog(false)
        setPasswordFields({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch {
      toast.error('Error al cambiar la contrasena')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleClosePasswordDialog = () => {
    if (isChangingPassword) return
    setShowPasswordDialog(false)
    setPasswordFields({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?'

  const roleLabel = ROLE_LABELS[user.role] || user.role

  if (isLoadingProfile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
            <p className="text-muted-foreground">Cargando informacion...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A67C52]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
            <p className="text-muted-foreground">
              Gestiona tu informacion personal y preferencias
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">
            <User className="h-4 w-4 mr-2" />
            Informacion Personal
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Palette className="h-4 w-4 mr-2" />
            Preferencias
          </TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Informacion Personal</CardTitle>
              <CardDescription>
                Actualiza tu informacion de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-[#A67C52] text-white text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Cambiar foto
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG o GIF. Maximo 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={user.firstName}
                    onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={user.lastName}
                    onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                    placeholder="Tu apellido"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electronico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                      className="pl-10 bg-muted cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El correo no puede modificarse desde aqui
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={user.phone}
                      onChange={(e) => setUser({ ...user, phone: e.target.value })}
                      className="pl-10"
                      placeholder="809-000-0000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rol</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Building className="h-4 w-4 text-[#A67C52]" />
                  <span className="font-medium">{roleLabel}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-[#A67C52] hover:bg-[#8a6543]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad de la Cuenta</CardTitle>
              <CardDescription>
                Gestiona tu contrasena y configuracion de seguridad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-[#A67C52]/10 flex items-center justify-center">
                      <Key className="h-5 w-5 text-[#A67C52]" />
                    </div>
                    <div>
                      <p className="font-medium">Contrasena</p>
                      <p className="text-sm text-muted-foreground">
                        Cambia tu contrasena de acceso
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordDialog(true)}
                  >
                    Cambiar contrasena
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-[#A67C52]/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-[#A67C52]" />
                    </div>
                    <div>
                      <p className="font-medium">Autenticacion de dos factores</p>
                      <p className="text-sm text-muted-foreground">
                        Anade una capa extra de seguridad
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">
                    Configurar
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">Sesiones activas</h3>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Este dispositivo</p>
                      <p className="text-sm text-muted-foreground">
                        Ultimo acceso: Ahora
                      </p>
                    </div>
                    <Badge className="bg-green-500">Activa</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>
                Configura como quieres recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por correo</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe actualizaciones importantes por email
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, emailNotifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe alertas urgentes por mensaje de texto
                    </p>
                  </div>
                  <Switch
                    checked={preferences.smsNotifications}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, smsNotifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Recordatorios de citas</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones antes de las citas programadas
                    </p>
                  </div>
                  <Switch
                    checked={preferences.appointmentReminders}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, appointmentReminders: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Correos de marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe ofertas y novedades de Med Luxe
                    </p>
                  </div>
                  <Switch
                    checked={preferences.marketingEmails}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, marketingEmails: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-[#A67C52] hover:bg-[#8a6543]">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar preferencias
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Apariencia</CardTitle>
              <CardDescription>
                Personaliza la apariencia de la aplicacion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo oscuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Cambia entre tema claro y oscuro
                  </p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, darkMode: checked })
                  }
                />
              </div>

              <Separator />

              <div>
                <Label>Idioma</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Selecciona el idioma de la interfaz
                </p>
                <div className="p-3 border rounded-lg bg-muted">
                  <span className="font-medium">Espanol (Republica Dominicana)</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-[#A67C52] hover:bg-[#8a6543]">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar preferencias
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={handleClosePasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar contrasena</DialogTitle>
            <DialogDescription>
              Ingresa tu contrasena actual y la nueva contrasena que deseas usar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contrasena actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordFields.currentPassword}
                  onChange={(e) =>
                    setPasswordFields({ ...passwordFields, currentPassword: e.target.value })
                  }
                  placeholder="Tu contrasena actual"
                  disabled={isChangingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contrasena</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordFields.newPassword}
                  onChange={(e) =>
                    setPasswordFields({ ...passwordFields, newPassword: e.target.value })
                  }
                  placeholder="Minimo 8 caracteres"
                  disabled={isChangingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordFields.newPassword.length > 0 && passwordFields.newPassword.length < 8 && (
                <p className="text-xs text-destructive">
                  La contrasena debe tener al menos 8 caracteres
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nueva contrasena</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordFields.confirmPassword}
                  onChange={(e) =>
                    setPasswordFields({ ...passwordFields, confirmPassword: e.target.value })
                  }
                  placeholder="Repite la nueva contrasena"
                  disabled={isChangingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordFields.confirmPassword.length > 0 &&
                passwordFields.newPassword !== passwordFields.confirmPassword && (
                  <p className="text-xs text-destructive">
                    Las contrasenas no coinciden
                  </p>
                )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleClosePasswordDialog}
              disabled={isChangingPassword}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="bg-[#A67C52] hover:bg-[#8a6543]"
            >
              <Key className="h-4 w-4 mr-2" />
              {isChangingPassword ? 'Cambiando...' : 'Cambiar contrasena'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
