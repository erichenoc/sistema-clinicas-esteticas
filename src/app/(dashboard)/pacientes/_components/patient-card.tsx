'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  Phone,
  Mail,
  DollarSign,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { toast } from 'sonner'
import type { PatientListItem } from '@/types/patients'
import {
  getPatientInitials,
  calculateAge,
  formatPhone,
} from '@/lib/validations/patients'

interface PatientCardProps {
  patient: PatientListItem
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  active: { label: 'Activo', variant: 'default' },
  inactive: { label: 'Inactivo', variant: 'secondary' },
  vip: { label: 'VIP', variant: 'default' },
  blocked: { label: 'Bloqueado', variant: 'destructive' },
}

export function PatientCard({ patient }: PatientCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const age = calculateAge(patient.dateOfBirth)
  const initials = getPatientInitials(patient.firstName, patient.lastName)
  const status = statusConfig[patient.status] || statusConfig.active

  const handleDelete = async () => {
    setIsDeleting(true)
    toast.loading('Eliminando paciente...', { id: 'delete-patient' })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    toast.dismiss('delete-patient')
    toast.success(`Paciente ${patient.firstName} ${patient.lastName} eliminado`)
    setIsDeleting(false)
    setShowDeleteDialog(false)
    // In production, this would call a server action and refresh the page
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin citas'
    return new Intl.DateTimeFormat('es-DO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString))
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <Link
            href={`/pacientes/${patient.id}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={patient.avatarUrl || undefined} />
              <AvatarFallback
                className={
                  patient.status === 'vip'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-primary/10 text-primary'
                }
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">
                {patient.firstName} {patient.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {age ? `${age} años` : 'Edad no registrada'}
              </p>
            </div>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/pacientes/${patient.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/pacientes/${patient.id}/editar`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/agenda/nueva?paciente=${patient.id}`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Nueva cita
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente a {patient.firstName} {patient.lastName} y todos sus datos asociados. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
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

        {/* Estado y tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          <Badge
            variant={status.variant}
            className={
              patient.status === 'vip'
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                : ''
            }
          >
            {status.label}
          </Badge>
          {patient.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {patient.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{patient.tags.length - 2}
            </Badge>
          )}
        </div>

        {/* Información de contacto */}
        <div className="mt-4 space-y-2 text-sm">
          {patient.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span className="truncate">{formatPhone(patient.phone)}</span>
            </div>
          )}
          {patient.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{patient.email}</span>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Última cita</span>
            </div>
            <p className="font-medium mt-1">
              {formatDate(patient.lastAppointmentAt)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>Total</span>
            </div>
            <p className="font-medium mt-1 text-primary">
              {formatPrice(patient.totalSpent)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
