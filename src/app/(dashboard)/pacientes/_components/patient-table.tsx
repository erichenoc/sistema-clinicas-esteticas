'use client'

import Link from 'next/link'
import {
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  Phone,
  MessageCircle,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { PatientListItem } from '@/types/patients'
import {
  getPatientInitials,
  calculateAge,
  formatPhone,
} from '@/lib/validations/patients'

interface PatientTableProps {
  patients: PatientListItem[]
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

export function PatientTable({ patients }: PatientTableProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Intl.DateTimeFormat('es-DO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString))
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox />
            </TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Citas</TableHead>
            <TableHead>Última Cita</TableHead>
            <TableHead className="text-right">Total Gastado</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => {
            const age = calculateAge(patient.dateOfBirth)
            const initials = getPatientInitials(patient.firstName, patient.lastName)
            const status = statusConfig[patient.status] || statusConfig.active

            return (
              <TableRow key={patient.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={patient.avatarUrl || undefined} />
                      <AvatarFallback
                        className={
                          patient.status === 'vip'
                            ? 'bg-yellow-100 text-yellow-700 text-xs'
                            : 'bg-primary/10 text-primary text-xs'
                        }
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/pacientes/${patient.id}`}
                        className="font-medium hover:underline"
                      >
                        {patient.firstName} {patient.lastName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {age ? `${age} años` : 'Edad no registrada'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {patient.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{formatPhone(patient.phone)}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                          <a
                            href={`https://wa.me/1${patient.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-3 w-3 text-green-600" />
                          </a>
                        </Button>
                      </div>
                    )}
                    {patient.email && (
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {patient.email}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
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
                    {patient.tags.slice(0, 1).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {patient.tags.length > 1 && (
                      <Badge variant="outline" className="text-xs">
                        +{patient.tags.length - 1}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{patient.totalAppointments}</span>
                </TableCell>
                <TableCell>{formatDate(patient.lastAppointmentAt)}</TableCell>
                <TableCell className="text-right font-medium text-primary">
                  {formatPrice(patient.totalSpent)}
                </TableCell>
                <TableCell>
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
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
