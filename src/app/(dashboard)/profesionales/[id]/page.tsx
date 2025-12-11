'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Star,
  Edit,
  DollarSign,
  Award,
  Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { getProfessionalById, type ProfessionalSummaryData } from '@/actions/professionals'
import { Loader2 } from 'lucide-react'

export default function PerfilProfesionalPage() {
  const params = useParams()
  const router = useRouter()
  const professionalId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [professional, setProfessional] = useState<ProfessionalSummaryData | null>(null)

  useEffect(() => {
    async function loadProfessional() {
      try {
        const data = await getProfessionalById(professionalId)
        if (data) {
          setProfessional(data)
        } else {
          toast.error('Profesional no encontrado')
          router.push('/profesionales')
        }
      } catch (error) {
        console.error('Error loading professional:', error)
        toast.error('Error al cargar el profesional')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfessional()
  }, [professionalId, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!professional) {
    return null
  }

  const initials = `${professional.first_name?.[0] || ''}${professional.last_name?.[0] || ''}`.toUpperCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/profesionales">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Perfil del Profesional</h1>
            <p className="text-muted-foreground">
              Informacion detallada del profesional
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/profesionales/${professionalId}/horarios`}>
              <Clock className="h-4 w-4 mr-2" />
              Horarios
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/profesionales/${professionalId}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={professional.profile_image_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{professional.full_name}</h2>
              {professional.specialties && professional.specialties.length > 0 && (
                <p className="text-muted-foreground">
                  {professional.specialties.slice(0, 2).join(', ')}
                </p>
              )}
              <Badge
                variant={professional.status === 'active' ? 'default' : 'secondary'}
                className="mt-2"
              >
                {professional.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>

              <Separator className="my-4 w-full" />

              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{professional.email}</span>
                </div>
                {professional.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{professional.phone}</span>
                  </div>
                )}
                {professional.license_number && (
                  <div className="flex items-center gap-3 text-sm">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span>Licencia: {professional.license_number}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">
                    {professional.employment_type === 'owner' ? 'Propietario' :
                     professional.employment_type === 'partner' ? 'Socio' :
                     professional.employment_type === 'contractor' ? 'Contratista' : 'Empleado'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{professional.appointments_this_month}</p>
                <p className="text-xs text-muted-foreground">Citas este mes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">
                  RD${professional.revenue_this_month?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-muted-foreground">Ingresos mes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Star className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">
                  {professional.average_rating?.toFixed(1) || '0.0'}
                </p>
                <p className="text-xs text-muted-foreground">Rating promedio</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <User className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{professional.treatments_count || 0}</p>
                <p className="text-xs text-muted-foreground">Tratamientos</p>
              </CardContent>
            </Card>
          </div>

          {/* Commission Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Configuracion de Comisiones
              </CardTitle>
              <CardDescription>
                Estructura de comisiones aplicable a este profesional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Tasa de Comision</p>
                  <p className="text-2xl font-bold text-primary">
                    {professional.default_commission_rate}%
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Tipo de Comision</p>
                  <p className="text-xl font-semibold capitalize">
                    {professional.commission_type === 'percentage' ? 'Porcentaje' :
                     professional.commission_type === 'fixed' ? 'Monto Fijo' : 'Escalonado'}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" asChild>
                  <Link href={`/profesionales/${professionalId}/comisiones`}>
                    Ver Historial de Comisiones
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Specialties */}
          {professional.specialties && professional.specialties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Especialidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {professional.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bio */}
          {professional.bio && (
            <Card>
              <CardHeader>
                <CardTitle>Biografia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{professional.bio}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
