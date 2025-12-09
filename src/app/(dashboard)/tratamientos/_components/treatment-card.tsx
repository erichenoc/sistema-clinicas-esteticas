'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, MoreVertical, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import type { TreatmentListItem } from '@/types/treatments'

interface TreatmentCardProps {
  treatment: TreatmentListItem
}

export function TreatmentCard({ treatment }: TreatmentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleActive = async () => {
    setIsToggling(true)
    toast.loading(treatment.isActive ? 'Desactivando...' : 'Activando...', { id: 'toggle-status' })
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.dismiss('toggle-status')
    toast.success(`Tratamiento ${treatment.isActive ? 'desactivado' : 'activado'}`)
    setIsToggling(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    toast.loading('Eliminando tratamiento...', { id: 'delete-treatment' })
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.dismiss('delete-treatment')
    toast.success(`Tratamiento "${treatment.name}" eliminado`)
    setIsDeleting(false)
    setShowDeleteDialog(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${!treatment.isActive ? 'opacity-60' : ''}`}>
      {/* Imagen placeholder */}
      <div
        className="h-32 w-full"
        style={{
          backgroundColor: treatment.categoryColor || '#e5e7eb',
          backgroundImage: treatment.imageUrl ? `url(${treatment.imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!treatment.imageUrl && (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl opacity-30">✨</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Categoría */}
            {treatment.categoryName && (
              <Badge
                variant="secondary"
                className="mb-2 text-xs"
                style={{
                  backgroundColor: `${treatment.categoryColor}20`,
                  color: treatment.categoryColor || undefined,
                }}
              >
                {treatment.categoryName}
              </Badge>
            )}

            {/* Nombre */}
            <h3 className="font-semibold truncate" title={treatment.name}>
              {treatment.name}
            </h3>

            {/* Duración */}
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(treatment.durationMinutes)}
            </div>

            {/* Precio */}
            <p className="mt-2 text-lg font-bold text-primary">
              {formatPrice(treatment.price)}
            </p>
          </div>

          {/* Menú de acciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/tratamientos/${treatment.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalles
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/tratamientos/${treatment.id}/editar`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive} disabled={isToggling}>
                {isToggling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : treatment.isActive ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Activar
                  </>
                )}
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
              <AlertDialogTitle>¿Eliminar tratamiento?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente &quot;{treatment.name}&quot; del catálogo. Esta acción no se puede deshacer.
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

        {/* Estado */}
        {!treatment.isActive && (
          <Badge variant="secondary" className="mt-2">
            Inactivo
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
